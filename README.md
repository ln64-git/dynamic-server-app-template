# Dynamic Server App Template

A template for turning any class-based application into a dynamic, remotely controllable service via CLI or HTTP.

## Overview

This framework was designed to **interact with class-based applications** both locally and remotely. It exposes internal state and methods of your class through:

- **CLI flags** — Set state at launch (`--key value`)
- **HTTP API** — Get/set state or invoke methods via REST

Everything is inferred directly from your class.

---

## Key Features

- 🧠 Auto-generates HTTP API from class methods
- 🔁 Live state view/update via `/state`
- 🛰 Remote method invocation
- 🛠 CLI-to-class-state mapping
- ⚡️ Runs fast with Bun

---

## Example

```ts
class SampleApp extends DynamicServerApp<{ port: number; message: string }> {
  port = 3000;
  message = "Hello";

  async greet() {
    console.log(this.message);
  }
}
````

Run it:

```bash
bun run src/index.ts --message "Hi" --port 4000
```

Interact:

* `GET /state` → `{ "message": "Hi", "port": 4000 }`
* `POST /state` → update values
* `POST /greet` → logs message

---

## Usage

1. Extend `DynamicServerApp<T>`
2. Add state fields and async methods
3. Run with `runDynamicApp(new YourClass())`

---

## Perfect For

* CLI tools with web APIs
* Background workers or daemons
* Dev tools with live tweaking
* Remote control surfaces for local code


