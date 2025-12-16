---
id: 970cdf56-b108-4468-8d8a-4c9b7d71c2c3
title: Stacks
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-08-18T22:50:53.197Z
urlId: mlJ2fQWpdT
---

## Compose Stack Lifecycle

```mermaidjs
graph LR
  A[Deploy] --> B[Create YAML]
  B --> C[Store Config]
  C --> D[Compose Up]
  
  D --> E[Start/Stop]
  E --> F[Status Monitoring]
```

## API Endpoints

| Method | Path | Description |
|----|----|----|
| POST | `/stacks/deploy` | Deploy new Stack=> writes yaml and `docker compose up` |
| POST | `/stacks/start` | Start a Stack<br>=> `docker compose up` |
| POST | `/stacks/stop` | Puts a Stack down <br>=> `docker compose down` |
| POST | `/stacks/restart` | Restarts a Stack=> `docker compose restart` |
| POST | `/stacks/pull-images` | Pulls all images for a Stack=> `docker compose pull` |
| GET | `/stacks/status` | Gets custom Stack status=> Adjusted: `docker compose ps` |
| GET | `/stacks` | Lists all available Stacks |

## Storage

Stored in `stacks/` directory as:

```
/stacks
  /my_stack
    docker-compose.yaml
    my-folder-for-a-service/...
```