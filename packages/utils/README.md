# @dockstat/utils

A collection of shared utility functions used across DockStat packages and applications. Provides common helpers for string manipulation, data formatting, type checking, and other frequently needed operations.

## Overview

`@dockstat/utils` centralizes common utility functions to ensure consistency and reduce code duplication across the DockStat monorepo. These utilities are designed to be lightweight, well-tested, and tree-shakeable.

## Installation

```bash
bun add @dockstat/utils
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

// Custom decimal places
formatBytes(1536, 0);             // "2 KB"
formatBytes(1536, 3);             // "1.500 KB"
```

#### formatDuration
Formats milliseconds into a human-readable duration.

```typescript
import { formatDuration } from "@dockstat/utils";

formatDuration(1000);             // "1s"
formatDuration(60000);            // "1m 0s"
formatDuration(3600000);          // "1h 0m"
formatDuration(86400000);         // "1d 0h 0m"

// Compact format
formatDuration(90061000, { compact: true }); // "1d 1h"
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
```

#### isNumber
Type guard for numbers.

```typescript
import { isNumber } from "@dockstat/utils";

isNumber(123);                    // true
isNumber("123");                  // false
isNumber(NaN);                    // false
```

#### isObject
Type guard for plain objects.

```typescript
import { isObject } from "@dockstat/utils";

isObject({});                     // true
isObject({ a: 1 });               // true
isObject([]);                     // false
isObject(null);                   // false
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
isFunction({});                   // false
```

### Data Utilities

#### deepClone
Deep clones an object or array.

```typescript
import { deepClone } from "@dockstat/utils";

const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original);
```

#### deepMerge
Deep merges multiple objects.

```typescript
import { deepMerge } from "@dockstat/utils";

const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };
const merged = deepMerge(obj1, obj2);
// { a: 1, b: { c: 2, d: 3 }, e: 4 }
```

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
```

### Async Utilities

#### debounce
Creates a debounced function that delays invocation.

```typescript
import { debounce } from "@dockstat/utils";

const search = debounce((query: string) => {
  console.log("Searching:", query);
}, 300);

search("hello"); // Only executed after 300ms of no more calls
```

#### throttle
Creates a throttled function that only invokes at most once per wait period.

```typescript
import { throttle } from "@dockstat/utils";

const handleScroll = throttle(() => {
  console.log("Scrolling...");
}, 100);

window.addEventListener("scroll", handleScroll);
```

#### sleep
Delays execution for a specified amount of time.

```typescript
import { sleep } from "@dockstat/utils";

await sleep(1000); // Wait 1 second
console.log("After delay");
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
    backoff: 2
  }
);
```

#### timeout
Adds a timeout to a promise.

```typescript
import { timeout } from "@dockstat/utils";

const result = await timeout(
  fetch("https://api.example.com/data"),
  5000 // 5 second timeout
);
```

### Container Utilities

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
|----------|-------------|
| `truncate(str, maxLength, suffix?)` | Truncate string with suffix |
| `capitalize(str)` | Capitalize first letter |
| `camelToKebab(str)` | Convert camelCase to kebab-case |
| `kebabToCamel(str)` | Convert kebab-case to camelCase |
| `slugify(str)` | Create URL-friendly slug |
| `escapeHtml(str)` | Escape HTML special characters |

### Formatting Utilities

| Function | Description |
|----------|-------------|
| `formatBytes(bytes, decimals?)` | Format bytes to human-readable |
| `formatDuration(ms, options?)` | Format milliseconds to duration |
| `formatNumber(num, locale?)` | Format number with separators |
| `formatPercent(num, decimals?)` | Format as percentage |
| `formatDate(date, format?)` | Format date |
| `relativeTime(date)` | Format as relative time |

### Type Utilities

| Function | Description |
|----------|-------------|
| `isNotNullish(value)` | Check not null/undefined |
| `isString(value)` | Type guard for string |
| `isNumber(value)` | Type guard for number |
| `isObject(value)` | Type guard for plain object |
| `isArray(value)` | Type guard for array |
| `isFunction(value)` | Type guard for function |

### Data Utilities

| Function | Description |
|----------|-------------|
| `deepClone(obj)` | Deep clone object |
| `deepMerge(...objs)` | Deep merge objects |
| `pick(obj, keys)` | Pick specific keys |
| `omit(obj, keys)` | Omit specific keys |
| `groupBy(arr, key)` | Group array by key |
| `uniqueBy(arr, key)` | Get unique by key |
| `sortBy(arr, key, dir?)` | Sort array by key |

### Async Utilities

| Function | Description |
|----------|-------------|
| `debounce(fn, wait)` | Debounce function calls |
| `throttle(fn, wait)` | Throttle function calls |
| `sleep(ms)` | Delay execution |
| `retry(fn, options?)` | Retry with backoff |
| `timeout(promise, ms)` | Add timeout to promise |

### Container Utilities

| Function | Description |
|----------|-------------|
| `parseContainerName(name)` | Parse Docker container name |
| `parseImageName(image)` | Parse Docker image reference |
| `calculateCpuPercent(...)` | Calculate CPU percentage |
| `calculateMemoryPercent(...)` | Calculate memory percentage |

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
│   ├── http/           # HTTP utilities
│   ├── worker/         # Worker utilities
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
