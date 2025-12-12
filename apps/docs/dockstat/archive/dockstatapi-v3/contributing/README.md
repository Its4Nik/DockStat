---
id: 19ddc854-ab6c-4d8b-93e7-9f8d2ced1a56
title: Contributing
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-08-18T22:50:52.752Z
urlId: cwmU68uCTn
---

# DockStatAPI Development Setup

## Development Environment Overview

### Prerequisites

* [Bun](https://bun.sh/) (v1.1.4 or newer)
* Docker Desktop (with compose support) or Docker-engine
* Node.js 18+ (for cross-platform scripts)

### Key Tools

* **Bun**: Primary runtime & package manager
* **Socket Proxy**: Secure Docker API gateway
* **SQLite Web**: Database visualization
* **Elysia**: Web framework

## Getting Started


1. **Clone Repository**

```bash
git clone https://github.com/Its4Nik/DockStatAPI.git

cd DockStatAPI
```


2. **Install Dependencies**

```bash
bun install
```


3. **Start Development Environment**

```bash
bun run dev
```

This will:

* Start Docker Socket Proxy (port 2375)
* Launch SQLite Web UI (port 8080)
* Run API server with file watching (port 3000)

## Development Commands

| Command | Description |
|----|----|
| `bun dev` | Start full dev stack with hot reload |
| `bun dev:clean` | Clean the database files if the server crashes unexpectedly |
| `bun clean` | Remove database files (OS-aware) |
| `bun build` | Create production build in `/dist` |
| `bun build:docker` | Build a local Docker image (***dockstatapi:local***) |
| `bun knip` | Analyze for dead code/unused dependencies |

## Environment Variables

| Variable | Default | Description |
|----|----|----|
| `NODE_ENV` | dev | Runtime environment |
| `LOG_LEVEL` | debug (In dev mode) | Log verbosity (error, warn, info…) |
| `PAD_NEW_LINES` | true | Pads new log lines (only in the Console output) |

## Docker Development Services

### 1. Socket Proxy (Docker API)

* **Port**: 2375
* **Purpose**: Secure Docker socket access
* **Config**: Limited API endpoints enabled
* **Access**: `http://localhost:2375`

### 2. SQLite Web

* **Port**: 8080
* **Purpose**: Database management UI
* **Credentials**: None (read-only access)
* **Access**: `http://localhost:8080`

## Development Tips

### Database Management

* Database file: `dockstatapi.db`
* Web UI: <http://localhost:8080>
* Schema changes: Modify `~/core/database/database.ts`

### Testing Docker Interactions

```bash
curl http://localhost:2375/v1.41/containers/json
```

### Production Build

```bash
bun run build && bun start
```

## Troubleshooting

**Docker Permission Issues**

```bash
sudo chmod 666 /var/run/docker.sock
```

**Clean Environment**

```bash
bun clean && docker compose -f docker/docker-compose.dev.yaml down
```

**Windows Path Issues**

Use WSL2 for full compatibility with shell commands