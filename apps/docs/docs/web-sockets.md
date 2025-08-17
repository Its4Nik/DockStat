:::info
Use either `ws://` or `wss://` depending on your setup.

:::

# Docker Stats socket


:::info
A Web Socket endpoint for Live Statistics of Docker Containers

:::

## Usage

Connect to `<PROTOCOL><SERVER_IP>:<SERVER_PORT>/docker/stats`

## Example

```json
{
  "message": "Connection established"
}
{
  "id": "XXX",
  "hostId": "Localhost",
  "name": "SQLite-web",
  "image": "ghcr.io/coleifer/sqlite-web:latest",
  "status": "Up 2 hours",
  "state": "running",
  "cpuUsage": 0.001024106400665004,
  "memoryUsage": 0.1788478730664797
}
{
  "id": "YYY",
  "hostId": "Localhost",
  "name": "Socket-Proxy",
  "image": "lscr.io/linuxserver/socket-proxy:latest",
  "status": "Up 2 hours",
  "state": "running",
  "cpuUsage": 0.002458021612635079,
  "memoryUsage": 0.03701313770551838
}
```


---

# Logging Socket

## Usage

Connect to `<PROTOCOL><SERVER_IP>:<SERVER_PORT>/logs/ws`

## Example Data

```json
{
  "message": "Connection established"
}
{
  level: "INFO"
  timestamp: "...",
  message: "Starting DockStatAPI",
  file: "index.ts",
  line: 5
}
```


---

# Stack Socket

## Usage

Connect to `<PROTOCOL><SERVER_IP>:<SERVER_PORT>/stacks`

## Example Data


---

### ✅ Stack Status Update

```json
{
  "type": "stack-status",
  "data": {
    "stack_id": 12,
    "status": "pending",
    "message": "Creating stack configuration"
  }
}
```


---

### 🚀 Stack Deployment Success

```json
{
  "type": "stack-status",
  "data": {
    "stack_id": 12,
    "status": "deployed",
    "message": "Stack deployed successfully"
  }
}
```


---

### ⚙️ Stack Progress Log (During Start/Deploy/etc.)

```json
{
  "type": "stack-progress",
  "data": {
    "stack_id": 12,
    "action": "deploying",
    "message": "Creating network my_stack_default",
    "timestamp": "2025-04-16T18:25:43.511Z"
  }
}
```


---

### ❌ Stack Error

```json
{
  "type": "stack-error",
  "data": {
    "stack_id": 12,
    "action": "deploying",
    "message": "Error while deploying stack \"12\": Docker daemon not reachable",
    "timestamp": "2025-04-16T18:26:10.115Z"
  }
}
```


---

### 🗑️ Stack Removed

```json
{
  "type": "stack-removed",
  "data": {
    "stack_id": 12,
    "message": "Stack removed successfully"
  }
}
```


---