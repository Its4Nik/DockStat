# `@dockstat/template-renderer`

`@dockstat/template-renderer` is the React template engine that turns
plugin-declared UI trees into rendered DOM. Plugins ship a declarative JSON
tree from `@dockstat/plugin-builder`, and the renderer walks it to produce
React fragments that mount inside the dashboard router.

## What lives in `packages/template-renderer`

```
src/
├── builder/             # JSON tree builder helpers
├── hooks/               # useTemplate, exports registry
├── parser/              # Tree parser, schema validation
├── registry/            # Reactive component registry
├── renderer/            # Template renderer components
├── types/               # Tree, widget, template types
└── validation/          # Tree validator
```

## Concepts

A **template** is an immutable JSON object that describes a UI subtree. The
renderer resolves each template node against the registry (a map from
`type` strings to React components), runs the parser, applies any registered
hooks, and yields a React element.

| Element | Purpose |
|---------|---------|
| `template` | The full JSON tree (or a sub-tree) the renderer consumes |
| `node.type` | Registry key the renderer looks up |
| `node.props` | Props forwarded to the resolved component |
| `node.children` | Nested templates (recursively rendered) |
| `hooks` | State + lifecycle helpers keyed by template id |

## Rendering a template

```tsx
import { TemplateRenderer } from "@dockstat/template-renderer"

export function PluginPage({ template }: { template: TemplateNode }) {
  return <TemplateRenderer node={template} registry={registry} />
}
```

`TemplateRenderer` walks the tree top-down, logs warnings on unknown node
types, and recursively renders children. The renderer never throws on
missing components — it falls back to a visible placeholder so plugin authors
notice mistakes early.

## Type system

```typescript
import type {
  TemplateNode,
  TemplateRegistry,
  TemplateContext,
  WidgetSpec,
} from "@dockstat/template-renderer"
```

`TemplateNode` is a discriminated union on `type`. The registry type
captures the props contract that every resolved component must accept.

The validation module exposes `validateTemplate(tree, registry)` which
performs a structural pass before render time. Failing validation emits
typed errors that the dashboard toast surfaces.

## Authoring templates

Plugins typically generate templates through
[`@dockstat/plugin-builder`](../packages/plugins.md) rather than hand-rolling
JSON. The builder produces a serialized template at install time; the
renderer consumes it on the frontend.

```typescript
import { createFrontendConfig, createFrontendRoute } from "@dockstat/plugin-builder"

const config = createFrontendConfig({
  routes: [
    createFrontendRoute({
      path: "/my-plugin/widgets",
      template: {
        type: "container",
        children: [
          { type: "heading", props: { text: "My widget" } },
          { type: "widget-frame", props: { id: "gauge-1" } },
        ],
      },
    }),
  ],
})
```

## Hooks

The renderer ships two React-friendly hooks:

| Hook | Returns |
|------|---------|
| `useTemplate(id)` | The active template node for the given id, refreshed on route changes |
| `useTemplateRegistry()` | The live component registry (handy when adding plugin components at runtime) |

Combined, they give plugins first-class integration with the React Router
tree without forcing a rebuild of the dashboard.

## Next steps

- See [packages/plugins.md](./plugins.md) for the full plugin authoring
  guide and the source of these JSON templates.
- See [apps/dockstat.md](../apps/dockstat.md) for the dashboard side that
  mounts each plugin's routes at boot.
