---
id: 3e9d366d-9001-4448-bad8-30f5ff4eb784
title: Background Tasks
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-08-18T22:50:56.512Z
urlId: 0WCNZPcXkn
---

## Background Tasks

| Default Interval | Task | Config name in the Database |
|----|----|----|
| 5 min | Container and Host metrics collection | `fetching_interval` |
| 7 days | How long Database entries should be kept | `keep_data_for` |

## Configure

### 1. Through DockStat

All configuration can be done through DockStat, please see the DockStat (v2) Documentation \[W.I.P\] for more information

### 2. Manually

You can also configure DockStatAPI through a simple `curl` command or similar commands.

This is the expected Data structure:

```none
POST /config/update {
  keep_data_for: 7,
  fetching_interval: 5
}
```