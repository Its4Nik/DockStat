---
id: 9d7c53bf-b335-4567-a4cc-76388a903020
title: Database
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-12-16T17:25:57.789Z
urlId: GuARMjt63A
---

## Database Schema

```mermaidjs
erDiagram
    BACKEND_LOG_ENTRIES {
      STRING timestamp
      TEXT level
      TEXT message
      TEXT file
      NUMBER line
    }

    STACKS_CONFIG {
      INTEGER id PK
      TEXT name
      INTEGER version
      BOOLEAN custom
      TEXT source
      INTEGER container_count
      TEXT stack_prefix
      BOOLEAN automatic_reboot_on_error
      BOOLEAN image_updates
    }

    DOCKER_HOSTS {
      INTEGER id PK
      TEXT name
      TEXT hostAddress
      BOOLEAN secure
    }

    HOST_STATS {
      INTEGER hostId PK
      TEXT hostName
      TEXT dockerVersion
      TEXT apiVersion
      TEXT os
      TEXT architecture
      INTEGER totalMemory
      INTEGER totalCPU
      TEXT labels
      INTEGER containers
      INTEGER containersRunning
      INTEGER containersStopped
      INTEGER containersPaused
      INTEGER images
    }

    CONTAINER_STATS {
      TEXT id
      TEXT hostId
      TEXT name
      TEXT image
      TEXT status
      TEXT state
      FLOAT cpu_usage
      FLOAT memory_usage
      DATETIME timestamp
    }

    CONFIG {
      NUMBER keep_data_for
      NUMBER fetching_interval
      TEXT api_key
    }
```

### Table Operations

| **Table** | **Function** | **Description** |
|----|----|----|
| **backend_log_entries** | `addLogEntry(level, message, file_name, line)` | Adds a log entry. |
|    | `getAllLogs()` | Retrieves all logs. |
|    | `getLogsByLevel(level)` | Filters logs by severity level. |
|    | `clearAllLogs()` | Clears all logs. |
|    | `clearLogsByLevel(level)` | Clears logs by severity level. |
| **stacks_config** | `addStack(stack_config)` | Adds a stack configuration. |
|    | `getStacks()` | Retrieves all stacks. |
|    | `deleteStack(stack_id)` | Deletes a stack by name. |
|    | `updateStack(stack_config)` | Updates a stack configuration. |
| **docker_hosts** | `addDockerHost(hostId, url, secure)` | Adds a Docker host. |
|    | `getDockerHosts()` | Retrieves all Docker hosts. |
|    | `updateDockerHost(name, url, secure)` | Updates a Docker host. |
|    | `deleteDockerHost(name)` | Deletes a Docker host. |
| **host_stats** | `updateHostStats(stats)` | Updates host statistics. |
| **container_stats** | `addContainerStats(id, hostId, name, image, status, state, cpu_usage, memory_usage)` | Adds container statistics. |
| **config** | `updateConfig(fetching_interval, keep_data_for)` | Updates configuration settings. |
|    | `getConfig()` | Retrieves configuration settings. |
|    | `deleteOldData(days)` | Deletes old data based on retention policy. |