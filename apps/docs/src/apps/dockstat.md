# The DockStat dashboard

The `@dockstat/frontend` app is the user-facing dashboard. It is a React
Router v7 application that renders server-side, hydrates on the client, and
talks to the API through the Eden Treaty client.

## What lives in `apps/dockstat`

```
src/
├── components/            # UI building blocks grouped by domain
├── contexts/              # Cross-cutting React contexts (theme, heading, etc.)
├── hooks/                 # Mutations, queries, plugins
├── layout/                # Layout components and provider glue
├── lib/                   # websocketEffects, api, toast, protectedRoute
├── pages/                 # Top-level route components (clients, dashboard, etc.)
├── providers/             # EdenProvider, themeProvider, queryClient
├── router.tsx             # Router source of truth
└── main.tsx               # Entry point
```

## Routing and rendering

`apps/dockstat/src/router.tsx` declares every route. The router runs on the
server during SSR and falls back to client hydration. Plugin-contributed
frontend routes are merged in at boot via `usePluginRoutes()` from
`hooks/plugins`.

```typescript
// apps/dockstat/src/router.tsx (excerpt)
const dockstatRouter = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { path: "/", Component: Dashboard },
      { path: "clients", Component: ClientsIndex },
      { path: "clients/configure", Component: ClientsConfigure },
      { path: "extensions", Component: ExtensionsIndex },
      { path: "extensions/plugins", Component: PluginsPage },
      { path: "settings", Component: Settings },
      { path: "dataflow", Component: DataflowPage },
      // …loaded by usePluginRoutes() at boot
    ],
  },
])
```

## Data fetching

DockStat follows the typed Eden client pattern documented in
`AGENTS.md` at the repository root.
There are two moving parts:

- `apps/dockstat/src/lib/api.ts` builds a typed `treaty` instance from
  the API's `TreatyType`. The trade name is `api`; every entry exposes a
  typed route reference (for example `api.certificates.get`).
- `apps/dockstat/src/providers/edenClient.tsx` instantiates one
  `eden.Client(toast)` and feeds it to `<eden.EdenProvider client={...}>`
  so the rest of the tree can pull it through `useEdenClient()`.

```tsx
// apps/dockstat/src/providers/edenClient.tsx
import { eden } from "@dockstat/utils/react"
import { toast } from "@/lib/toast"

const client = new eden.Client(toast)

export function EdenClientProvider({ children }: { children: React.ReactNode }) {
  return <eden.EdenProvider client={client}>{children}</eden.EdenProvider>
}
```

Queries live under `apps/dockstat/src/hooks/queries`. Each query hook calls
`useEdenClient()` and invokes `eden.query({ route, queryKey, query, ... })`
against the typed `api` route reference.

```typescript
// apps/dockstat/src/hooks/queries/certificates.ts (abridged)
export const useCertificatesQuery = (type?: CertificateType) => {
  const eden = useEdenClient()
  const { data, isLoading, refetch } = eden.query({
    queryKey: ["fetchCertificates", type],
    route: api.certificates.get,
    ...(type ? { query: { type } } : {}),
  })
  const list = (data as CertificateListResponse | undefined)?.data ?? []
  return { certificates: list, isLoading, refetch }
}
```

Mutations live under `apps/dockstat/src/hooks/mutations`. They call
`eden.mutate({ route, mutationKey, invalidateQueries, toast })` for static
routes and `eden.mutateRoute({ routeBuilder, mutationKey, ... })` for routes
that take parameters at call time. The `toast` config wires success and
error copy to the in-app toaster; `invalidateQueries` triggers automatic
cache refresh on success.

```typescript
// apps/dockstat/src/hooks/mutations/certificates.ts (abridged)
const eden = useEdenClient()

const generateCertificateMutation = eden.mutate({
  invalidateQueries: [["fetchCertificates"]],
  mutationKey: ["generateCertificate"],
  route: api.certificates.generate.post,
  toast: {
    errorTitle: () => "Failed to generate certificate",
    successTitle: (input: GenerateCertificateInput) => `Generated "${input.title}"`,
  },
})

const deleteCertificateMutation = eden.mutateRoute({
  invalidateQueries: [["fetchCertificates"]],
  mutationKey: ["deleteCertificate"],
  routeBuilder: ({ id }: { id: string }) => api.certificates({ id }).delete,
  toast: { errorTitle: () => "Failed to delete certificate" },
})
```

> [!TIP]
> Always declare `invalidateQueries` on every `eden.mutate` / `eden.mutateRoute`
> call, otherwise the UI shows stale results until the next refetch. Each
> inner array is a TanStack `queryKey`, so list every key whose data could
> be affected by the change.

> [!NOTE]
> `eden.mutate` and `eden.mutateRoute` return a `MutationResult` whose
> `mutateAsync(input)` awaits the typed response and `mutate(input)` fires
> fire-and-forget. Call `mutateAsync` when you need the response body; call
> `mutate` when you only care about side effects.

## Real-time updates

The dashboard subscribes to the shared WebSocket at `apps/dockstat/src/lib/websocketEffects`.
Each effect owns a topic subscription and exposes a typed payload. The
components consume those effects through `hooks/queries/websocket-topics.ts`,
which lets each page decide which topics to mount dynamically.

Typical flow:

1. A dashboard widget declares a `websocket-source` data pipe.
2. The widget registry asks the WS provider to subscribe to the topic
   (for example `metrics/containers`).
3. The API evaluates the pipe when it receives data for that topic and emits
   a `data-update` payload on `widgets/dashboard/<id>`.
4. The widget consumes the message and updates its component state.

## State management

- TanStack Query powers server state.
- React context providers in `apps/dockstat/src/providers` cover theme, page
  heading, sidebar UI, and additional settings.
- Local UI state stays in the component; you must not lift it into context
  unless multiple components need the same value.

## Theming

Themes are managed by `@dockstat/theme-handler`. The dashboard wires the
context in `providers/theme.tsx` and renders theme-aware components from
`@dockstat/ui`. Color tokens are exposed as CSS variables via
`applyThemeToDocument`. The default themes (light, dark, OLED, ultra-dark)
ship with the package; users can edit or create new ones from
**Settings → General**.

## Dashboard widgets

Dashboard pages are composed of widgets rendered by
[`@widgets/client`](../packages/widgets.md). Widgets consume the data-pipe
engine and show gauges, sparklines, heatmaps, and richer fragments via the
`@dockstat/ui` library. The full widget reference lives in
`packages/widgets`.

## Plugin contribution to navigation

When a plugin declares a `frontend` config (via
[`@dockstat/plugin-builder`](../packages/plugins.md)), the handler in
`hooks/plugins/usePluginRoutes.ts` introspects it at boot and appends routes
to the dashboard router. Each plugin route is a JSX template rendered by
[`@dockstat/template-renderer`](../packages/template-renderer.md). The dashboard
does not require a recompile to pick up new plugin routes.

## Local development

```bash
# from repo root
bun install
bun run dev --filter=@dockstat/frontend

# (optional) start the API and a docknode for full-stack development
bun run dev:dockstat:no-docker
```

Use `bun run dev:dockstat/api` if you only want the API, or
`bun run dev:minimal` for the API + frontend. The dev environment expects a
running Docker daemon unless you flip the `no-docker` flag.

## Next steps

- See [packages/auth.md](../packages/auth.md) for the React auth provider and
  hooks.
- See [packages/sqlite-wrapper.md](../packages/sqlite-wrapper.md) if you need
  to back a new screen with a database table.
- See [`apps/docs/resources/deployment.md`](../resources/deployment.md) for
  the frontend env vars (`VITE_API_URL`, `FRONTEND_URL`, etc.).
