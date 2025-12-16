---
id: a2b23dbc-0f70-49ef-ad33-73e8421860c7
title: Plugin Development
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-12-16T17:25:58.092Z
urlId: 3UBj9gNMKF
---

## Example plugin

Create `My-Plugin.plugin.ts` files in `src/plugins/`

```typescript
import type { Plugin } from "~/typings/plugin";
import type { ContainerInfo } from "~/typings/docker";
import type { HostStats } from "~/typings/docker";

const ExamplePlugin: Plugin = {
  name: "Example Plugin",
  async onContainerStart(containerInfo: ContainerInfo) {
    console.log(`Container ${containerInfo.name} on ${containerInfo.hostId} started!`
  },
} satisfies Plugin;

export default ExamplePlugin;

// You can also use dbFunctions and all other functions like the default logger!
```

Available hooks:

```typescript
  async onContainerStart(containerInfo: ContainerInfo) {},
  async onContainerStop(containerInfo: ContainerInfo) {},
  async onContainerExit(containerInfo: ContainerInfo) {},
  async onContainerCreate(containerInfo: ContainerInfo) {},
  async onContainerDestroy(containerInfo: ContainerInfo) {},
  async onContainerPause(containerInfo: ContainerInfo) {},
  async onContainerUnpause(containerInfo: ContainerInfo) {},
  async onContainerRestart(containerInfo: ContainerInfo) {},
  async onContainerUpdate(containerInfo: ContainerInfo) {},
  async onContainerRename(containerInfo: ContainerInfo) {},
  async onContainerHealthStatus(containerInfo: ContainerInfo) {},
  async onHostUnreachable(HostStats: HostStats) {},
  async onHostReachableAgain(HostStats: HostStats) {},
```

## Plugin Loader

Scans plugins at startup:

* Validates files don't contain any variation of a "change me" placeholder
* Registers with `PluginManager`

## Hook usage

To try it out when (almost) every hook fires please use the `.local-tests/test-container-changes.sh`script.


---

### **Example Plugin:**

```typescript
import type { Plugin } from "~/typings/plugin";
import type { ContainerInfo } from "~/typings/docker";
import { logger } from "~/core/utils/logger";

const ExamplePlugin: Plugin = {
  name: "Example Plugin",

  async onContainerStart(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} started on ${containerInfo.hostId}`,
    );
  },

  async onContainerStop(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} stopped on ${containerInfo.hostId}`,
    );
  },

  async onContainerExit(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} exited on ${containerInfo.hostId}`,
    );
  },

  async onContainerCreate(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} created on ${containerInfo.hostId}`,
    );
  },

  async onContainerDestroy(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} destroyed on ${containerInfo.hostId}`,
    );
  },

  async onContainerPause(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} pause on ${containerInfo.hostId}`,
    );
  },

  async onContainerUnpause(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} resumed on ${containerInfo.hostId}`,
    );
  },

  async onContainerRestart(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} restarted on ${containerInfo.hostId}`,
    );
  },

  async onContainerUpdate(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} updated on ${containerInfo.hostId}`,
    );
  },

  async onContainerRename(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} renamed on ${containerInfo.hostId}`,
    );
  },

  async onContainerHealthStatus(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} changed status to ${containerInfo.status}`,
    );
  },

  async onHostUnreachable(host: string, err: string) {
    logger.info(`Server ${host} unreachable - ${err}`);
  },

  async onHostReachableAgain(host: string) {
    logger.info(`Server ${host} reachable`);
  },

  async handleContainerDie(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} died on ${containerInfo.hostId}`,
    );
  },

  async onContainerKill(containerInfo: ContainerInfo) {
    logger.info(
      `Container ${containerInfo.name} killed on ${containerInfo.hostId}`,
    );
  },
} satisfies Plugin;

export default ExamplePlugin;
```

### Flow and Commands


1. `docker kill SQLite-Web`

   > Logs:
   >
   > ```jsx
   > // Directly after docker kill
   > DEBUG [ 18/03 21:52:08 ] - Triggering Action [kill] - [ monitor.ts:76 ]
   > INFO  [ 18/03 21:52:08 ] - [ Plugin ] Container SQLite-web killed on Localhost - [ example.plugin.ts:89 ]
   > 
   > // Short pause inbetween
   > 
   > DEBUG [ 18/03 21:52:08 ] - Triggering Action [die] - [ monitor.ts:76 ]
   > INFO  [ 18/03 21:52:08 ] - [ Plugin ] Container SQLite-web died on Localhost - [ example.plugin.ts:83 ]
   > // Done
   > ```
2. `docker start SQLite-Web`

   > Logs:
   >
   > ```jsx
   > DEBUG [ 18/03 21:57:50 ] - Triggering Action [start] - [ monitor.ts:76 ]
   > INFO  [ 18/03 21:57:50 ] - [ Plugin ] Container SQLite-web started on Localhost - [ example.plugin.ts:9 ]
   > ```
3. `docker restart SQLite-Web`

   > Logs: