# Dynamic Server App Template

**A minimalist TypeScript framework: your class becomes a web API.**

Write your methods once. Call them locally or over HTTP.

Built on Bun. TypeScript. Zero config. **~280 lines of code.**

## Quick Start

```bash
git clone <repo> my-app
cd my-app
bun install
bun run start
```

## Usage

### 1. Create Your Class

```typescript
import { App } from "@core/app";

class MyApp extends App {
  message = "Hello, world!";

  async defaultFunction() {
    return this.message;
  }

  async greet(name: string) {
    return `Hello, ${name}! ${this.message}`;
  }
}
```

### 2. Run It

```bash
# Run locally (executes defaultFunction)
bun run start

# Start as HTTP server
bun run start --serve

# Use specific port
bun run start --serve --port 3000

# Enable dev mode (method timing)
bun run start --dev
```

## Features

### Automatic State Persistence

All properties are automatically saved to `.app-state.json`:

```typescript
class Counter extends App {
  count = 0;

  async increment() {
    this.count++;  // Auto-saved!
    return this.count;
  }
}
```

### Dual Mode: Local or Remote

The same code runs locally or as an HTTP server:

```bash
# Local execution
bun run start

# Server mode
bun run start --serve
```

### JSON-RPC API

When running as a server, methods become HTTP endpoints:

```bash
# Health check
curl http://localhost:2000/health

# Get state
curl http://localhost:2000/state

# Call method (JSON-RPC format)
curl -X POST http://localhost:2000/ \
  -H "Content-Type: application/json" \
  -d '{"method":"greet","params":["Alice"]}'

# Update state
curl -X POST http://localhost:2000/state \
  -H "Content-Type: application/json" \
  -d '{"message":"Updated!"}'
```

## Examples

### Todo App

```typescript
class TodoApp extends App {
  todos: string[] = [];

  async defaultFunction() {
    return `You have ${this.todos.length} todos`;
  }

  async add(todo: string) {
    this.todos.push(todo);
    return this.todos;
  }

  async list() {
    return this.todos;
  }

  async clear() {
    this.todos = [];
    return "Cleared!";
  }
}
```

### Build System

```typescript
class BuildSystem extends App {
  isBuilding = false;
  lastBuildTime: string | null = null;

  async build() {
    this.isBuilding = true;
    // Your build logic here
    await new Promise(r => setTimeout(r, 1000));
    this.lastBuildTime = new Date().toISOString();
    this.isBuilding = false;
    return "Build complete!";
  }

  async status() {
    return {
      building: this.isBuilding,
      lastBuild: this.lastBuildTime
    };
  }
}
```

### Data Processor

```typescript
class DataProcessor extends App {
  queue: Array<{id: number, data: any}> = [];
  processed = 0;

  async addJob(data: any) {
    this.queue.push({ id: Date.now(), data });
    return `Queued job #${this.queue.length}`;
  }

  async process() {
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      // Process job...
      this.processed++;
    }
    return `Processed ${this.processed} total jobs`;
  }
}
```

## API Reference

### Base Class: `App`

```typescript
abstract class App {
  port: number = 2000;

  // Serialize to JSON (excludes methods)
  toJSON(): Record<string, JSONValue>

  // Load from JSON
  fromJSON(data: Record<string, JSONValue>): void

  // Save state to .app-state.json
  async save(): Promise<void>

  // Load state from .app-state.json
  async load(): Promise<void>

  // Check if server is running on port
  async probe(): Promise<boolean>

  // Set state (local or remote)
  async setState(updates: Record<string, JSONValue>): Promise<Record<string, JSONValue> | undefined>
}
```

### Main Runner: `run(app)`

```typescript
async function run<T extends App>(app: T): Promise<void>
```

Handles CLI parsing, state loading, auto-save setup, and mode dispatch.

## CLI Flags

- `--serve` - Start HTTP server
- `--port <number>` - Set port (default: 2000)
- `--dev` - Enable development mode (method timing)

## HTTP Endpoints

When running with `--serve`:

- `GET /health` - Health check
- `GET /state` - Get current state
- `POST /state` - Update state (with diff)
- `POST /` - JSON-RPC method dispatch

### JSON-RPC Format

```json
{
  "method": "methodName",
  "params": ["arg1", "arg2"]
}
```

Response:

```json
{
  "result": "return value"
}
```

## Architecture

The framework is built on three core concepts:

1. **Proxy-based Auto-Save** - Property changes trigger automatic state persistence
2. **JSON-RPC** - Standard protocol for remote method invocation
3. **Bun Native APIs** - Leverages `Bun.serve`, `Bun.write`, `Bun.file`

**Total: ~280 lines of code** (down from 670 lines in previous version)

## Migration from v1

If migrating from the older DynamicServerApp:

### Class Declaration

```typescript
// Old
class MyClass extends DynamicServerApp<ExtractState<MyClass>> { }

// New
class MyClass extends App { }
```

### Runner Function

```typescript
// Old
await runDynamicApp(instance);

// New
await run(instance);
```

### HTTP API

```typescript
// Old: POST /methodName with array body
curl -X POST http://localhost:3000/greet -d '["Alice"]'

// New: POST / with JSON-RPC format
curl -X POST http://localhost:3000/ -d '{"method":"greet","params":["Alice"]}'
```

### Removed Features

- `--notify` flag (desktop notifications)
- `--view` flag (show structure)
- `--set-state` / `--target-port` flags
- `set/get` CLI commands
- `GET /methods` endpoint
- Port-specific state files

## Why This Approach?

**Minimal** - Everything fits in one file (~280 lines)
**Elegant** - Uses modern JavaScript Proxy and Bun APIs
**Powerful** - Full HTTP API with zero configuration
**Type-Safe** - Full TypeScript support
**Fast** - Built on Bun, uses efficient state diffing

## License

MIT
