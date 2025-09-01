# 🧙‍♂️ Dynamic Server App Framework - AI Scaffolding Specification

## Overview

This document provides a comprehensive specification for AI assistants to scaffold a Dynamic Server App Framework. The framework allows developers to create type-safe, stateful applications with built-in HTTP API, CLI interface, and interactive UI.

## Core Architecture

### 1. Base Class Structure

```typescript
// core/app.ts
export abstract class DynamicServerApp<T extends Record<string, any>> {
  abstract port: number;
  isServerInstance = false;
  systemMessage: string | null = null;
  systemLog: string[] = [];

  // Core methods that must be implemented
  getState(): Partial<T>
  applyStateUpdate(data: Partial<T>): void
  async probe(timeout?: number): Promise<boolean>
  async setState(diff: Partial<T>): Promise<Partial<T> | undefined>
  setSystemMessage(msg: string): void
}
```

### 2. State Management

- **Type Safety**: Uses TypeScript interfaces for state definition
- **Dynamic Updates**: State can be updated via HTTP API or CLI
- **Introspection**: Current state is always accessible via `/state` endpoint
- **Validation**: Simple property existence checking (no runtime type validation)

### 3. HTTP Server Features

- **Auto-routing**: All non-constructor methods become POST endpoints
- **State Endpoint**: `GET /state` returns current state, `POST /state` updates state
- **Method Endpoints**: `POST /<method-name>` calls instance methods
- **Error Handling**: Proper HTTP status codes and JSON error responses

## Command Line Interface

### 1. Command Structure

```bash
bun run start [COMMAND] [OPTIONS]
```

### 2. Available Commands

| Command | Behavior |
|---------|----------|
| `(no command)` | Runs `defaultFunction` if exists, otherwise shows UI |
| `cli` | Shows interactive UI |
| `help` | Shows help information and exits |
| `--help` | Shows help information and exits |
| `get <key>` | Gets a state value and prints it |
| `set <key> <value>` | Sets a state value and prints result |
| `call <function>` | Calls a function and prints result |
| `--serve` | Starts server and shows interactive UI |

### 3. CLI Parsing Logic

```typescript
// Parse arguments in order of precedence:
// 1. Commands: get, set, call, cli, help
// 2. Flags: --serve, --notify, --port, --help
// 3. Default behavior based on defaultFunction existence
```

## Interactive UI (CLI)

### 1. UI Framework
- **Technology**: React + Ink (terminal UI)
- **Real-time Updates**: Refreshes every 1000ms
- **Command History**: Up/down arrow navigation
- **Syntax Highlighting**: Different colors for commands, variables, functions

### 2. UI Features
- **State Display**: Shows all state variables with values
- **Function List**: Lists all available methods
- **Command Input**: Interactive command line with history
- **System Messages**: Shows recent system log messages
- **Server Status**: Indicates if connected to remote server

### 3. UI Commands
- `get <key>` - Get state value
- `set <key> <value>` - Set state value  
- `call <function>` - Call function
- `exit` - Exit the application

## Default Function Behavior

### 1. Default Function Detection
```typescript
// If a method named 'defaultFunction' exists:
if (typeof (app as any).defaultFunction === "function") {
  // Run it automatically when no command is provided
  const result = await (app as any).defaultFunction();
  console.log(result);
  process.exit(0);
}
```

### 2. Fallback Behavior
```typescript
// If no defaultFunction exists:
// Show interactive UI instead
```

## Server Lifecycle

### 1. Startup Logic
```typescript
// 1. Parse CLI arguments
// 2. Handle help commands (exit immediately)
// 3. Handle specific commands (get, set, call)
// 4. Handle serve flag (start server + UI)
// 5. Handle default behavior (defaultFunction or UI)
```

### 2. Server Management
- **Port Detection**: Automatically finds available ports
- **Probe System**: Checks if server is already running
- **Remote Calls**: Commands can work with remote servers
- **Local Fallback**: Falls back to local execution if server unavailable

## Project Structure

```
project/
├── core/
│   ├── app.ts          # Main framework logic
│   ├── cli.tsx         # Interactive UI component
│   ├── main.tsx        # Application entry point
│   └── SPEC.md         # This specification
├── src/
│   └── SampleClass.ts  # Example implementation
├── tests/
│   └── app.test.ts     # Test suite
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # User documentation
```

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^19.1.0",
    "ink": "^6.0.0",
    "ink-text-input": "^6.0.0",
    "vitest": "^3.2.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^22.15.29",
    "@types/lodash": "^4.17.17",
    "@types/react": "^19.1.6"
  }
}
```

### Key Technologies
- **Runtime**: Bun (JavaScript runtime)
- **UI**: React + Ink (terminal UI)
- **Testing**: Vitest
- **Type Safety**: TypeScript
- **Utilities**: Lodash (for deep equality checks)

## Implementation Steps for AI

### 1. Create Base Framework
1. Set up TypeScript configuration with path mapping
2. Create abstract `DynamicServerApp` class
3. Implement state management methods
4. Add HTTP server functionality
5. Create CLI argument parsing

### 2. Add Interactive UI
1. Set up React + Ink components
2. Create command input interface
3. Add real-time state display
4. Implement command history
5. Add syntax highlighting

### 3. Implement Command System
1. Create help system with comprehensive documentation
2. Implement get/set/call commands
3. Add default function detection
4. Create serve mode functionality
5. Add proper error handling

### 4. Add Testing
1. Create test suite for core functionality
2. Test state management
3. Test HTTP endpoints
4. Test CLI commands
5. Test error scenarios

### 5. Create Documentation
1. Write comprehensive README
2. Add usage examples
3. Document API endpoints
4. Create this specification document

## Key Implementation Details

### 1. State Management
```typescript
// Get state by iterating through instance properties
getState(): Partial<T> {
  const state: Partial<T> = {};
  const exclude = new Set(["schema", "isServerInstance", "systemMessage", "systemLog"]);
  
  for (const key of Object.keys(this)) {
    if (!exclude.has(key) && typeof (this as any)[key] !== "function") {
      state[key as keyof T] = (this as any)[key];
    }
  }
  
  return state;
}
```

### 2. HTTP Server Setup
```typescript
// Create HTTP server with auto-routing
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  
  // Handle /state endpoint
  if (url.pathname === "/state") {
    // GET: return state, POST: update state
  }
  
  // Handle method endpoints
  if (method === "POST" && routes[url.pathname]) {
    // Call method and return result
  }
});
```

### 3. CLI Command Handling
```typescript
// Parse and execute commands
if (command === "get" && key) {
  const state = await app.getState();
  console.log(state[key]);
  process.exit(0);
}

if (command === "set" && key && value) {
  const newState = await app.setState({ [key]: value });
  console.log(newState?.[key]);
  process.exit(0);
}
```

## Testing Strategy

### 1. Unit Tests
- Test state management methods
- Test CLI parsing logic
- Test HTTP server responses
- Test error handling

### 2. Integration Tests
- Test full command execution
- Test server startup/shutdown
- Test UI component rendering
- Test real-time updates

### 3. Mock Strategy
- Mock HTTP requests for server tests
- Mock file system for configuration tests
- Mock user input for CLI tests

## Error Handling

### 1. HTTP Errors
- 400: Bad Request (invalid JSON)
- 404: Not Found (unknown endpoint)
- 405: Method Not Allowed
- 500: Internal Server Error

### 2. CLI Errors
- Invalid command syntax
- Missing required arguments
- Function not found
- Network connection errors

### 3. State Errors
- Invalid state updates
- Type mismatches
- Property access errors

## Performance Considerations

### 1. State Updates
- Use deep equality checks to avoid unnecessary updates
- Limit system log to 100 entries
- Batch state changes when possible

### 2. HTTP Server
- Use connection pooling
- Implement request timeouts
- Add rate limiting for production use

### 3. UI Updates
- Throttle real-time updates (1000ms interval)
- Use React.memo for expensive components
- Implement virtual scrolling for large state objects

## Security Considerations

### 1. Input Validation
- Validate all HTTP request bodies
- Sanitize CLI arguments
- Prevent prototype pollution

### 2. Access Control
- Implement authentication for production
- Add CORS headers for web clients
- Validate method access permissions

### 3. Error Information
- Don't expose internal errors to clients
- Log errors securely
- Implement proper error boundaries

## Best Practices

### 1. Code Organization
- Keep framework code separate from application code
- Use TypeScript for type safety
- Implement proper error boundaries

### 2. Testing
- Write tests for all public methods
- Use descriptive test names
- Mock external dependencies

### 3. Documentation
- Keep README up to date
- Document all public APIs
- Provide usage examples

## Conclusion

This specification provides a complete guide for AI assistants to scaffold a Dynamic Server App Framework. The framework combines the power of TypeScript, React, and modern CLI tools to create a flexible, type-safe development environment for building stateful applications.

The key to successful implementation is understanding the interaction between the CLI interface, HTTP server, interactive UI, and state management system. Each component must work together seamlessly to provide a cohesive developer experience.
