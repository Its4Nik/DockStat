---
id: 88a5f959-3f89-4266-9d8e-eb50193425b0
title: Troubleshooting
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2025-12-17T09:07:59.574Z
urlId: lgGFKJhiDO
---

> Comprehensive troubleshooting guide for DockStat applications and packages. This document covers common issues, diagnostic procedures, and solutions.

## Diagnostic Overview

```mermaidjs

graph TB
    subgraph "Issue Categories"
        CONN["Connection Issues"]
        PERF["Performance Issues"]
        PLUGIN["Plugin Issues"]
        DB["Database Issues"]
        AUTH["Authentication Issues"]
        BUILD["Build Issues"]
    end

    subgraph "Diagnostic Tools"
        LOGS["Logger Output"]
        METRICS["Prometheus Metrics"]
        API["API Health Checks"]
        DOCKER["Docker Diagnostics"]
    end

    CONN --> LOGS
    CONN --> API
    PERF --> METRICS
    PERF --> LOGS
    PLUGIN --> LOGS
    PLUGIN --> DB
    DB --> LOGS
    AUTH --> LOGS
    BUILD --> LOGS
```

## Quick Diagnostics

### Health Check Endpoints

```bash
# Check API status
curl http://localhost:9876/api/v2/docker/status

# Check DockNode status
curl http://localhost:4000/api/status

# Get Prometheus metrics
curl http://localhost:9876/api/v2/metrics
```

### Log Analysis

```bash
# View API logs with filtering
DOCKSTAT_LOGGER_ONLY_SHOW="API,Docker" bun run dev

# Show full file paths for debugging
DOCKSTAT_LOGGER_FULL_FILE_PATH=true bun run dev

# Filter out noise
DOCKSTAT_LOGGER_IGNORE_MESSAGES="health check,heartbeat" bun run dev
```

## Connection Issues

### Docker Daemon Connection Failed

```mermaidjs

flowchart TD
    START["Docker Connection Failed"] --> CHECK_SOCKET{"Check Docker Socket"}
    CHECK_SOCKET -->|"Socket exists"| CHECK_PERMS{"Check Permissions"}
    CHECK_SOCKET -->|"Socket missing"| START_DOCKER["Start Docker daemon"]
    CHECK_PERMS -->|"Permission denied"| ADD_GROUP["Add user to docker group"]
    CHECK_PERMS -->|"Permissions OK"| CHECK_CONFIG{"Check host config"}
    CHECK_CONFIG -->|"Config invalid"| FIX_CONFIG["Update host configuration"]
    CHECK_CONFIG -->|"Config valid"| CHECK_NETWORK{"Check network"}
    CHECK_NETWORK -->|"Network issue"| FIX_NETWORK["Fix network/firewall"]
    CHECK_NETWORK -->|"Network OK"| CONTACT_SUPPORT["Check Docker logs"]
    START_DOCKER --> SUCCESS["Connection established"]
    ADD_GROUP --> SUCCESS
    FIX_CONFIG --> SUCCESS
    FIX_NETWORK --> SUCCESS
```

**Symptoms:**

* "ENOENT" error when connecting to Docker
* "Permission denied" errors
* Connection timeout

**Solutions:**


1. **Check Docker daemon is running:**

```bash
# Linux/macOS

sudo systemctl status docker
# or

docker info
```


2. **Check socket permissions:**

```bash
ls -la /var/run/docker.sock
# Should show: srw-rw---- 1 root docker
```


3. **Add user to docker group:**

```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```


4. **Verify host configuration:**

```typescript
// Correct local socket configuration

const hostConfig = {
  id: 1,
  host: "/var/run/docker.sock",
  name: "Local Docker",
  secure: false,
  port: 0  // Port not used for socket connections
};
```

### Remote Docker Host Connection Failed

**Symptoms:**

* "ECONNREFUSED" error
* "ETIMEDOUT" error
* TLS handshake failures

**Solutions:**


1. **Check Docker is listening on TCP:**

```bash
# On remote host

sudo netstat -tlnp | grep 2375
# or

ss -tlnp | grep docker
```


2. **Enable Docker TCP (without TLS - development only):**

```bash
# Edit /etc/docker/daemon.json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
```


3. **Enable Docker TCP with TLS:**

```bash
# Edit /etc/docker/daemon.json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlscacert": "/etc/docker/ca.pem",
  "tlscert": "/etc/docker/server-cert.pem",
  "tlskey": "/etc/docker/server-key.pem",
  "tlsverify": true
}
```


4. **Check firewall rules:**

```bash
# Allow Docker ports

sudo ufw allow 2375/tcp  # Unsecured
sudo ufw allow 2376/tcp  # TLS
```

### API Connection Failed

**Symptoms:**

* Frontend shows "Failed to fetch"
* Eden client returns network errors
* CORS errors in browser console

**Solutions:**


1. **Check API is running:**

```bash
curl http://localhost:9876/api/v2/docker/status
```


2. **Check CORS configuration:**

```typescript
// apps/api/src/index.ts

import { cors } from "@elysiajs/cors";

new Elysia()
  .use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }))
```


3. **Verify frontend API URL:**

```typescript
// apps/dockstat/app/api.ts

export const api = treaty<TreatyType>("http://localhost:9876");
```

## Performance Issues

### Slow API Responses

```mermaidjs

flowchart TD
    START["Slow API Response"] --> CHECK_WORKERS{"Check worker count"}
    CHECK_WORKERS -->|"Too few workers"| INCREASE_WORKERS["Increase DOCKSTAT_MAX_WORKERS"]
    CHECK_WORKERS -->|"Workers OK"| CHECK_DOCKER{"Check Docker response time"}
    CHECK_DOCKER -->|"Docker slow"| OPTIMIZE_DOCKER["Optimize Docker queries"]
    CHECK_DOCKER -->|"Docker fast"| CHECK_DB{"Check database"}
    CHECK_DB -->|"DB slow"| OPTIMIZE_DB["Optimize database"]
    CHECK_DB -->|"DB fast"| CHECK_PLUGINS{"Check plugin overhead"}
    CHECK_PLUGINS -->|"Plugin issue"| DISABLE_PLUGINS["Disable problematic plugins"]
    CHECK_PLUGINS -->|"Plugins OK"| PROFILE["Profile application"]
    INCREASE_WORKERS --> SUCCESS["Performance improved"]
    OPTIMIZE_DOCKER --> SUCCESS
    OPTIMIZE_DB --> SUCCESS
    DISABLE_PLUGINS --> SUCCESS
```

**Diagnostic Steps:**


1. **Check worker pool status:**

```bash
curl http://localhost:9876/api/v2/docker/manager/pool-stats
```


2. **Increase worker threads:**

```bash
DOCKSTAT_MAX_WORKERS=100 bun run dev
```


3. **Enable server timing traces:**

```bash
DOCKSTATAPI_SHOW_TRACES=true bun run dev
# Check response headers for timing information
```

### High Memory Usage

**Symptoms:**

* Process memory grows continuously
* Out of memory errors
* System slowdown

**Solutions:**


1. **Monitor memory usage:**

```typescript
import Logger from "@dockstat/logger";

const log = new Logger("Memory");

setInterval(() => {
  const usage = process.memoryUsage();
  log.info(`RSS: ${Math.round(usage.rss / 1024 / 1024)}MB, Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
}, 30000);
```


2. **Limit monitoring frequency:**

```typescript
const client = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  monitoringInterval: 10000  // 10 seconds instead of default
});
```


3. **Clean up event listeners:**

```typescript
// Properly remove listeners when done

streamManager.unsubscribe(STREAM_CHANNELS.CONTAINER_STATS, handler);
```

### Database Performance

**Symptoms:**

* Slow queries
* Database file growing large
* Lock contention

**Solutions:**


1. **Enable WAL mode:**

```typescript
import { DB } from "@dockstat/sqlite-wrapper";

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["synchronous", "NORMAL"],
    ["cache_size", "-64000"],  // 64MB cache
    ["temp_store", "MEMORY"]
  ]
});
```


2. **Add indexes for frequent queries:**

```typescript
// After table creation

db.exec(`CREATE INDEX IF NOT EXISTS idx_containers_host ON containers(host_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`);
```


3. **Vacuum database periodically:**

```typescript
// Run during maintenance window

db.exec("VACUUM");
db.exec("ANALYZE");
```

## Plugin Issues

### Plugin Won't Load

```mermaidjs

flowchart TD
    START["Plugin Load Failed"] --> CHECK_INSTALLED{"Is plugin installed?"}
    CHECK_INSTALLED -->|"Not installed"| INSTALL["Install plugin"]
    CHECK_INSTALLED -->|"Installed"| CHECK_CODE{"Check plugin code"}
    CHECK_CODE -->|"Syntax error"| FIX_CODE["Fix plugin syntax"]
    CHECK_CODE -->|"Code OK"| CHECK_DEPS{"Check dependencies"}
    CHECK_DEPS -->|"Missing deps"| INSTALL_DEPS["Install dependencies"]
    CHECK_DEPS -->|"Deps OK"| CHECK_CONFIG{"Check plugin config"}
    CHECK_CONFIG -->|"Invalid config"| FIX_CONFIG["Fix configuration"]
    CHECK_CONFIG -->|"Config OK"| CHECK_CONFLICTS{"Check conflicts"}
    CHECK_CONFLICTS -->|"Conflict found"| RESOLVE_CONFLICT["Resolve plugin conflict"]
    CHECK_CONFLICTS -->|"No conflicts"| DEBUG["Enable debug logging"]
    INSTALL --> SUCCESS["Plugin loaded"]
    FIX_CODE --> SUCCESS
    INSTALL_DEPS --> SUCCESS
    FIX_CONFIG --> SUCCESS
    RESOLVE_CONFLICT --> SUCCESS
```

**Diagnostic Steps:**


1. **Check installed plugins:**

```typescript
const plugins = await pluginHandler.getAll();
console.log("Installed plugins:", plugins);
```


2. **Check plugin status:**

```typescript
const status = await pluginHandler.getStatus();
console.log("Plugin status:", status);
```


3. **Attempt to load with error capture:**

```typescript
const result = await pluginHandler.loadPlugins([pluginId]);
if (result.errors.length > 0) {
  for (const err of result.errors) {
    console.error(`Plugin ${err.pluginId} failed:`, err.error);
  }
}
```

### Plugin Routes Not Working

**Symptoms:**

* 404 errors on plugin routes
* Routes not listed in plugin routes endpoint
* Incorrect responses

**Solutions:**


1. **Verify plugin routes are registered:**

```typescript
const routes = await pluginHandler.getAllPluginRoutes();
console.log("Available routes:", routes);
```


2. **Check route configuration:**

```typescript
// Correct route definition

const config = {
  apiRoutes: {
    "/status": {           // Must start with /
      method: "GET",       // Must be uppercase
      actions: ["getStatus"]  // Actions must exist
    }
  }
};
```


3. **Test route directly:**

```bash
curl http://localhost:9876/api/v2/plugins/1/routes/status
```

### Plugin Database Table Issues

**Symptoms:**

* "Table not found" errors
* Data not persisting
* Column type mismatches

**Solutions:**


1. **Check if table was created:**

```typescript
const schema = db.getSchema();
console.log("Tables:", schema);
```


2. **Verify column definitions:**

```typescript
import { column } from "@dockstat/sqlite-wrapper";

const config = {
  table: {
    name: "plugin_data",
    columns: {
      id: column.id(),                    // Primary key
      data: column.json(),                // JSON column
      created_at: column.createdAt()      // Timestamp
    },
    jsonColumns: ["data"]                 // Must list JSON columns
  }
};
```


3. **Drop and recreate table (development only):**

```typescript
db.exec(`DROP TABLE IF EXISTS plugin_data`);
// Reload plugin to recreate table

await pluginHandler.loadPlugins([pluginId]);
```

## Database Issues

### Database Locked

```mermaidjs

flowchart TD
    START["Database Locked Error"] --> CHECK_CONNECTIONS{"Check open connections"}
    CHECK_CONNECTIONS -->|"Multiple processes"| SINGLE_PROCESS["Use single process or WAL"]
    CHECK_CONNECTIONS -->|"Single process"| CHECK_TRANSACTIONS{"Check open transactions"}
    CHECK_TRANSACTIONS -->|"Uncommitted txn"| COMMIT_TXN["Commit or rollback transaction"]
    CHECK_TRANSACTIONS -->|"No open txn"| CHECK_TIMEOUT{"Check busy timeout"}
    CHECK_TIMEOUT -->|"Timeout too low"| INCREASE_TIMEOUT["Increase busy_timeout PRAGMA"]
    CHECK_TIMEOUT -->|"Timeout OK"| CHECK_WAL{"WAL mode enabled?"}
    CHECK_WAL -->|"Not enabled"| ENABLE_WAL["Enable WAL mode"]
    CHECK_WAL -->|"Enabled"| INVESTIGATE["Investigate deadlock"]
    SINGLE_PROCESS --> SUCCESS["Database unlocked"]
    COMMIT_TXN --> SUCCESS
    INCREASE_TIMEOUT --> SUCCESS
    ENABLE_WAL --> SUCCESS
```

**Solutions:**


1. **Enable WAL mode:**

```typescript
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"]
  ]
});
```


2. **Set busy timeout:**

```typescript
const db = new DB("app.db", {
  pragmas: [
    ["busy_timeout", "5000"]  // 5 seconds
  ]
});
```


3. **Use transactions properly:**

```typescript
// Wrap related operations in a transaction

db.transaction(() => {
  table.insert({ ... });
  table.update({ ... }).where({ ... }).run();
});
```

### Database Corruption

**Symptoms:**

* "Database disk image is malformed"
* Unexpected query results
* Crashes on database operations

**Solutions:**


1. **Check database integrity:**

```bash
sqlite3 dockstat.db "PRAGMA integrity_check;"
```


2. **Attempt recovery:**

```bash
# Backup corrupted database
cp dockstat.db dockstat.db.corrupt

# Export and reimport
sqlite3 dockstat.db.corrupt ".dump" | sqlite3 dockstat.db.new

# Replace if successful
mv dockstat.db.new dockstat.db
```


3. **Restore from backup:**

```bash
# If backups exist
cp /backup/dockstat.db.bak dockstat.db
```

## Authentication Issues

### DockNode Authentication Failed

**Symptoms:**

* 401 Unauthorized responses
* "Invalid PSK" errors
* Authentication header missing

**Solutions:**


1. **Verify PSK is set:**

```bash
# Check environment variable
echo $DOCKNODE_DOCKSTACK_AUTH_PSK
```


2. **Check authentication priority:**

```bash
# For production
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=psk

# For development
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=dev
```


3. **Include authentication header:**

```typescript
const response = await fetch(`${DOCKNODE_URL}/api/dockstack/deploy`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${AUTH_TOKEN}`,
    "X-DockNode-PSK": PSK_VALUE  // If using PSK auth
  },
  body: JSON.stringify(data)
});
```

## Build Issues

### TypeScript Compilation Errors

```mermaidjs

flowchart TD
    START["TypeScript Error"] --> CHECK_TYPES{"Check type imports"}
    CHECK_TYPES -->|"Import error"| FIX_IMPORT["Fix import path"]
    CHECK_TYPES -->|"Imports OK"| CHECK_DEPS{"Check package dependencies"}
    CHECK_DEPS -->|"Missing package"| INSTALL_PKG["Install missing package"]
    CHECK_DEPS -->|"Deps OK"| CHECK_TSCONFIG{"Check tsconfig.json"}
    CHECK_TSCONFIG -->|"Config issue"| FIX_TSCONFIG["Fix TypeScript config"]
    CHECK_TSCONFIG -->|"Config OK"| CHECK_VERSION{"Check TS version"}
    CHECK_VERSION -->|"Version mismatch"| UPDATE_TS["Update TypeScript"]
    CHECK_VERSION -->|"Version OK"| CLEAN_BUILD["Clean and rebuild"]
    FIX_IMPORT --> SUCCESS["Build successful"]
    INSTALL_PKG --> SUCCESS
    FIX_TSCONFIG --> SUCCESS
    UPDATE_TS --> SUCCESS
    CLEAN_BUILD --> SUCCESS
```

**Solutions:**


1. **Clear build cache:**

```bash
rm -rf node_modules/.cache

rm -rf .turbo

rm -rf dist

bun install
```


2. **Check type imports:**

```typescript
// Correct import from @dockstat/typings

import type { DOCKER, PLUGIN, THEME } from "@dockstat/typings";

// Not default import
// import DOCKER from "@dockstat/typings";  // Wrong!
```


3. **Verify tsconfig extends base:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### Turborepo Build Failures

**Symptoms:**

* "Task not found" errors
* Dependency resolution issues
* Cache invalidation problems

**Solutions:**


1. **Clear Turborepo cache:**

```bash
bun run turbo clean
# or

rm -rf .turbo node_modules/.cache
```


2. **Force rebuild:**

```bash
bun run build --force
```


3. **Check turbo.json pipeline:**

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    }
  }
}
```

## Logging and Debugging

### Enable Verbose Logging

```bash
# Show all loggers
unset DOCKSTAT_LOGGER_DISABLED_LOGGERS
unset DOCKSTAT_LOGGER_ONLY_SHOW

# Show full file paths
DOCKSTAT_LOGGER_FULL_FILE_PATH=true

# Run in development mode
bun run dev
```

### Custom Debug Logger

```typescript
import Logger from "@dockstat/logger";

const debug = new Logger("Debug");

// Add debug points throughout code
debug.debug("Entering function X");
debug.debug(`Variable state: ${JSON.stringify(data)}`);
debug.debug("Exiting function X");
```

### Request Tracing

```typescript
import Logger from "@dockstat/logger";

const log = new Logger("API");

// Middleware for request tracing
app.onRequest(({ request }) => {
  const reqId = request.headers.get("x-request-id") || crypto.randomUUID();
  log.setReqFrom(reqId, request.headers.get("x-forwarded-for") || "unknown");
  log.info(`${request.method} ${new URL(request.url).pathname}`, reqId);
});

app.onAfterResponse(({ request }) => {
  const reqId = request.headers.get("x-request-id");
  if (reqId) {
    log.clearReqFrom(reqId);
  }
});
```

## Common Error Messages

| Error Message | Likely Cause | Solution |
|----|----|----|
| `ENOENT: no such file or directory` | File/socket doesn't exist | Check path, start Docker daemon |
| `ECONNREFUSED` | Service not running | Start the service |
| `ETIMEDOUT` | Network/firewall issue | Check network connectivity |
| `SQLITE_BUSY` | Database locked | Enable WAL mode, check connections |
| `SQLITE_CORRUPT` | Database corruption | Restore from backup or recover |
| `TypeError: Cannot read property` | Null/undefined access | Add null checks |
| `Plugin validation failed` | Invalid plugin config | Check plugin manifest |
| `CORS error` | Cross-origin blocked | Configure CORS properly |

## Getting Help

### Collecting Diagnostic Information

When reporting issues, collect:


1. **System information:**

```bash
bun --version
docker --version
uname -a
```


2. **Application logs:**

```bash
DOCKSTAT_LOGGER_FULL_FILE_PATH=true bun run dev 2>&1 | tee debug.log
```


3. **API status:**

```bash
curl http://localhost:9876/api/v2/docker/status > status.json
curl http://localhost:9876/api/v2/plugins/status > plugins.json
```


4. **Database schema:**

```typescript
const schema = db.getSchema();
console.log(JSON.stringify(schema, null, 2));
```

### Support Channels

* **GitHub Issues**: [github.com/Its4Nik/DockStat/issues](https://github.com/Its4Nik/DockStat/issues)
* **Wiki**: [outline.itsnik.de](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99)

## Related Documentation

| Section | Description |
|----|----|
| [Configuration](./configuration) | Configuration options and settings |
| [Architecture](./architecture/) | System design for debugging context |
| [API Reference](./api-reference/) | API endpoints for diagnostics |
| [Integration Guide](./integration-guide) | Component interaction details |