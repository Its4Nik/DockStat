# @dockstat/docker

> A Bun-native, type-safe wrapper for the Docker API

**@dockstat/docker** provides a modern, fully-typed interface to Docker's remote API, built specifically for [Bun](https://bun.sh). It offers a modular architecture, comprehensive type safety, and support for both Unix sockets and TCP connections with TLS.

## Features

- **Bun-Native**: Optimized for Bun's performance and APIs
- **Type-Safe**: Full TypeScript coverage with generated types from Docker's OpenAPI spec
- **Modular Architecture**: Separate modules for containers, images, networks, volumes, and more
- **Flexible Connection**: Support for Unix sockets, TCP, and TLS-secured connections
- **Environment-Based Config**: Automatically reads Docker environment variables (like the Docker CLI)
- **Zero Dependencies**: Minimal footprint, leveraging Bun's built-in capabilities

## Installation

```bash
bun add @dockstat/docker
```

## Quick Start

### Using Environment Variables

The easiest way to get started is by letting the package auto-configure from your environment:

```ts
import { createDockerFromEnv } from "@dockstat/docker"

const docker = createDockerFromEnv()
```

This reads from standard Docker environment variables:
- `DOCKER_SOCKET` - Path to Unix socket or TCP URL (default: `/var/run/docker.sock`)
- `CERT_FILE`, `KEY_FILE`, `CA_FILE` - Paths to TLS certificates

### Manual Configuration

For full control over the connection:

```ts
import { Docker } from "@dockstat/docker"

// Unix socket connection
const docker = new Docker({
  mode: "unix",
  socketPath: "/var/run/docker.sock"
})

// TCP connection
const docker = new Docker({
  mode: "tcp",
  baseUrl: "http://localhost:2375"
})

// TCP with TLS
const docker = new Docker({
  mode: "tcp",
  baseUrl: "https://remote-docker:2376",
  tls: {
    cert: Bun.file("/path/to/cert.pem"),
    key: Bun.file("/path/to/key.pem"),
    ca: Bun.file("/path/to/ca.pem")
  }
})
```

### Verify Connection

```ts
const isConnected = await docker.ping()
console.log("Docker daemon reachable:", isConnected)
```

## Usage

### Containers

List all containers:

```ts
const containers = await docker.containers.list()
console.log(containers)
```

List running containers only:

```ts
const runningContainers = await docker.containers.list({
  all: false
})
```

Create and start a container:

```ts
const result = await docker.containers.create({
  Image: "nginx:latest",
  Env: ["NGINX_PORT=80"]
})
await docker.containers.start(result.Id)
```

Inspect a container:

```ts
const details = await docker.containers.inspect("my-container")
console.log(details.State)
```

Get container logs:

```ts
const logs = await docker.containers.logs("my-container", {
  stdout: true,
  stderr: true
})
```

Stop and remove a container:

```ts
await docker.containers.stop("my-container")
await docker.containers.remove("my-container", false, true)
```

### Images

List images:

```ts
const images = await docker.images.list()
```

Pull an image:

```ts
await docker.images.create("nginx:latest", {})
```

### Networks

List networks:

```ts
const networks = await docker.networks.list()
```

Create a network:

```ts
await docker.networks.create({
  Name: "my-network",
  Driver: "bridge"
})
```

### Volumes

List volumes:

```ts
const volumes = await docker.volumes.list()
```

Create a volume:

```ts
await docker.volumes.create({
  Name: "my-volume",
  Driver: "local"
})
```

### Executing Commands

Run a command in a container:

```ts
// Create exec instance
const exec = await docker.containers.execCreate("my-container", {
  AttachStdout: true,
  AttachStderr: true,
  Cmd: ["ls", "-la", "/app"]
})

// Start exec and get output
const response = await docker.containers.execStart(exec.Id)
```

### Statistics

Get container resource usage:

```ts
// Get single stats snapshot
const stats = await docker.containers.stats("my-container")
console.log(stats.cpu_stats, stats.memory_stats)

// Stream stats
const stream = await docker.containers.stats("my-container", { stream: true })
// stream is a Response object with streaming body
```

## API Modules

The `Docker` class provides access to the following modules:

- **`containers`** - Container lifecycle, logs, stats, exec, filesystem operations
- **`images`** - Image management, building, pulling
- **`networks`** - Network creation, inspection, connection management
- **`volumes`** - Volume lifecycle and management
- **`exec`** - Execute commands in running containers
- **`distribution`** - Registry and distribution operations
- **`nodes`** - Swarm node management

All modules are fully typed with TypeScript types generated from Docker's OpenAPI specification.

## Configuration

### Connection Modes

**Unix Socket** (default):

```ts
{
  mode: "unix",
  socketPath: "/var/run/docker.sock",
  tls?: TLSOptions
}
```

**TCP**:

```ts
{
  mode: "tcp",
  baseUrl: "http://localhost:2375",
  tls?: TLSOptions
}
```

### Environment Variables

When using `createDockerFromEnv()`, the following environment variables are respected:

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCKER_SOCKET` | Unix socket path or TCP URL | `/var/run/docker.sock` |
| `CERT_FILE` | Path to client certificate | - |
| `KEY_FILE` | Path to client key | - |
| `CA_FILE` | Path to CA certificate | - |

## TypeScript Support

This package includes comprehensive TypeScript types for all Docker API operations.

All methods return properly typed responses:

```ts
import type { ContainerInspectResponse } from "@dockstat/docker"

const container: ContainerInspectResponse = await docker.containers.inspect("my-id")
// Full type safety and autocomplete
```

## Part of the DockStat Ecosystem

`@dockstat/docker` is a core package in the [DockStat](https://github.com/its4nik/dockstat) project, an extensible container administration and monitoring platform. It powers Docker interactions throughout the DockStat ecosystem, providing a unified, type-safe interface for container management.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Follow the existing code style and structure
2. Ensure TypeScript types are properly defined
3. Add JSDoc comments for public APIs
4. Test your changes thoroughly

For detailed development guidelines, see the [main DockStat README](https://github.com/its4nik/dockstat).

## License

[ Mozilla Public License Version 2.0 ](https://www.mozilla.org/en-US/MPL/2.0/)

---

**Made with ❤️ for the DockStat project**
