---
id: e913e6bd-3f7c-485f-812d-3e626b4f6b5b
title: "@dockstat/logger"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2026-01-01T14:25:49.246Z
urlId: zb1s366Lti
---

> A lightweight, colorized logging utility for Bun with source mapping support, request tracking, and hierarchical logger spawning.

## Overview

`@dockstat/logger` provides a simple yet powerful logging system with:

* **Colorized Output**: Automatic color coding by log level and request ID
* **Source Mapping**: Shows file name and line number for each log
* **Request Tracking**: Track logs across async operations with request IDs
* **Hierarchical Loggers**: Spawn child loggers with parent context
* **Environment Controls**: Fine-grained control via environment variables
* **Bun-Optimized**: Built specifically for Bun runtime

## Installation

```bash
bun add @dockstat/logger
```

## Quick Start

```typescript
import { Logger } from "@dockstat/logger"

const log = new Logger("MyApp")

log.info("Application started")
log.warn("This is a warning")
log.error("An error occurred")
log.debug("Debug information")
```

**Output:**

```php
12:34:56 INFO  [MyApp] index.ts:5 — Application started
12:34:56 WARN  [MyApp] index.ts:6 — This is a warning
12:34:56 ERROR [MyApp] index.ts:7 — An error occurred
12:34:56 DEBUG [MyApp] index.ts:8 — Debug information
```

## Core Features

### Log Levels

Four standard log levels with automatic color coding:

* **ERROR** (red) - Critical errors
* **WARN** (yellow) - Warning messages
* **INFO** (green) - Informational messages
* **DEBUG** (blue) - Debug information

### Request ID Tracking

Track logs across async operations by passing a request ID:

```typescript
const log = new Logger("API")

function handleRequest(req: Request) {
  const reqId = crypto.randomUUID()
  
  log.info("Request received", reqId)
  await processRequest(req, reqId)
  log.info("Request completed", reqId)
}

async function processRequest(req: Request, reqId: string) {
  log.debug("Processing data", reqId)
  // ...
}
```

**Output:**

```php
12:34:56 INFO  (a1b2c3d4) [API] handler.ts:5 — Request received
12:34:56 DEBUG (a1b2c3d4) [API] handler.ts:12 — Processing data
12:34:56 INFO  (a1b2c3d4) [API] handler.ts:7 — Request completed
```

Each request ID is automatically colorized with a consistent color for easy tracking.

### Request Origin Tracking

Set and track where requests originate from:

```typescript
const log = new Logger("Router")
const reqId = "abc123"

log.setReqFrom(reqId, "192.168.1.100")
log.info("Handling request", reqId)

// Output: 12:34:56 INFO (abc123@192.168.1.100) [Router] — Handling request

log.clearReqFrom(reqId) // Clean up when done
```

### Hierarchical Loggers

Spawn child loggers that maintain parent context:

```typescript
const mainLog = new Logger("App")
const dbLog = mainLog.spawn("Database")
const queryLog = dbLog.spawn("Query")

mainLog.info("Application started")
dbLog.info("Connected to database")
queryLog.debug("Executing SELECT query")
```

**Output:**

```php
12:34:56 INFO  [App] — Application started
12:34:56 INFO  [Database:App] — Connected to database
12:34:56 DEBUG [Query:Database:App] — Executing SELECT query
```

### Additional Parents

Add extra context when spawning loggers:

```typescript
const log = new Logger("Service")
const userLog = log.spawn("UserHandler", ["User:123"])

userLog.info("Processing user action")
// Output: [UserHandler:User:123:Service] — Processing user action
```

### Dynamic Logger Control

Enable or disable loggers at runtime:

```typescript
const log = new Logger("Debug")

log.setDisabled(true)
log.debug("This won't be logged")

log.setDisabled(false)
log.debug("This will be logged")
```

## Environment Variables

### `DOCKSTAT_LOGGER_DISABLED_LOGGERS`

Disable specific loggers by name (comma-separated):

```bash
DOCKSTAT_LOGGER_DISABLED_LOGGERS="Database,Cache"
```

```typescript
const dbLog = new Logger("Database")  // disabled
const apiLog = new Logger("API")      // enabled

dbLog.info("This won't show")
apiLog.info("This will show")
```

### `DOCKSTAT_LOGGER_ONLY_SHOW`

Only show logs from specific loggers:

```bash
DOCKSTAT_LOGGER_ONLY_SHOW="API,Router"
```

All loggers except `API` and `Router` will be disabled.

### `DOCKSTAT_LOGGER_IGNORE_MESSAGES`

Filter out logs containing specific text (comma-separated, case-insensitive):

```bash
DOCKSTAT_LOGGER_IGNORE_MESSAGES="health check,ping"
```

```typescript
log.info("Health check passed")  // ignored
log.info("User logged in")       // shown
```

### `DOCKSTAT_LOGGER_SEPERATOR`

Customize the separator between logger names in hierarchies:

```bash
DOCKSTAT_LOGGER_SEPERATOR=" → "
```

```typescript
const parent = new Logger("Parent")
const child = parent.spawn("Child")
child.info("Message")
// Output: [Child → Parent] — Message
```

Default: `:`

### `DOCKSTAT_LOGGER_FULL_FILE_PATH`

Show full file paths instead of just filename:

```bash
DOCKSTAT_LOGGER_FULL_FILE_PATH="true"
```

```typescript
log.info("Message")
// Default: index.ts:5
// Full:    /home/user/project/src/index.ts:5
```

## API Reference

### Constructor

```typescript
new Logger(name: string, parents?: string[])
```

Create a new logger instance.

**Parameters:**

* `name` - Logger identifier
* `parents` - Optional array of parent logger names

### Methods

#### `spawn(prefix: string, additionalParents?: string[]): Logger`

Create a child logger with parent context.

```typescript
const parent = new Logger("Parent")
const child = parent.spawn("Child", ["Context"])
```

#### `error(msg: string, requestid?: string): void`

Log an error message.

```typescript
log.error("Database connection failed", reqId)
```

#### `warn(msg: string, requestid?: string): void`

Log a warning message.

```typescript
log.warn("Rate limit approaching", reqId)
```

#### `info(msg: string, requestid?: string): void`

Log an informational message.

```typescript
log.info("User authenticated", reqId)
```

#### `debug(msg: string, requestid?: string): void`

Log a debug message.

```typescript
log.debug("Cache hit for key: user:123", reqId)
```

#### `setDisabled(to: boolean): void`

Enable or disable the logger.

```typescript
log.setDisabled(true)  // disable
log.setDisabled(false) // enable
```

#### `setReqFrom(reqId: string, from: string): void`

Set the origin for a request ID.

```typescript
log.setReqFrom("abc123", "192.168.1.100")
```

#### `clearReqFrom(reqId: string): void`

Clear the origin for a request ID.

```typescript
log.clearReqFrom("abc123")
```

#### `getParents(): string[]`

Get array of parent logger names.

```typescript
const parents = log.getParents()
```

#### `getParentsForLoggerChaining(): string[]`

Get array including current logger and all parents.

```typescript
const chain = log.getParentsForLoggerChaining()
```

#### `addParent(prefix: string): string[]`

Add a single parent to the logger.

```typescript
log.addParent("NewParent")
```

#### `addParents(parents: string[]): void`

Replace all parents with a new array.

```typescript
log.addParents(["Parent1", "Parent2"])
```

## Usage Patterns

### API Request Logging

```typescript
import { Logger } from "@dockstat/logger"

const log = new Logger("API")

app.use((req, res, next) => {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID()
  log.setReqFrom(reqId, req.ip)
  
  log.info(`${req.method} ${req.path}`, reqId)
  
  res.on("finish", () => {
    log.info(`Response ${res.statusCode}`, reqId)
    log.clearReqFrom(reqId)
  })
  
  next()
})
```

### Service Architecture

```typescript
// Create service-specific loggers

const apiLog = new Logger("API")
const dbLog = new Logger("Database")
const cacheLog = new Logger("Cache")

// Docker operations with hierarchical context

const dockerLog = new Logger("Docker")
const containerLog = dockerLog.spawn("Container")
const imageLog = dockerLog.spawn("Image")

containerLog.info("Starting container abc123")
imageLog.info("Pulling image nginx:latest")
```

### Plugin System

```typescript
class PluginManager {
  private log: Logger
  
  constructor() {
    this.log = new Logger("PluginManager")
  }
  
  loadPlugin(name: string) {
    const pluginLog = this.log.spawn(name)
    
    pluginLog.info("Loading plugin")
    // ... load plugin
    pluginLog.info("Plugin loaded successfully")
  }
}
```

### Development vs Production

```bash
# Development - show everything

DOCKSTAT_LOGGER_DISABLED_LOGGERS=""

# Production - only errors and warnings

DOCKSTAT_LOGGER_ONLY_SHOW="API,Database"
DOCKSTAT_LOGGER_IGNORE_MESSAGES="debug,trace"
```

## Color Coding

The logger uses consistent color schemes:

* **Timestamp**: Magenta
* **Log Level**: Colored by level (red/yellow/green/blue)
* **Logger Name**: Cyan
* **Parent Chain**: Yellow
* **Request ID**: Hashed to consistent color per ID
* **Request Origin**: Green
* **File Location**: Blue
* **Message**: Gray

Request IDs are colored using a hash function, ensuring the same request ID always gets the same color across all logs.

## Performance

* **Minimal Overhead**: Simple formatting with no async operations
* **Conditional Logging**: Messages are not processed if logger is disabled
* **Source Maps**: Efficient stack trace parsing with Bun's source-map-support
* **No File I/O**: All output to stdout/stderr for performance

## Integration Examples

### With Elysia

```typescript

import { Elysia } from "elysia"
import { Logger } from "@dockstat/logger"

const log = new Logger("Elysia")

new Elysia()
  .onRequest(({ request }) => {
    const reqId = request.headers.get("x-request-id")
    log.info(`${request.method} ${new URL(request.url).pathname}`, reqId)
  })
  .onError(({ error, request }) => {
    const reqId = request.headers.get("x-request-id")
    log.error(`Error: ${error.message}`, reqId)
  })
  .listen(3000)
```

### With Docker Client

```typescript
import { Logger } from "@dockstat/logger"
import { DockerClient } from "@dockstat/docker-client"

const log = new Logger("Docker")
const client = new DockerClient(log)

// Logger is passed to docker client for internal logging
```

### With Plugin Handler

```typescript
import { Logger } from "@dockstat/logger"
import { PluginHandler } from "@dockstat/plugin-handler"

const baseLog = new Logger("Plugins")
const handler = new PluginHandler(db, baseLog)

// Each plugin gets its own spawned logger
```

## Best Practices


1. **Use Hierarchical Loggers**: Spawn child loggers for different components
2. **Pass Request IDs**: Track operations across async boundaries
3. **Clean Up Request Context**: Call `clearReqFrom()` when requests complete
4. **Descriptive Logger Names**: Use clear, hierarchical naming (e.g., "API:Routes:Users")
5. **Environment Controls**: Use env vars for production log filtering
6. **Consistent Levels**: Use appropriate log levels (error for errors, info for significant events)

## Comparison with Other Loggers

| Feature | @dockstat/logger | winston | pino | bunyan |
|----|----|----|----|----|
| Bun-Native | ✅ | ❌ | ❌ | ❌ |
| Request Tracking | ✅ | Manual | Manual | Manual |
| Hierarchical Spawning | ✅ | ❌ | ❌ | ✅ |
| Zero Config | ✅ | ❌ | ❌ | ❌ |
| Source Maps | ✅ | ❌ | ❌ | ❌ |
| Color Coding | ✅ | Manual | Manual | ❌ |
| File Size | <5KB | \~500KB | \~50KB | \~100KB |

## License

Part of the DockStat project. See main repository for license information.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)

## Related Packages

* `@dockstat/docker-client` - Docker client that uses this logger
* `@dockstat/plugin-handler` - Plugin system with logger integration
* `@dockstat/outline-sync` - Uses this logger for sync operations