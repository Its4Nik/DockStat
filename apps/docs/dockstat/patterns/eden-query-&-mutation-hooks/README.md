---
id: 0ab3a4e6-12ae-417a-b6b8-524ae3f27590
title: Eden Query & Mutation Hooks
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: a81b5d89-a300-47ac-8ffa-a3b851645978
updatedAt: 2026-01-11T17:54:34.746Z
urlId: xeYvzrtJd6
---

> Type-safe React Query wrappers for ElysiaJS Eden Treaty.


---

## Contents


1. `useEdenQuery` – GET routes
2. `useEdenMutation` – POST/PUT/PATCH/DELETE routes


---

## 1. useEdenQuery

### Signature

```typescript
function useEdenQuery<TRoute>(opts: UseEdenQueryOptions<TRoute>): UseQueryResult<EdenData<TRoute>, Error>
```

### Options

| Key | Type | Default | Description |
|----|----|----|----|
| `route` | `TRoute` | — | Eden route function |
| `queryKey` | `readonly unknown[]` | — | React Query cache key |
| `enabled` | `boolean` | `true` | Enable/disable the query |
| `staleTime` | `number` | `0` | Milliseconds until stale |
| `refetchInterval` | `number \| false` | `false` | Auto-refetch interval |
| `refetchOnWindowFocus` | `boolean` | `true` | Refetch on window focus |

### Usage

```typescript
// No params
const { data, isLoading } = useEdenQuery({
  route: api.api.v2.repositories.all.get,
  queryKey: ["repos"],
})

// With params (already applied)
const { data } = useEdenQuery({
  route: api.api.v2.repositories({ id }).get,
  queryKey: ["repo", id],
})
```


---

## 2. useEdenMutation

### Signature

```typescript
function useEdenMutation<TRoute>(opts: UseEdenMutationOptions<TRoute>): UseMutationResult<EdenData<TRoute>, Error, EdenInput<TRoute>>
```

### Options

| Key | Type | Description |
|----|----|----|
| `route` | `TRoute` | Eden-route function |
| `mutationKey` | `readonly string[]` | Mutation cache key |
| `invalidateQueries` | `readonly string[][]` | Keys to invalidate on success |
| `toast` | `ToasTConfig`   | Toast message headers |

### ToastConfig

```typescript
type ToastConfig<TData, TInput> = {
  successTitle: string | ((input: TInput, data: TData) => string)
  errorTitle: string | ((input: TInput, error: Error) => string)
}
```

### Usage

```typescript
// Body required
const install = useEdenMutation({
  route: api.api.v2.plugins.install.post,
  mutationKey: ["install"],
})
install.mutate({ body: { pluginId } })

// Body optional (unknown)
const del = useEdenMutation({
  route: api.api.v2.repositories({ id }).delete,
  mutationKey: ["del"],
})
del.mutate() // no args needed

// With toast
const add = useEdenMutation({
  route: api.api.v2.repositories.add.post,
  mutationKey: ["add"],
  invalidateQueries: [["repos"]],
  toast: {
    successTitle: (d) => `Added ${d.name}`,
    errorTitle: (i, e) => `Failed: ${e.message}`,
  },
})
```


---

## Type Inference

All hooks extract types directly from Eden:

```typescript
// data is fully typed
const { data } = useEdenQuery({
  route: api.api.v2.repositories.all.get,
  queryKey: ["repos"],
})

// input is fully typed
const mutation = useEdenMutation({
  route: api.api.v2.repositories.add.post,
  mutationKey: ["add"],
})
mutation.mutate({ body: { name: "repo", url: "..." } }) // type-checked
```

Routes with `body?: unknown` are treated as `void`, so `.mutate()` can be called without arguments.