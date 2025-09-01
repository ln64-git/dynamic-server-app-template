# 🧙‍♂️ Dynamic Server App Template

A powerful, type-safe dynamic server framework built on **Bun**. Extend this abstract class to build highly customizable backend apps with introspectable state, CLI control, and auto-routed HTTP methods.

## ✨ Features

- 🧠 State introspection & dynamic updates
- 🛡️ Type-safe state management
- ⚙️ Built-in HTTP JSON API (`/state`, `/method`)
- 🧪 Probes for live server detection
- 📟 CLI flags to get/set server state directly
- 🧬 Auto-routing of class methods as endpoints

## 📦 Tech Stack

- [Bun](https://bun.sh)

## 🔧 Usage

### 1. Extend the `DynamicServerApp`

```ts
import { DynamicServerApp } from "../core/app";

export interface SampleState {
  port: number;
}

export class SampleClass extends DynamicServerApp<SampleState> {
  port = 2000;
  message = "Hello, world!";

  async defaultFunction(): Promise<string> {
    return this.message + " from defaultFunction";
  }

  async sampleFunction(): Promise<void> {
    console.log(this.message);
  }
}
````

### 2. Run the App

```ts
import { runDynamicApp } from "./app";
import { SampleClass } from "./SampleClass";

runDynamicApp(new SampleClass());
```

## 🖥️ API Endpoints

| Endpoint         | Method | Description                            |
| ---------------- | ------ | -------------------------------------- |
| `/state`         | GET    | Fetch current application state        |
| `/state`         | POST   | Update application state via JSON      |
| `/<method-name>` | POST   | Auto-exposed instance methods via path |

## 🧪 CLI Flags

| Flag          | Description                     |
| ------------- | ------------------------------- |
| `--serve`     | Start interactive server UI     |
| `--notify`    | Enable desktop notifications     |
| `--port N`    | Use specific port number        |

## 🚀 Server Lifecycle

1. **Default behavior**: 
   - If a `defaultFunction` exists, it runs automatically and exits
   - If no `defaultFunction` exists, shows interactive UI
2. **Commands**: `get`, `set`, `call` execute and return output directly
3. **UI Commands**: `cli` shows interactive UI
4. **Help Commands**: `help`, `--help` show help information
5. **With `--serve` flag**: Starts server and shows interactive UI
6. Auto-routes all non-constructor methods as POST endpoints when server is running

## 🧠 Method Routing Example

```ts
// Call this remotely:
await fetch('/sampleFunction', { method: 'POST' });
```

## 📚 Schema Validation

All state changes and updates are type-checked using TypeScript interfaces. Automatically supports partial updates.

## 🧙‍♂️ CLI to State

CLI state parsing supports dynamic mutation via `--key value` syntax. Use `-get` to fetch specific keys, `-set` to apply.

## 🛠️ Usage Examples

**Command-line usage:**
```bash
# Run defaultFunction (if it exists), otherwise show UI
bun run start

# Show interactive UI
bun run start cli
bun run start help
bun run start --help

# Get a value
bun run start get message

# Set a value  
bun run start set message "Hello World"

# Call a function
bun run start call sampleFunction

# Start server and show interactive UI
bun run start --serve
```

**Development:**
```bash
bun run start
```

## 🔐 Type Safety

Powered by TypeScript interfaces — state and routes are always strictly typed.

## 🧩 Extensibility

* Add any methods → automatically exposed as API routes.
* Add more fields to the TypeScript interface → instantly supported in state.
