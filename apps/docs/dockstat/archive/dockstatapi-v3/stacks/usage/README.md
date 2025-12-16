---
id: 8e733b65-5df2-4d8f-90e1-da8b127b2b27
title: Usage
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 970cdf56-b108-4468-8d8a-4c9b7d71c2c3
updatedAt: 2025-12-16T17:25:56.111Z
urlId: OaH8UQ4BB3
---

## Endpoint

```
POST /stacks/deploy
```

### Description

Deploys a new Docker stack using a provided Compose specification, allowing custom configurations and image updates.


---

## Request Structure

| Field | Type | Required | Description |
|----|----|----|----|
| `name` | `string` | yes | Name of the stack to deploy. |
| `version` | `number` | yes | Version number of the stack configuration. |
| `custom` | `boolean` | yes | Whether to use a custom deployment process. |
| `source` | `string` | yes | Source identifier (e.g., repository or internal reference). |
| `compose_spec` | `object` | yes | JSON representation of a Docker Compose file. |

The `compose_spec` object must conform to the `ComposeSpec` interface:

```typescript
export interface ComposeSpec {
  version?: string;
  name?: string;
  include?: Include[];
  services?: { [key: string]: Service };
  networks?: { [key: string]: Network };
  volumes?: { [key: string]: Volume };
  secrets?: { [key: string]: Secret };
  configs?: { [key: string]: Config };

  // Allows custom extensions
  [key: `x-${string}`]: any;
}
```


---

## Responses

* **200 OK**
  * **Body**: `{ "message": "Stack <name> deployed successfully" }`
* **400 Bad Request**
  * **Body**: `{ "error": "Error deploying stack" }`


---

## Examples

### 1. Single-Container Stack

Deploy a simple NGINX web server:

```json
{
  "name": "nginx-simple",
  "version": 1,
  "custom": false,
  "source": "internal",
  "compose_spec": {
    "services": {
      "web": {
        "image": "nginx:latest",
        "ports": [
          "80:80"
        ]
      }
    }
  }
}
```

**Result**:

* The API will deploy an NGINX container exposing port 80.


---

### 2. Lightweight Multi-Service Stack

Deploy a simple pair of services that communicate over a shared internal network, using no external files or volumes:

```json
{
  "name": "echo-ping",
  "version": 1,
  "custom": false,
  "source": "internal",
  "compose_spec": {
    "services": {
      "ping": {
        "image": "alpine",
        "command": ["sh", "-c", "apk add curl && sleep 2 && watch -n 5 curl echo:5678"],
        "depends_on": ["echo"],
        "networks": ["testnet"]
      },
      "echo": {
        "image": "ealen/echo-server",
        "ports": ["5678:5678"],
        "networks": ["testnet"]
      }
    },
    "networks": {
      "testnet": {
        "driver": "bridge"
      }
    }
  }
}
```

**Result**:

* `echo` is a lightweight HTTP server that responds to any request.
* `ping` waits a bit, then makes a request to `echo` over the shared `testnet` network.


---

## Tips and Best Practices


1. **Versioning**: Use the `version` field to handle version tracking.
2. **Source Control:** Tracks the source of each version *(e.g: "[https://github.com/Its4Nik/DockStacks](https://github.com/Its4Nik/DockStackshttps://github.com/Its4Nik/DockStacks)")*
3. **Service Isolation**: Use custom networks to securely connect services and reduce unwanted exposure.


---

For further details on the Compose file format, refer to the [Docker Compose documentation](https://docs.docker.com/compose/compose-file/).


:::info
YAML is full JSON compiled, just use a trustable online converter.

:::


:::tip
Better yet, use DockStat!

:::