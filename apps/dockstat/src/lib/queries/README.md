---
id: da3758e1-2d46-4dd5-85c5-eb9d19ee2054
title: "Frontend: queries"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: a81b5d89-a300-47ac-8ffa-a3b851645978
updatedAt: 2026-01-01T15:02:36.975Z
urlId: wadWIa69wa
---

## `lib/queries/` (TanStack Query)

This folder contains all **client-side data fetching functions** ("query functions") used by **TanStack React Query** hooks (`useQuery`, `useInfiniteQuery`, `useMutation`, etc.).\nEach function is responsible for calling our typed API client and returning **data only** (or throwing on failure), so React Query can handle caching, retries, and loading/error states consistently.

### Pattern

* **One exported async function per endpoint/use-case**
* Call the API client (`api...`)
* If the API returns an error, **throw** (React Query will put it in `error`)
* Otherwise **return** `**data**`
* Keep these functions **framework-agnostic** (no React code inside)

### Example

```tsx
import { api } from "./api"

export async function fetchStatus({ signal }: QueryFunctionContext) {
  const { data, error } = await api.api.v2.status.get({ fetch: { signal } })

  if (error) {
    throw new Error(String(error.value))
  }

  return data
}
```

### Usage (in components)

```tsx
import { useQuery } from "@tanstack/react-query"
import { fetchStatus } from "@/lib/queries/fetchStatus"

export function Status() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Something went wrong</div>

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### Naming + organization

* `fetchX` for queries (GET/read)
* `createX`, `updateX`, `deleteX` for mutations (write)
* Prefer grouping by domain, e.g.:
  * `queries/status.ts`
  * `queries/users.ts`
  * `queries/projects.ts`

### Rules

* Always `throw` on API errors (don't return `{ error }`)
* Return the smallest useful `data` shape
* No UI logic here (no toasts, no redirects)
* Keep `queryKey`s in the component (or optionally export helpers if you standardize keys later)