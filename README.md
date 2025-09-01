# Dynamic Server App Template

**A TypeScript class that becomes a web API, CLI tool, and debugger.**

Write your methods once. Use them everywhere.

Built on Bun. TypeScript. Zero config.

## How to Use This Template

### 1. Get Started
```bash
git clone <repo> my-app
cd my-app
bun install
```

### 2. Edit Your Class
Open `src/SampleClass.ts` and add your methods:

```typescript
export class SampleClass extends DynamicServerApp<SampleState> {
  port = 3000;
  message = "Hello, world!";
  
  // Add your methods here
  async greet(name: string) {
    return `Hello, ${name}!`;
  }
  
  async getTime() {
    return new Date().toISOString();
  }
}
```

### 3. Run Your App
```bash
# Run with interactive UI
bun run start

# Or start as a server
bun run start --serve
```

### 4. Use Your Methods
Your methods are now available as:
- **CLI commands**: `bun run start call greet "Alice"`
- **HTTP endpoints**: `POST http://localhost:3000/greet`
- **Interactive UI**: Type `greet "Bob"` in the terminal

## How It Works

```typescript
class MyApp extends DynamicServerApp<MyState> {
  port = 3000;
  message = "Hello, world!";

  async greet(name: string) {
    return `${this.message}, ${name}!`;
  }
}
```

**You now have:**
- `POST /greet` - HTTP endpoint
- `bun run start call greet "Alice"` - CLI command
- Interactive UI showing state and methods

## Commands

### Basic Usage
```bash
# Run default function (if exists)
bun run start

# Show interactive UI
bun run start cli

# Help
bun run start --help
```

### State Management
```bash
# Get state values
bun run start get message
bun run start get port

# Set state values
bun run start set message "New value"
bun run start set counter 42
```

### Method Calls
```bash
# Call methods with arguments
bun run start call greet "Alice"
bun run start call processData "file.json"
bun run start call build --serve
```

### Server Mode
```bash
# Start server with interactive UI
bun run start --serve

# Use specific port
bun run start --serve --port 3001

# Enable desktop notifications
bun run start --serve --notify
```

### Direct Method Calls
```bash
# Call methods directly (if they exist)
bun run start greet "Bob"
bun run start build
bun run start watch
```

## Interactive UI Features

When you run `bun run start cli` or `bun run start --serve`, you get:

- **Real-time state display** - See all your variables and their values
- **Method list** - All available functions with syntax highlighting
- **Command history** - Use arrow keys to navigate previous commands
- **Live updates** - State changes reflect immediately
- **Server status** - Shows if connected to remote server
- **System messages** - Recent activity and results

### UI Commands
```bash
# In the interactive UI:
get message          # Get a state value
set counter 42       # Set a state value
call greet "Alice"   # Call a method
greet "Bob"          # Direct method call
exit                 # Exit the UI
```

## Examples

### Chat Bot
```typescript
class ChatBot extends DynamicServerApp<ChatState> {
  port = 3000;
  conversations = new Map<string, Message[]>();
  
  async sendMessage(conversationId: string, text: string) {
    const message = { id: Date.now(), text, timestamp: new Date() };
    this.conversations.get(conversationId)?.push(message);
    return message;
  }
  
  async getHistory(conversationId: string) {
    return this.conversations.get(conversationId) || [];
  }
}
```

### Build System
```typescript
class BuildSystem extends DynamicServerApp<BuildState> {
  port = 3000;
  isBuilding = false;
  lastBuildTime = null;
  
  async build() {
    this.isBuilding = true;
    // Your build logic
    this.lastBuildTime = new Date();
    this.isBuilding = false;
    return "Build complete!";
  }
  
  async watch() {
    // Start file watcher
    return "Watching for changes...";
  }
}
```

### Data Processor
```typescript
class DataProcessor extends DynamicServerApp<ProcessorState> {
  port = 3000;
  queue = [];
  processing = false;
  
  async addJob(data: any) {
    this.queue.push({ id: Date.now(), data, status: 'pending' });
    return `Job ${this.queue.length} queued`;
  }
  
  async processQueue() {
    this.processing = true;
    // Process all pending jobs
    this.processing = false;
    return `Processed ${this.queue.length} jobs`;
  }
}
```

## API Endpoints

When running with `--serve`, your app automatically exposes:

- `GET /state` - Get current state
- `POST /state` - Update state  
- `POST /<method-name>` - Call any method

### HTTP Examples
```bash
# Get state
curl http://localhost:3000/state

# Update state
curl -X POST http://localhost:3000/state \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from API"}'

# Call method
curl -X POST http://localhost:3000/greet \
  -H "Content-Type: application/json" \
  -d '["Alice"]'
```

## Advanced Features

### Default Function
```typescript
class MyApp extends DynamicServerApp<MyState> {
  port = 3000;
  
  // This runs automatically with: bun run start
  async defaultFunction() {
    return "Hello from default function!";
  }
}
```

### State Management
```typescript
class MyApp extends DynamicServerApp<MyState> {
  port = 3000;
  counter = 0;
  users = [];
  
  async increment() {
    this.counter++;
    return this.counter;
  }
  
  async addUser(name: string) {
    this.users.push({ id: Date.now(), name });
    return this.users;
  }
}
```

### Server Detection
The framework automatically detects if a server is running and routes commands appropriately:
- If server is running: Commands go to the server
- If server is not running: Commands execute locally

## That's It

Your class becomes a complete application ecosystem. No routing. No middleware. No configuration.

Just write your logic and run.