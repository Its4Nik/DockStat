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