# @dockstat/docker-swarm

A comprehensive TypeScript/JavaScript library for Docker Swarm operations, providing a clean, modular, and type-safe interface for managing Docker Swarm clusters, services, nodes, stacks, secrets, configs, and networks.

## Features

- 🐳 **Full Docker Swarm API Coverage** - Complete support for Swarm cluster operations
- 🔌 **Multiple Connection Methods** - Connect via Unix socket, TCP, SSH, or TLS
- 📦 **Modular Architecture** - Organized modules for each Swarm resource type
- 🛡️ **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🔍 **Logging & Debugging** - Built-in logging with optional debug mode
- 🎯 **Utility Functions** - Helpers for parsing Docker Compose configurations
- ⚡ **Modern & Fast** - Built with Bun runtime for optimal performance

## Installation

```bash
bun add @dockstat/docker-swarm
```

Or with npm/yarn:

```bash
npm install @dockstat/docker-swarm
# or
yarn add @dockstat/docker-swarm
```

## Quick Start

```typescript
import { SwarmClient } from "@dockstat/docker-swarm"

// Initialize the client (defaults to /var/run/docker.sock)
const client = new SwarmClient()

// Check if Docker is available and running
const available = await client.isAvailable()
console.log("Docker available:", available)

// Check if node is part of a swarm
const inSwarm = await client.isSwarmNode()
console.log("In swarm:", inSwarm)

// Get swarm status
const status = await client.swarm.getStatus()
console.log("Swarm status:", status)
```

## Connection Options

### Unix Socket (Default)

```typescript
const client = new SwarmClient({
  socketPath: "/var/run/docker.sock",
})
```

### TCP Connection

```typescript
const client = new SwarmClient({
  host: "http://localhost:2375",
  timeout: 30000,
})
```

### TLS/SSL Connection

```typescript
import { readFileSync } from "fs"

const client = new SwarmClient({
  host: "https://docker.example.com:2376",
  tls: {
    ca: readFileSync("/path/to/ca.pem"),
    cert: readFileSync("/path/to/cert.pem"),
    key: readFileSync("/path/to/key.pem"),
  },
})
```

### SSH Connection

```typescript
import { readFileSync } from "fs"

const client = new SwarmClient({
  ssh: {
    host: "remote-docker.example.com",
    port: 22,
    username: "docker",
    privateKey: readFileSync("/path/to/ssh-key"),
    passphrase: "your-passphrase",
  },
})
```

## Swarm Operations

### Initialize a New Swarm

```typescript
// Initialize as a manager
const result = await client.swarm.init({
  listenAddr: "0.0.0.0:2377",
  advertiseAddr: "192.168.1.100:2377",
})

console.log("Worker join token:", result.workerToken)
console.log("Manager join token:", result.managerToken)
```

### Join an Existing Swarm

```typescript
await client.swarm.join({
  joinToken: "SWMTKN-1-xxx",
  remoteAddrs: ["192.168.1.100:2377"],
  listenAddr: "0.0.0.0:2377",
})
```

### Leave a Swarm

```typescript
// Graceful leave
await client.swarm.leave()

// Force leave (for managers)
await client.swarm.leave({ force: true })
```

### Get Swarm Status

```typescript
const status = await client.swarm.getStatus()
console.log({
  id: status.id,
  nodeID: status.nodeID,
  isManager: status.isManager,
  nodeAddr: status.nodeAddr,
  joinTokens: status.joinTokens,
})
```

### Get Join Tokens

```typescript
const tokens = await client.swarm.getJoinTokens()
console.log("Worker token:", tokens.worker)
console.log("Manager token:", tokens.manager)
```

### Rotate Join Tokens

```typescript
const newTokens = await client.swarm.rotateJoinTokens()
console.log("New worker token:", newTokens.worker)
```

## Service Operations

### List All Services

```typescript
const services = await client.services.list()
console.log(`Found ${services.length} services`)

// Filter services
const filteredServices = await client.services.list({
  name: "my-service",
  label: ["environment=production"],
  mode: "replicated",
})
```

### Get a Specific Service

```typescript
const service = await client.services.get("service-id-or-name")
console.log({
  id: service.id,
  name: service.spec.name,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
})
```

### Create a Service

```typescript
const service = await client.services.create({
  name: "my-web-app",
  image: "nginx:latest",
  replicas: 3,
  env: {
    NODE_ENV: "production",
    PORT: "8080",
  },
  ports: [
    { protocol: "tcp", target: 80, published: 8080 },
  ],
  networks: ["my-network"],
  labels: {
    "com.example.description": "Web application",
  },
  containerLabels: {
    "com.example.version": "1.0.0",
  },
  resources: {
    limits: {
      nanoCPUs: 1000000000, // 1 CPU
      memoryBytes: 536870912, // 512 MB
    },
    reservations: {
      nanoCPUs: 500000000, // 0.5 CPU
      memoryBytes: 268435456, // 256 MB
    },
  },
  restartPolicy: {
    condition: "on-failure",
    maxAttempts: 3,
    delay: "5s",
    window: "10s",
  },
  constraints: ["node.role==worker"],
  logDriver: "json-file",
  logOptions: {
    "max-size": "10m",
    "max-file": "3",
  },
})

console.log("Created service:", service.id)
```

### Update a Service

```typescript
const updated = await client.services.update("service-id", {
  image: "nginx:1.25",
  replicas: 5,
  env: {
    NODE_ENV: "production",
    PORT: "8080",
    FEATURE_ENABLED: "true",
  },
  labels: {
    "com.example.version": "2.0.0",
  },
  version: 123, // Service version for optimistic locking
})

console.log("Updated service:", updated.id)
```

### Scale a Service

```typescript
// Scale to 10 replicas
const scaled = await client.services.scale("service-id", 10)
console.log("Scaled to", scaled.spec.taskTemplate.replicas)
```

### Remove a Service

```typescript
await client.services.remove("service-id")
console.log("Service removed")
```

### Get Service Logs

```typescript
const logs = await client.services.logs("service-id", {
  stdout: true,
  stderr: true,
  tail: 100,
  timestamps: true,
  follow: false,
})

console.log(logs)
```

### Get Service by Name

```typescript
const service = await client.services.getByName("my-web-app")
if (service) {
  console.log("Found service:", service.id)
} else {
  console.log("Service not found")
}
```

## Node Operations

### List All Nodes

```typescript
const nodes = await client.nodes.list()
console.log(`Found ${nodes.length} nodes`)

// Filter nodes
const workerNodes = await client.nodes.list({
  role: "worker",
  availability: "active",
})
```

### Get a Specific Node

```typescript
const node = await client.nodes.get("node-id-or-name")
console.log({
  id: node.id,
  hostname: node.description.hostname,
  status: node.status.state,
  availability: node.spec.availability,
  role: node.spec.role,
})
```

### Update a Node

```typescript
const updated = await client.nodes.update("node-id", {
  availability: "drain",
  role: "manager",
  labels: {
    "node.environment": "production",
  },
  version: 456, // Node version for optimistic locking
})
```

### Remove a Node

```typescript
await client.nodes.remove("node-id", { force: true })
```

## Task Operations

### List All Tasks

```typescript
const tasks = await client.tasks.list()
console.log(`Found ${tasks.length} tasks`)

// Filter tasks
const serviceTasks = await client.tasks.list({
  service: ["my-service"],
  desiredState: "running",
  node: ["node-id"],
})
```

### Get a Specific Task

```typescript
const task = await client.tasks.get("task-id")
console.log({
  id: task.id,
  serviceId: task.serviceID,
  nodeId: task.nodeID,
  status: task.status.state,
  desiredState: task.desiredState,
})
```

## Stack Operations

### List All Stacks

```typescript
const result = await client.stacks.list()
console.log(`Found ${result.stacks.length} stacks`)

result.stacks.forEach(stack => {
  console.log(`- ${stack.name}: ${stack.services.length} services`)
})
```

### Deploy a Stack

```typescript
const composeYaml = `
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    networks:
      - webnet
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    networks:
      - dbnet
networks:
  webnet:
  dbnet:
`

const stack = await client.stacks.deploy({
  name: "my-app",
  compose: composeYaml,
  env: {
    POSTGRES_PASSWORD: "my-secret-password",
  },
})

console.log("Deployed stack:", stack.name)
```

### Remove a Stack

```typescript
await client.stacks.remove("my-app")
console.log("Stack removed")
```

### Get Stack Info

```typescript
const info = await client.stacks.get("my-app")
console.log({
  name: info.name,
  services: info.services,
})
```

## Secret Operations

### List All Secrets

```typescript
const secrets = await client.secrets.list()
console.log(`Found ${secrets.length} secrets`)

// Filter secrets
const filtered = await client.secrets.list({
  name: ["my-secret"],
  label: ["environment=production"],
})
```

### Create a Secret

```typescript
const secret = await client.secrets.create({
  name: "db-password",
  data: Buffer.from("my-secret-password"),
  labels: {
    "com.example.description": "Database password",
  },
})

console.log("Created secret:", secret.id)
```

### Get a Specific Secret

```typescript
const secret = await client.secrets.get("secret-id-or-name")
console.log({
  id: secret.id,
  name: secret.spec.name,
  createdAt: secret.createdAt,
  updatedAt: secret.updatedAt,
})
```

### Update a Secret

```typescript
const updated = await client.secrets.update("secret-id", {
  data: Buffer.from("new-password"),
  labels: {
    "com.example.version": "2.0.0",
  },
  version: 789, // Secret version for optimistic locking
})
```

### Remove a Secret

```typescript
await client.secrets.remove("secret-id")
```

## Config Operations

### List All Configs

```typescript
const configs = await client.configs.list()
console.log(`Found ${configs.length} configs`)

// Filter configs
const filtered = await client.configs.list({
  name: ["my-config"],
  label: ["environment=production"],
})
```

### Create a Config

```typescript
const config = await client.configs.create({
  name: "app-config",
  data: Buffer.from(JSON.stringify({ apiKey: "xyz", apiUrl: "https://api.example.com" })),
  labels: {
    "com.example.description": "Application configuration",
  },
})

console.log("Created config:", config.id)
```

### Get a Specific Config

```typescript
const config = await client.configs.get("config-id-or-name")
console.log({
  id: config.id,
  name: config.spec.name,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
})
```

### Update a Config

```typescript
const updated = await client.configs.update("config-id", {
  data: Buffer.from(JSON.stringify({ apiKey: "abc", apiUrl: "https://newapi.example.com" })),
  labels: {
    "com.example.version": "2.0.0",
  },
  version: 123, // Config version for optimistic locking
})
```

### Remove a Config

```typescript
await client.configs.remove("config-id")
```

## Network Operations

### List All Networks

```typescript
const networks = await client.networks.list()
console.log(`Found ${networks.length} networks`)
```

### Create a Network

```typescript
const network = await client.networks.create({
  name: "my-overlay-network",
  driver: "overlay",
  labels: {
    "com.example.description": "Overlay network for services",
  },
  options: {
    encrypted: "true",
  },
})

console.log("Created network:", network.id)
```

### Get a Specific Network

```typescript
const network = await client.networks.get("network-id-or-name")
console.log({
  id: network.id,
  name: network.name,
  driver: network.driver,
  scope: network.scope,
})
```

### Remove a Network

```typescript
await client.networks.remove("network-id")
```

### Inspect a Network

```typescript
const details = await client.networks.inspect("network-id")
console.log("Network details:", details)
```

## Utility Functions

### Parsing Port Specifications

```typescript
import { parsePortSpec } from "@dockstat/docker-swarm"

// Parse "80:8080/tcp"
const port = parsePortSpec("80:8080/tcp")
console.log(port) // { published: 80, target: 8080, protocol: "tcp" }

// Parse "80"
const port2 = parsePortSpec("80")
console.log(port2) // { target: 80, protocol: "tcp" }
```

### Parsing Mount Specifications

```typescript
import { parseMountSpec } from "@dockstat/docker-swarm"

// Parse "/host/path:/container/path:ro"
const mount = parseMountSpec("/host/path:/container/path:ro")
console.log(mount) // { type: "bind", source: "/host/path", target: "/container/path", readOnly: true }

// Parse "volume-name:/container/path"
const mount2 = parseMountSpec("volume-name:/container/path")
console.log(mount2) // { type: "volume", source: "volume-name", target: "/container/path", readOnly: false }
```

### Parsing Environment Variables

```typescript
import { parseEnvContent, envRecordToArray, envArrayToRecord } from "@dockstat/docker-swarm"

// Parse .env file content
const envContent = `
NODE_ENV=production
API_KEY=secret_key
# Comment line
DEBUG=true
`

const env = parseEnvContent(envContent)
console.log(env) // { NODE_ENV: "production", API_KEY: "secret_key", DEBUG: "true" }

// Convert record to array
const envArray = envRecordToArray(env)
console.log(envArray) // ["NODE_ENV=production", "API_KEY=secret_key", "DEBUG=true"]

// Convert array to record
const envRecord = envArrayToRecord(envArray)
console.log(envRecord) // { NODE_ENV: "production", API_KEY: "secret_key", DEBUG: "true" }
```

### Validating Docker Compose Structure

```typescript
import { validateComposeStructure } from "@dockstat/docker-swarm"

const compose = `
version: '3.8'
services:
  web:
    image: nginx:latest
`

const validation = validateComposeStructure(compose)
console.log({
  valid: validation.valid,
  errors: validation.errors,
  services: validation.services,
})
```

### Docker Connection Utilities

```typescript
import {
  buildConnectionConfig,
  isSocketAvailable,
  buildApiUrl,
  parseDockerVersion,
  compareVersions,
} from "@dockstat/docker-swarm"

// Build connection config
const config = buildConnectionConfig({ socketPath: "/var/run/docker.sock" })

// Check if socket is available
const available = await isSocketAvailable("/var/run/docker.sock")

// Build API URL
const apiUrl = buildApiUrl("/containers/json", "http://localhost:2375")

// Parse Docker version
const version = parseDockerVersion("24.0.7")

// Compare versions
const comparison = compareVersions("24.0.7", "23.0.0") // Returns 1 (greater)
```

## Health Checks

```typescript
const health = await client.healthCheck()
console.log({
  connected: health.connected,
  inSwarm: health.inSwarm,
  isManager: health.isManager,
  nodeCount: health.nodeCount,
  serviceCount: health.serviceCount,
})
```

## Version and System Information

```typescript
// Get Docker version
const version = await client.version()
console.log(version) // { version, apiVersion, gitCommit, goVersion, os, arch }

// Get Docker system info
const info = await client.info()
console.log(info)
```

## Error Handling

The library uses custom `SwarmError` for all operation errors:

```typescript
import { SwarmError, SwarmErrorCode } from "@dockstat/docker-swarm"

try {
  const service = await client.services.get("nonexistent-service")
} catch (error) {
  if (error instanceof SwarmError) {
    switch (error.code) {
      case SwarmErrorCode.SERVICE_NOT_FOUND:
        console.error("Service not found:", error.message)
        break
      case SwarmErrorCode.SERVICE_UPDATE_FAILED:
        console.error("Failed to update service:", error.message)
        break
      case SwarmErrorCode.SERVICE_SCALE_FAILED:
        console.error("Failed to scale service:", error.message)
        break
      default:
        console.error("Unknown error:", error.message)
    }
  }
}
```

## Advanced Usage

### Working with Global Services

```typescript
const service = await client.services.create({
  name: "global-monitor",
  image: "prom/node-exporter:latest",
  mode: "global",
  networks: ["monitoring"],
})
```

### Placement Constraints

```typescript
const service = await client.services.create({
  name: "database",
  image: "postgres:15",
  constraints: [
    "node.labels.environment==production",
    "node.role==manager",
    "node.hostname!=node-1",
  ],
})
```

### Multiple Ports

```typescript
const service = await client.services.create({
  name: "web-app",
  image: "nginx:latest",
  ports: [
    { protocol: "tcp", target: 80, published: 8080 },
    { protocol: "tcp", target: 443, published: 8443 },
  ],
})
```

### Environment from Array

```typescript
const service = await client.services.create({
  name: "api",
  image: "node:18",
  env: [
    "NODE_ENV=production",
    "PORT=3000",
    "DEBUG=*",
  ],
})
```

## TypeScript Support

The library is fully typed. Import types as needed:

```typescript
import type {
  ServiceInfo,
  ServiceCreateOptions,
  NodeInfo,
  TaskInfo,
  SecretInfo,
  ConfigInfo,
  NetworkInfo,
  SwarmStatus,
} from "@dockstat/docker-swarm"
```

## API Reference

For detailed API documentation, refer to the TypeScript type definitions in the source code or use your IDE's IntelliSense features.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub: https://github.com/Its4Nik/DockStat/issues
