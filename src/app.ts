

export abstract class DynamicServerApp<T extends Record<string, any>> {
  abstract port: number;

  getState(): Partial<T> {
    const state: Partial<T> = {};
    const self = this as unknown as T & ThisType<this>;
    for (const key of Object.getOwnPropertyNames(self) as (keyof T)[]) {
      const val = self[key];
      if (typeof val !== "function") state[key] = val;
    }
    return state;
  }

  applyStateUpdate(data: Partial<T>): void {
    Object.entries(data).forEach(([key, value]) => {
      if (key in this) (this as any)[key] = value;
    });
  }

  getMetadata(): Record<string, string> {
    return Object.getOwnPropertyNames(this).reduce((meta, key) => {
      const val = (this as any)[key];
      if (typeof val !== "function") meta[key] = typeof val;
      return meta;
    }, {} as Record<string, string>);
  }

  async probe(timeout = 1000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`http://localhost:${this.port}/state`, {
        signal: controller.signal,
      });

      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  async set(diff: Partial<T>): Promise<void> {
    await fetch(`http://localhost:${this.port}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(diff),
    });
  }
}

export async function runDynamicApp<T extends Record<string, any>>(
  appInstance: DynamicServerApp<T>
): Promise<void> {
  const { state, rawFlags } = cliToState(appInstance.getState() as T);
  const stateDiff = diffStatePatch(state, appInstance.getState() as T);

  const routes = buildRoutes(appInstance);

  if (rawFlags.length) {
    const handler = routes[`/${rawFlags[0]}`];
    if (handler) return await handler(appInstance);
  }

  if (!(await appInstance.probe())) {
    console.log(`Starting server on port ${appInstance.port}...`);
    return startServer(appInstance, { port: appInstance.port, routes });
  }

  if (Object.keys(stateDiff).length > 0) {
    await appInstance.set(stateDiff);
  }
}

function buildRoutes<T extends Record<string, any>>(
  appInstance: DynamicServerApp<T>
): Record<string, RemoteAction<T>> {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(appInstance))
    .filter(key => key !== "constructor" && typeof (appInstance as any)[key] === "function")
    .reduce((acc, key) => {
      acc[`/${key}`] = async (app) => await (app as any)[key]();
      return acc;
    }, {} as Record<string, RemoteAction<T>>);
}

export type RemoteAction<T extends Record<string, any>> = (
  appInstance: DynamicServerApp<T>
) => Promise<any>;

export function startServer<T extends Record<string, any>>(
  appInstance: DynamicServerApp<T>,
  options: {
    port?: number;
    routes?: Record<string, RemoteAction<T>>;
  } = {}
) {
  const port = options.port ?? 2001;
  const routes = options.routes ?? {};

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const method = req.method;

      if (url.pathname === "/state") {
        if (method === "GET") return Response.json(appInstance.getState());

        if (method === "POST") {
          try {
            const body = await req.json() as Partial<T>;
            appInstance.applyStateUpdate(body);
            return Response.json({ status: "updated", state: appInstance.getState() });
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }
        }
      }

      const routeHandler = routes[url.pathname];
      if (method === "POST" && routeHandler) {
        try {
          const result = await routeHandler(appInstance);
          return Response.json({ status: "ok", result });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 500 });
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  });
}

// src/core/CLI.ts
export function cliToState<T extends Record<string, any>>(defaults: T): { state: T; rawFlags: string[] } {
  const args = process.argv.slice(2);
  const state = { ...defaults };
  const rawFlags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg?.startsWith("--")) continue;

    const key = arg.slice(2) as keyof T;
    const next = args[i + 1];

    if (key in defaults) {
      const current = defaults[key];
      const type = typeof current;

      if (type === "number" && next && !isNaN(Number(next))) {
        state[key] = Number(next) as T[typeof key];
        i++;
      } else if (type === "boolean") {
        state[key] = (next === undefined || next === "true") as T[typeof key];
      } else if (next && !next.startsWith("--")) {
        state[key] = next as T[typeof key];
        i++;
      }
    } else {
      rawFlags.push(String(key));
    }
  }

  return { state, rawFlags };
}

export function diffStatePatch<T extends Record<string, any>>(cliArgs: T, defaults: T): Partial<T> {
  const patch: Partial<T> = {};
  for (const key in cliArgs) {
    if (cliArgs[key] !== defaults[key]) {
      patch[key] = cliArgs[key];
    }
  }
  return patch;
}