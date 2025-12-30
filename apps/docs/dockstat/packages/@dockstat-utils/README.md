---
id: d3039895-f53c-46ab-89ce-de0ad22ce03c
title: "@dockstat/utils"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2025-12-29T20:53:31.102Z
urlId: dHg9YfruFJ
---

> A collection of shared utility functions used across DockStat packages and applications. Provides common helpers for string manipulation, data formatting, type checking, and other frequently needed operations.

## Overview

`@dockstat/utils` centralizes common utility functions to ensure consistency and reduce code duplication across the DockStat monorepo. These utilities are designed to be lightweight, well-tested, and tree-shakeable.

```mermaidjs

graph TB
    subgraph "Consumers"
        API["apps/api"]
        DS["apps/dockstat"]
        DC["@dockstat/docker-client"]
        UI["@dockstat/ui"]
        PH["@dockstat/plugin-handler"]
    end

    subgraph "@dockstat/utils"
        STRING["String Utilities"]
        FORMAT["Formatting Utilities"]
        TYPE["Type Utilities"]
        DATA["Data Utilities"]
        ASYNC["Async Utilities"]
    end

    API --> STRING
    API --> FORMAT
    DS --> FORMAT
    DS --> TYPE
    DC --> ASYNC
    DC --> DATA
    UI --> STRING
    UI --> FORMAT
    PH --> TYPE
    PH --> DATA
```

## Installation

```bash
bun add @dockstat/utils # currently only available in the Monorepo!  
```

## Quick Start

```typescript
import { 
  formatBytes, 
  formatDuration, 
  truncate, 
  debounce,
  isNotNullish
} from "@dockstat/utils";

// Format container memory usage

const memoryStr = formatBytes(1073741824); // "1.00 GB"

// Format container uptime

const uptimeStr = formatDuration(86400000); // "1d 0h 0m"

// Truncate long container names

const shortName = truncate("very-long-container-name-here", 20); // "very-long-contain..."

// Debounce search input

const debouncedSearch = debounce((query) => {
  console.log("Searching:", query);
}, 300);

// Filter out null/undefined values

const validItems = items.filter(isNotNullish);
```

## Utility Categories

### String Utilities

#### truncate

Truncates a string to a specified length with an ellipsis.

```typescript
import { truncate } from "@dockstat/utils";

truncate("Hello World", 5);        // "Hello..."
truncate("Hi", 10);                // "Hi"
truncate("Hello World", 8, "…");   // "Hello Wo…"
```

**Signature:**

```typescript
function truncate(
  str: string, 
  maxLength: number, 
  suffix?: string
): string
```

#### capitalize

Capitalizes the first letter of a string.

```typescript
import { capitalize } from "@dockstat/utils";

capitalize("hello");      // "Hello"
capitalize("WORLD");      // "WORLD"
capitalize("hello world"); // "Hello world"
```

#### camelToKebab

Converts camelCase to kebab-case.

```typescript
import { camelToKebab } from "@dockstat/utils";

camelToKebab("containerName");    // "container-name"
camelToKebab("myDockerHost");     // "my-docker-host"
camelToKebab("APIResponse");      // "api-response"
```

#### kebabToCamel

Converts kebab-case to camelCase.

```typescript
import { kebabToCamel } from "@dockstat/utils";

kebabToCamel("container-name");   // "containerName"
kebabToCamel("my-docker-host");   // "myDockerHost"
```

#### slugify

Creates a URL-friendly slug from a string.

```typescript
import { slugify } from "@dockstat/utils";

slugify("Hello World!");          // "hello-world"
slugify("My Container Name");     // "my-container-name"
slugify("nginx/proxy:latest");    // "nginx-proxy-latest"
```

#### escapeHtml

Escapes HTML special characters.

```typescript
import { escapeHtml } from "@dockstat/utils";

escapeHtml("<script>alert('xss')</script>");
// "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

### Formatting Utilities

#### formatBytes

Formats bytes into human-readable strings.

```typescript
import { formatBytes } from "@dockstat/utils";

formatBytes(0);                   // "0 Bytes"
formatBytes(1024);                // "1.00 KB"
formatBytes(1048576);             // "1.00 MB"
formatBytes(1073741824);          // "1.00 GB"
formatBytes(1099511627776);       // "1.00 TB"

// Custom decimal places

formatBytes(1536, 0);             // "2 KB"
formatBytes(1536, 3);             // "1.500 KB"
```

**Signature:**

```typescript
function formatBytes(
  bytes: number, 
  decimals?: number
): string
```

#### formatDuration

Formats milliseconds into a human-readable duration.

```typescript
import { formatDuration } from "@dockstat/utils";

formatDuration(1000);             // "1s"
formatDuration(60000);            // "1m 0s"
formatDuration(3600000);          // "1h 0m"
formatDuration(86400000);         // "1d 0h 0m"
formatDuration(90061000);         // "1d 1h 1m"

// Compact format

formatDuration(90061000, { compact: true }); // "1d 1h"
```

**Signature:**

```typescript
function formatDuration(
  ms: number, 
  options?: { compact?: boolean }
): string
```

#### formatNumber

Formats numbers with thousands separators.

```typescript
import { formatNumber } from "@dockstat/utils";

formatNumber(1234);               // "1,234"
formatNumber(1234567.89);         // "1,234,567.89"
formatNumber(1234, "de-DE");      // "1.234"
```

#### formatPercent

Formats a number as a percentage.

```typescript
import { formatPercent } from "@dockstat/utils";

formatPercent(0.5);               // "50%"
formatPercent(0.1234, 2);         // "12.34%"
formatPercent(1.5);               // "150%"
```

#### formatDate

Formats dates into readable strings.

```typescript
import { formatDate } from "@dockstat/utils";

const date = new Date("2024-01-15T10:30:00Z");

formatDate(date);                 // "Jan 15, 2024"
formatDate(date, "short");        // "1/15/24"
formatDate(date, "long");         // "January 15, 2024"
formatDate(date, "time");         // "10:30 AM"
formatDate(date, "datetime");     // "Jan 15, 2024, 10:30 AM"
formatDate(date, "iso");          // "2024-01-15T10:30:00.000Z"
```

#### relativeTime

Formats a date as relative time (e.g., "2 hours ago").

```typescript
import { relativeTime } from "@dockstat/utils";

const past = new Date(Date.now() - 3600000);
relativeTime(past);               // "1 hour ago"

const future = new Date(Date.now() + 86400000);
relativeTime(future);             // "in 1 day"
```

### Type Utilities

#### isNotNullish

Type guard that checks if a value is not null or undefined.

```typescript
import { isNotNullish } from "@dockstat/utils";

const items = [1, null, 2, undefined, 3];
const valid = items.filter(isNotNullish); // [1, 2, 3]

// Type narrowing works correctly

if (isNotNullish(value)) {
  // value is guaranteed to be non-null here
}
```

#### isString

Type guard for strings.

```typescript
import { isString } from "@dockstat/utils";

isString("hello");                // true
isString(123);                    // false
isString(null);                   // false
```

#### isNumber

Type guard for numbers.

```typescript
import { isNumber } from "@dockstat/utils";

isNumber(123);                    // true
isNumber("123");                  // false
isNumber(NaN);                    // false
isNumber(Infinity);               // true
```

#### isObject

Type guard for plain objects.

```typescript
import { isObject } from "@dockstat/utils";

isObject({});                     // true
isObject({ a: 1 });               // true
isObject([]);                     // false
isObject(null);                   // false
isObject(new Date());             // false
```

#### isArray

Type guard for arrays.

```typescript
import { isArray } from "@dockstat/utils";

isArray([]);                      // true
isArray([1, 2, 3]);               // true
isArray("array");                 // false
```

#### isFunction

Type guard for functions.

```typescript
import { isFunction } from "@dockstat/utils";

isFunction(() => {});             // true
isFunction(function() {});        // true
isFunction(class {});             // true
isFunction({});                   // false
```

### Data Utilities

#### pick

Creates an object with only the specified keys.

```typescript

import { pick } from "@dockstat/utils";

const container = {
  id: "abc123",
  name: "nginx",
  image: "nginx:latest",
  status: "running",
  created: 1704067200
};

const summary = pick(container, ["id", "name", "status"]);
// { id: "abc123", name: "nginx", status: "running" }
```

#### omit

Creates an object without the specified keys.

```typescript
import { omit } from "@dockstat/utils";

const user = {
  id: 1,
  name: "John",
  password: "secret",
  email: "john@example.com"
};

const safe = omit(user, ["password"]);
// { id: 1, name: "John", email: "john@example.com" }
```

#### groupBy

Groups array items by a key or function.

```typescript
import { groupBy } from "@dockstat/utils";

const containers = [
  { name: "nginx", status: "running" },
  { name: "redis", status: "running" },
  { name: "postgres", status: "stopped" }
];

const byStatus = groupBy(containers, "status");
// {
//   running: [{ name: "nginx", ... }, { name: "redis", ... }],
//   stopped: [{ name: "postgres", ... }]
// }

// With function

const byFirstLetter = groupBy(containers, (c) => c.name[0]);
```

#### uniqueBy

Returns unique items from an array based on a key.

```typescript
import { uniqueBy } from "@dockstat/utils";

const items = [
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 1, name: "A duplicate" }
];

const unique = uniqueBy(items, "id");
// [{ id: 1, name: "A" }, { id: 2, name: "B" }]
```

#### sortBy

Sorts an array by a key or function.

```typescript
import { sortBy } from "@dockstat/utils";

const containers = [
  { name: "nginx", cpu: 45 },
  { name: "redis", cpu: 12 },
  { name: "postgres", cpu: 30 }
];

// Sort by key
const byCpu = sortBy(containers, "cpu");

// Sort descending
const byCpuDesc = sortBy(containers, "cpu", "desc");

// Sort by function
const byNameLength = sortBy(containers, (c) => c.name.length);
```

### Async Utilities

#### debounce

Creates a debounced function that delays invocation.

```typescript
import { debounce } from "@dockstat/utils";

const search = debounce((query: string) => {
  console.log("Searching:", query);
}, 300);

// Rapid calls

search("h");
search("he");
search("hel");
search("hell");
search("hello");
// Only "hello" is logged after 300ms
```

**Signature:**

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void
```

#### retry

Retries a function with exponential backoff.

```typescript
import { retry } from "@dockstat/utils";

const result = await retry(
  async () => {
    const response = await fetch("https://api.example.com/data");
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  },
  {
    attempts: 3,
    delay: 1000,
    backoff: 2 // Exponential backoff multiplier
  }
);
```

**Signature:**

```typescript
function retry<T>(
  fn: () => Promise<T>,
  options?: {
    attempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T>
```

### Container Utilities

Specialized utilities for Docker container operations.

#### parseContainerName

Parses a Docker container name into its components.

```typescript
import { parseContainerName } from "@dockstat/utils";

parseContainerName("/nginx-proxy");
// { name: "nginx-proxy", prefix: null }

parseContainerName("/project_nginx_1");
// { name: "nginx_1", prefix: "project" }
```

#### parseImageName

Parses a Docker image reference.

```typescript
import { parseImageName } from "@dockstat/utils";

parseImageName("nginx");
// { registry: null, repository: "nginx", tag: "latest" }

parseImageName("nginx:1.19");
// { registry: null, repository: "nginx", tag: "1.19" }

parseImageName("docker.io/library/nginx:alpine");
// { registry: "docker.io", repository: "library/nginx", tag: "alpine" }

parseImageName("ghcr.io/user/app:v1.0.0");
// { registry: "ghcr.io", repository: "user/app", tag: "v1.0.0" }
```

#### calculateCpuPercent

Calculates CPU percentage from Docker stats.

```typescript
import { calculateCpuPercent } from "@dockstat/utils";

const cpuPercent = calculateCpuPercent(
  previousCpuUsage,
  currentCpuUsage,
  previousSystemCpu,
  currentSystemCpu,
  numCpus
);
```

#### calculateMemoryPercent

Calculates memory percentage from Docker stats.

```typescript
import { calculateMemoryPercent } from "@dockstat/utils";

const memPercent = calculateMemoryPercent(
  memoryUsage,
  memoryLimit
);
```

## API Reference

### String Utilities

| Function | Description |
|----|----|
| `truncate(str, maxLength, suffix?)` | Truncate string with suffix |
| `capitalize(str)` | Capitalize first letter |
| `camelToKebab(str)` | Convert camelCase to kebab-case |
| `kebabToCamel(str)` | Convert kebab-case to camelCase |
| `slugify(str)` | Create URL-friendly slug |
| `escapeHtml(str)` | Escape HTML special characters |

### Formatting Utilities

| Function | Description |
|----|----|
| `formatBytes(bytes, decimals?)` | Format bytes to human-readable |
| `formatDuration(ms, options?)` | Format milliseconds to duration |
| `formatNumber(num, locale?)` | Format number with separators |
| `formatPercent(num, decimals?)` | Format as percentage |
| `formatDate(date, format?)` | Format date |
| `relativeTime(date)` | Format as relative time |

### Type Utilities

| Function | Description |
|----|----|
| `isNotNullish(value)` | Check not null/undefined |
| `isString(value)` | Type guard for string |
| `isNumber(value)` | Type guard for number |
| `isObject(value)` | Type guard for plain object |
| `isArray(value)` | Type guard for array |
| `isFunction(value)` | Type guard for function |

### Data Utilities

| Function | Description |
|----|----|
| `deepClone(obj)` | Deep clone object |
| `deepMerge(...objs)` | Deep merge objects |
| `pick(obj, keys)` | Pick specific keys |
| `omit(obj, keys)` | Omit specific keys |
| `groupBy(arr, key)` | Group array by key |
| `uniqueBy(arr, key)` | Get unique by key |
| `sortBy(arr, key, dir?)` | Sort array by key |

### Async Utilities

| Function | Description |
|----|----|
| `debounce(fn, wait)` | Debounce function calls |
| `throttle(fn, wait)` | Throttle function calls |
| `sleep(ms)` | Delay execution |
| `retry(fn, options?)` | Retry with backoff |
| `timeout(promise, ms)` | Add timeout to promise |

## Development

### Directory Structure

```
packages/utils/
├── src/
│   ├── string.ts       # String utilities
│   ├── format.ts       # Formatting utilities
│   ├── type.ts         # Type utilities
│   ├── data.ts         # Data utilities
│   ├── async.ts        # Async utilities
│   ├── container.ts    # Container utilities
│   └── index.ts        # Main export
├── package.json
└── tsconfig.json
```

### Building

```bash
cd packages/utils

bun run build
```

### Testing

```bash
bun run test
```

### Type Checking

```bash
bun run check-types
```

## Related Packages

* `@dockstat/typings` - Type definitions
* `@dockstat/logger` - Logging utilities
* `@dockstat/ui` - UI components using these utilities
* `@dockstat/docker-client` - Docker client using async utilities

## License

Part of the DockStat project - See main repository for license information.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)