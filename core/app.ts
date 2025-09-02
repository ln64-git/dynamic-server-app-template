
import { isEqual } from "lodash";
import { exec } from "child_process";
import net from "net";
import http from "http";

// Utility type to extract state from class properties
export type ExtractState<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export abstract class DynamicServerApp<T extends Record<string, any>> {
  abstract port: number;

  isServerInstance = false;
  systemMessage: string | null = null;
  systemLog: string[] = [];

  setSystemMessage(msg: string) {
    this.systemMessage = msg;
    this.systemLog.push(msg);
    if (this.systemLog.length > 100) this.systemLog.shift();
    if ((this as any).notifyEnabled && msg.includes("✅")) {
      sendNotification("System Update", msg);
    }
  }


  public getState(): Partial<T> {
    const state: Partial<T> = {};
    const exclude = new Set([
      "schema",
      "logToUI",
      "notifyEnabled",
      "isServerInstance",
      "systemMessage",
      "systemLog"
    ]);

    for (const key of Object.keys(this)) {
      if (!exclude.has(key) && typeof (this as any)[key] !== "function") {
        state[key as keyof T] = (this as any)[key];
      }
    }

    let proto = Object.getPrototypeOf(this);
    while (proto && proto !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor" || key in state || exclude.has(key)) continue;
        const desc = Object.getOwnPropertyDescriptor(proto, key);
        if (desc?.get) state[key as keyof T] = (this as any)[key];
      }
      proto = Object.getPrototypeOf(proto);
    }
    return state;
  }

  applyStateUpdate(data: Partial<T>): void {
    // Simple validation: only update properties that exist on the instance
    Object.entries(data).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(this, key) || !(key in this)) {
        (this as any)[key] = value;
      }
    });
  }

  async probe(timeout = 1000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(`http://localhost:${this.port}/state`, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  async setState(diff: Partial<T>): Promise<Partial<T> | undefined> {
    const isLocal = !(await this.probe());
    if (isLocal) {
      this.applyStateUpdate(diff);
      return this.getState();
    }
    try {
      const res = await fetch(`http://localhost:${this.port}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diff),
      });
      const response = await res.json() as { state?: Partial<T> };
      return response?.state;
    } catch (e) {
      console.error("❌ Failed to set state:", e);
    }
    return undefined;
  }
}

export async function runDynamicApp<T extends Record<string, any>>(
  app: DynamicServerApp<T>
): Promise<void> {
  const { command, key, value, serve, notify, port } = cliToState(
    app.getState() as T
  );
  if (port) app.port = port; // <- this is required
  (app as any).notifyEnabled = notify;

  const handleResult = (res: any) => {
    if (res !== undefined) {
      // Always output results unless we're in serve mode
      if (!serve) console.log(res);
      if (notify) sendNotification("✅ App Finished", `Port ${app.port}`);
      if (typeof res === "string") app.setSystemMessage(res);
    }
  };

  // ── get ────────────────────────────────────────────────────────────────
  if (command === "get" && key) {
    const isRunning = await app.probe();
    const state = isRunning
      ? await fetch(`http://localhost:${app.port}/state`).then(r => r.json())
      : app.getState();
    handleResult((state as T)[key as keyof T]);
    process.exit(0);
  }

  // ── set ────────────────────────────────────────────────────────────────
  if (command === "set" && key && value !== undefined) {
    const newState = await app.setState({ [key]: value } as Partial<T>);
    handleResult(newState?.[key as keyof T]);
    process.exit(0);
  }

  // ── call ───────────────────────────────────────────────────────────────
  if (command === "call" && key) {
    const argsIndex = process.argv.indexOf(key) + 1;
    const args = [process.argv.slice(argsIndex).filter(arg => !arg.startsWith("--")).join(" ")];

    const isRunning = await app.probe();

    if (isRunning) {
      const res = await fetch(`http://localhost:${app.port}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args), // ✅ Send real arguments
      }).then(r => r.json());

      handleResult((res as { result?: any }).result);
      process.exit(0);
    }

    // fallback: call function locally if server is not running
    if (!isRunning) {
      try {
        const res = await (app as any)[key](...(Array.isArray(args) ? args : []));
        handleResult(res);
        process.exit(0);
      } catch (err: any) {
        console.error(`Error calling function ${key}:`, err.message);
        process.exit(1);
      }
    }

    return;
  }

  // ── help commands ──────────────────────────────────────────────────────────
  if (command === "help") {
    showHelp();
    process.exit(0);
  }

  // ── cli command ────────────────────────────────────────────────────────────
  if (command === "cli") {
    // This command should show the UI, so we return without doing anything
    // The main.tsx will handle showing the UI
    return;
  }

  // ── serve command ──────────────────────────────────────────────────────────
  if (serve) {
    // Start server and then show CLI
    await startServer(app, {
      port: app.port,
      routes: buildRoutes(app),
    });
    // Don't exit here, let main.tsx handle showing the UI
    return;
  }

  // ── default function ──────────────────────────────────────────────────────
  // If no command provided and not in serve mode, try to run defaultFunction
  if (!command && !serve) {
    if (typeof (app as any).defaultFunction === "function") {
      try {
        const res = await (app as any).defaultFunction();
        handleResult(res);
        process.exit(0);
      } catch (err: any) {
        console.error("Error running defaultFunction:", err.message);
        process.exit(1);
      }
    }
    // If no defaultFunction exists, return to show UI
    return;
  }
}

function buildRoutes<T extends Record<string, any>>(app: DynamicServerApp<T>): Record<string, RemoteAction<T>> {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(app))
    .filter(k => k !== "constructor" && typeof (app as any)[k] === "function")
    .reduce((routes, key) => {
      routes[`/${key}`] = async (app, args) => await (app as any)[key](...(Array.isArray(args) ? args : []));
      return routes;
    }, {} as Record<string, RemoteAction<T>>);
}

export type RemoteAction<T extends Record<string, any>> = (app: DynamicServerApp<T>, args?: any) => Promise<any>;

export async function startServer<T extends Record<string, any>>(
  app: DynamicServerApp<T>,
  options: { port?: number; routes?: Record<string, RemoteAction<T>> } = {}
) {
  let port = await findAvailablePort(options.port ?? 2001);
  app.port = port;
  const routes = options.routes ?? {};

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const method = req.method ?? "GET";

    if (url.pathname === "/state") {
      if (method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(app.getState()));
      } else if (method === "POST") {
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            const patch: Partial<T> = {};
            const current = app.getState();
            for (const key in parsed) {
              if (!isEqual(parsed[key], current[key])) (patch as any)[key] = parsed[key];
            }
            if (Object.keys(patch).length) app.applyStateUpdate(patch);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", state: app.getState() }));
          } catch (err: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message || "Invalid JSON" }));
          }
        });
      } else {
        res.writeHead(405);
        res.end("Method Not Allowed");
      }
      return;
    }

    if (method === "POST" && routes[url.pathname]) {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body);
          const result = await routes[url.pathname]!(app, parsed);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok", result }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  app.isServerInstance = true;
  server.listen(port, () => {
    if ((app as any).notifyEnabled) sendNotification("🟢 Server Started", `Listening on port ${port}`);
  });
}

export function cliToState<T extends Record<string, any>>(defaults: T): {
  command: "get" | "set" | "call" | "cli" | "help" | null;
  key?: string;
  value?: string;
  serve: boolean;
  notify: boolean;
  port?: number;
} {
  const args = process.argv.slice(2);
  let command: "get" | "set" | "call" | "cli" | "help" | null = null;
  let serve = false;
  let notify = false;
  let key: string | undefined;
  let value: string | undefined;
  let port: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg === "string" && ["get", "set", "call", "cli", "help"].includes(arg)) {
      command = arg as any;
      if (["get", "set", "call"].includes(arg)) {
        key = args[i + 1];
        value = args[i + 2];
      }
    }
    if (arg === "--serve") serve = true;
    if (arg === "--notify") notify = true;
    if (arg === "--port") port = Number(args[i + 1]);
    if (arg === "--help") command = "help";
  }

  return { command, key, value, serve, notify, port };
}


export function diffStatePatch<T extends Record<string, any>>(cliArgs: T, current: Partial<T>): Partial<T> {
  return Object.fromEntries(Object.entries(cliArgs).filter(([k, v]) => v !== undefined && v !== current[k])) as Partial<T>;
}

export function sendNotification(title: string, body: string) {
  exec(`notify-send "${title}" "${body.replace(/"/g, '\\"')}"`);
}

function showHelp() {
  console.log(`
🧙‍♂️ Dynamic Server App

USAGE:
  bun run start [COMMAND] [OPTIONS]

COMMANDS:
  (no command)     Run defaultFunction if exists, otherwise show interactive UI
  cli              Show interactive UI
  help             Show this help message
  get <key>        Get a state value
  set <key> <val>  Set a state value
  call <func>      Call a function

OPTIONS:
  --serve          Start server and show interactive UI
  --notify         Enable desktop notifications
  --port <num>     Use specific port number

EXAMPLES:
  bun run start                    # Run defaultFunction or show UI
  bun run start cli                # Show interactive UI
  bun run start get message        # Get message value
  bun run start set message "Hi"   # Set message to "Hi"
  bun run start call myFunction    # Call myFunction
  bun run start --serve            # Start server with UI
  bun run start --help             # Show this help

For more information, visit: https://github.com/your-repo
`);
}

async function findAvailablePort(start: number, maxAttempts = 50): Promise<number> {
  for (let port = start, i = 0; i < maxAttempts; i++, port++) {
    const isFree = await new Promise<boolean>(resolve => {
      const server = net.createServer()
        .once("error", () => resolve(false))
        .once("listening", () => server.close(() => resolve(true)))
        .listen(port);
    });
    if (isFree) return port;
  }
  throw new Error(`No available ports found starting from ${start}`);
}
