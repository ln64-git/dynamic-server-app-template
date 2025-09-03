
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

  public getState(): Partial<T> {
    const state: Partial<T> = {};
    const exclude = new Set([
      "schema",
      "logToUI",
      "notifyEnabled",
      "isServerInstance"
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
  const { serve, notify, port } = cliToState(app.getState() as T);
  if (port) app.port = port;
  (app as any).notifyEnabled = notify;

  // Check if there's already a server running on this port (only if port was explicitly set)
  let isServerRunning = false;
  if (port) {
    isServerRunning = await app.probe();
    if (isServerRunning && !serve) {
      console.log(`🔹 Connected to existing server on port ${app.port}`);
    } else if (!isServerRunning && !serve) {
      console.log(`🔸 Server not found on port ${app.port}`);
    }
  }


  const handleResult = (res: any) => {
    if (res !== undefined) {
      console.log(res);
      if (notify) sendNotification("🔹 App Finished", `Port ${app.port}`);
    }
  };

  // ── serve command ──────────────────────────────────────────────────────────
  if (serve) {
    if (isServerRunning) console.log(`🔸  Server already running on port ${app.port}. Starting on next available port...`);
    await startServer(app, {
      port: app.port,
      routes: buildRoutes(app),
    });
    return;
  }

  // ── default function ──────────────────────────────────────────────────────
  if (typeof (app as any).defaultFunction === "function") {
    try {
      const res = await (app as any).defaultFunction();
      handleResult(res);
      process.exit(0);
    } catch (err: any) {
      console.error("🔸 Error running defaultFunction:", err.message);
      process.exit(1);
    }
  } else {
    console.log("🔸 No defaultFunction found. App completed.");
    process.exit(0);
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
    console.log(`🔹 Server started on port ${port}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    server.close(() => {
      process.exit(0);
    });
    // Force close after 5 seconds
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  };
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

export function cliToState<T extends Record<string, any>>(defaults: T): {
  serve: boolean;
  notify: boolean;
  port?: number;
} {
  const args = process.argv.slice(2);
  let serve = false;
  let notify = false;
  let port: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--serve") serve = true;
    if (arg === "--notify") notify = true;
    if (arg === "--port") port = Number(args[i + 1]);
  }

  return { serve, notify, port };
}


export function diffStatePatch<T extends Record<string, any>>(cliArgs: T, current: Partial<T>): Partial<T> {
  return Object.fromEntries(Object.entries(cliArgs).filter(([k, v]) => v !== undefined && v !== current[k])) as Partial<T>;
}

export function sendNotification(title: string, body: string) {
  exec(`notify-send "${title}" "${body.replace(/"/g, '\\"')}"`);
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
