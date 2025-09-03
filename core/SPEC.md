# 🧙‍♂️ Dynamic Server App Framework - AI Scaffolding Specification

## Overview

This document provides a comprehensive specification for AI assistants to scaffold a Dynamic Server App Framework. The framework allows developers to create type-safe, stateful applications with built-in HTTP API and server functionality.

## Core Architecture

### 1. Base Class Structure

```typescript
// core/app.ts
// Utility type to extract state from class properties
export type ExtractState<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export abstract class DynamicServerApp<T extends Record<string, any>> {
  abstract port: number;
  isServerInstance = false;

  // Core methods that must be implemented
  getState(): Partial<T>
  applyStateUpdate(data: Partial<T>): void
  async probe(timeout?: number): Promise<boolean>
  async setState(diff: Partial<T>): Promise<Partial<T> | undefined>
}
```

### 2. State Management

- **Type Safety**: Uses TypeScript utility types for automatic state extraction
- **Dynamic Updates**: State can be updated via HTTP API
- **Introspection**: Current state is always accessible via `/state` endpoint
- **Validation**: Simple property existence checking (no runtime type validation)
- **Auto-extraction**: State type is automatically derived from class properties using `ExtractState<T>`

### 3. ExtractState Utility Type

The `ExtractState<T>` utility type automatically extracts state properties from your class, eliminating the need to manually define state interfaces:

```typescript
// Before: Manual interface definition
interface MyAppState {
  port: number;
  message: string;
  counter: number;
}

class MyApp extends DynamicServerApp<MyAppState> {
  port = 3000;
  message = "Hello";
  counter = 0;
  // Duplicate property definitions above
}

// After: Automatic state extraction
class MyApp extends DynamicServerApp<ExtractState<MyApp>> {
  port = 3000;
  message = "Hello";
  counter = 0;
  // Properties automatically become part of state
  // Methods are automatically excluded
}
```

**Benefits:**
- ✅ **No duplication**: Define properties once in your class
- ✅ **Type safety**: Full TypeScript type checking maintained
- ✅ **Automatic**: New properties automatically included in state
- ✅ **Function filtering**: Methods automatically excluded from state
- ✅ **Maintainable**: No need to keep interfaces in sync with class properties

### 4. HTTP Server Features

- **Auto-routing**: All non-constructor methods become POST endpoints
- **State Endpoint**: `GET /state` returns current state, `POST /state` updates state
- **Method Endpoints**: `POST /<method-name>` calls instance methods
- **Error Handling**: Proper HTTP status codes and JSON error responses

## Command Line Interface

### 1. Command Structure

```bash
bun run start [OPTIONS]
```

### 2. Available Options

| Option | Behavior |
|--------|----------|
| `(no options)` | Runs `defaultFunction` if exists, otherwise exits |
| `--serve` | Starts HTTP server |
| `--port <number>` | Specifies port number |
| `--notify` | Enables desktop notifications |

### 3. CLI Parsing Logic

```typescript
// Parse arguments for:
// 1. Flags: --serve, --notify, --port
// 2. Default behavior: run defaultFunction if exists
```

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
console.log("🔸 No defaultFunction found. App completed.");
process.exit(0);
```

## Server Lifecycle

### 1. Startup Logic
```typescript
// 1. Parse CLI arguments
// 2. Check for existing server (only if --port specified)
// 3. Handle serve flag (start server)
// 4. Handle default behavior (defaultFunction)
```

### 2. Server Management
- **Port Detection**: Automatically finds available ports
- **Probe System**: Checks if server is already running (only when --port specified)
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals
- **Connection Logging**: Shows when connecting to existing servers

## Logging System

### 1. Console Logging
The framework provides comprehensive console logging with emoji indicators:

- `🔹 Starting server on port X...` - Server startup initiation
- `🔹 Server started on port X` - Server successfully started
- `🔹 Connected to existing server on port X` - Connected to running server
- `🔸 Server not found on port X` - No server found on specified port
- `🔸 Server already running on port X. Starting on next available port...` - Port conflict detected
- `🔸 No defaultFunction found. App completed.` - No default function exists
- `🔸 Error running defaultFunction: [error]` - Function execution error

- `🔸 Received SIGTERM. Shutting down gracefully...` - Shutdown signal received
- `🔸 Forcing shutdown after timeout` - Forced shutdown after 5 seconds
- `🔹 Server closed successfully` - Graceful shutdown completed

## Project Structure

```
project/
├── core/
│   ├── app.ts          # Main framework logic
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
    "vitest": "^3.2.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^22.15.29",
    "@types/lodash": "^4.17.17"
  }
}
```

### Key Technologies
- **Runtime**: Bun (JavaScript runtime)
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

### 2. Add Logging and Graceful Shutdown
1. Add comprehensive console logging
2. Implement graceful shutdown handling
3. Add server connection detection
4. Add port conflict resolution
5. Add proper error handling

### 3. Add Testing
1. Create test suite for core functionality
2. Test state management
3. Test HTTP endpoints
4. Test server startup/shutdown
5. Test error scenarios

### 4. Create Documentation
1. Write comprehensive README
2. Add usage examples
3. Document API endpoints
4. Create this specification document

## Key Implementation Details

### 1. State Type Extraction
```typescript
// Utility type to automatically extract state from class properties
export type ExtractState<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// Usage in your class:
class MyApp extends DynamicServerApp<ExtractState<MyApp>> {
  port = 3000;
  message = "Hello";
  counter = 0;
  
  // Methods are automatically excluded from state
  async myMethod() { return "result"; }
}
```

### 2. State Management
```typescript
// Get state by iterating through instance properties
getState(): Partial<T> {
  const state: Partial<T> = {};
  const exclude = new Set(["schema", "logToUI", "notifyEnabled", "isServerInstance"]);
  
  for (const key of Object.keys(this)) {
    if (!exclude.has(key) && typeof (this as any)[key] !== "function") {
      state[key as keyof T] = (this as any)[key];
    }
  }
  
  return state;
}
```

### 3. HTTP Server Setup
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

### 4. Logging and Graceful Shutdown
```typescript
// Server startup logging
console.log(`🚀 Starting server on port ${app.port}...`);
console.log(`🔹 Server started on port ${port}`);

// Connection detection
if (isServerRunning && !serve) {
  console.log(`🔹 Connected to existing server on port ${app.port}`);
} else if (!isServerRunning && !serve) {
  console.log(`🔸 Server not found on port ${app.port}`);
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
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
- Test graceful shutdown handling
- Test connection detection

### 3. Mock Strategy
- Mock HTTP requests for server tests
- Mock file system for configuration tests
- Mock signal handling for shutdown tests

## Error Handling

### 1. HTTP Errors
- 400: Bad Request (invalid JSON)
- 404: Not Found (unknown endpoint)
- 405: Method Not Allowed
- 500: Internal Server Error

### 2. Application Errors
- Invalid port numbers
- Function not found
- Network connection errors
- Server startup failures

### 3. State Errors
- Invalid state updates
- Type mismatches
- Property access errors

## Performance Considerations

### 1. State Updates
- Use deep equality checks to avoid unnecessary updates
- Batch state changes when possible

### 2. HTTP Server
- Use connection pooling
- Implement request timeouts
- Add rate limiting for production use

### 3. Server Performance
- Implement graceful shutdown to prevent resource leaks
- Use efficient port detection algorithms
- Minimize network calls when no port is specified

## Security Considerations

### 1. Input Validation
- Validate all HTTP request bodies
- Sanitize command line arguments
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
- Use `ExtractState<T>` utility type to avoid manual state interface definitions

### 2. State Management Best Practices
- Define properties directly in your class - no need for separate interfaces
- Use `ExtractState<YourClass>` as the generic type parameter
- Methods are automatically excluded from state
- Add new properties to your class and they're automatically included in state

### 3. Testing
- Write tests for all public methods
- Use descriptive test names
- Mock external dependencies

### 4. Documentation
- Keep README up to date
- Document all public APIs
- Provide usage examples

## Conclusion

This specification provides a complete guide for AI assistants to scaffold a Dynamic Server App Framework. The framework combines the power of TypeScript and modern server technologies to create a flexible, type-safe development environment for building stateful applications.

The key to successful implementation is understanding the interaction between the HTTP server, state management system, and graceful shutdown handling. Each component must work together seamlessly to provide a cohesive developer experience with excellent logging and user feedback.
