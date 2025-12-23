> This page documents the `@dockstat/template-renderer` package: a type-safe template format, parser, builder and renderer used by DockStat plugins to define frontend pages as JSON/YAML templates composed of `@dockstat/ui` widgets.

Quick links

- Source / package manifest: `packages/template-renderer/package.json`
- Canonical README with usage examples: see the package README included below.

```packages/template-renderer/README.md#L1-200
# @dockstat/template-renderer

A library for defining frontend pages using JSON/YAML templates composed of widgets from `@dockstat/ui`. Provides full type safety for template definitions and seamless integration with the DockStat plugin system.

## Features

- **Full Type Safety**: Template definitions are fully typed with TypeScript
- **JSON/YAML Support**: Parse templates from JSON or YAML formats
- **Widget Registry**: Maps template widget types to `@dockstat/ui` components
- **Data Binding**: Bind widget props to state and external data
- **Action System**: Handle user interactions with declarative actions
- **Template Fragments**: Create reusable template components
- **Builder API**: Fluent, type-safe API for programmatic template creation
- **Validation**: Comprehensive template validation with detailed error reporting

...
```

Why this package exists

- Provide a structured, serializable way for plugins to ship UI pages (templates + fragments) that are independent of the runtime (React) until they are rendered.
- Allow server-side tooling (plugin manager and the API) to inspect templates, execute server-run loaders to gather initial data, and hand the combined package (template + fragments + initialData) to the frontend for rendering.
- Offer a programmatic builder and hooks for plugin authors who prefer TypeScript-first template creation.

Core concepts

- Template: Top-level definition of a page (id, name, layout, state, actions, widgets).
- Fragment: Reusable template chunk that can be referenced from templates.
- Widget: Declarative node describing a UI component (type maps to an actual `@dockstat/ui` component via the registry).
- Loader: A plugin-provided function for fetching initial data/state for a route.
- Action: A plugin-provided function used by interactive widgets to mutate state, navigate, or call services.

Install / package info

- The package lives in the monorepo at `packages/template-renderer`.
- Check the manifest for exports and scripts: `packages/template-renderer/package.json`.

Public exports (high level)

- Parser / serializer: `parseTemplate`, `parseFragment`, `serializeTemplateToJSON`, `serializeTemplateToYAML`
- Renderer: `TemplateRenderer`, `TemplateRendererProvider` (rendering components)
- Hooks: `useTemplate`, `useTemplateState`, `useTemplateActions`
- Builder: `template()`, `fragment()`, `widgets.*`, `actions.*`, `layouts.*`
- Registry: `registerWidget` and a default registry that maps template widget types to `@dockstat/ui` components

Quick start examples

- Parse and render a YAML template (client-side)

```yaml
# my-page.yaml

id: my-dashboard

name: My Dashboard

layout:
  type: flex
  direction: column
  gap: 16

state:
  initial:
    counter: 0

actions:
  - id: increment
    type: setState
    stateUpdates:
      counter: 1

widgets:
  - type: card
    props:
      variant: default
    children:
      - type: cardHeader
        props:
          text: Welcome
      - type: cardBody
        props: {}
        children:
          - type: text
            props:
              text: Hello from template!
          - type: button
            props:
              text: Click me
              variant: primary
              action: increment
```

- Rendering a parsed template with `TemplateRenderer` (React)

```jsx
import { TemplateRenderer, parseTemplate } from "@dockstat/template-renderer";
import { useState } from "react";

function MyPage() {
  const templateYaml = `...`; // Your YAML template
  const result = parseTemplate(templateYaml, "yaml");

  if (!result.success) {
    return <div>Error: {result.validation.errors?.[0]?.message}</div>;
  }

  const [state, setState] = useState({});

  return (
    <TemplateRenderer
      template={result.data}
      state={state}
      onStateChange={(updates) => setState((prev) => ({ ...prev, ...updates }))}
      onNavigate={(path) => console.log("Navigate to:", path)}
    />
  );
}
```

- Builder API (programmatic construction)

```typescript
import {
  template,
  widgets,
  actions,
  layouts,
  TemplateRenderer,
} from "@dockstat/template-renderer";

// Build a template programmatically with full type safety

const myTemplate = template("my-page", "My Page")
  .description("A sample page")
  .layout(layouts.column({ gap: 16 }))
  .state({
    initial: { count: 0 },
  })
  .actions(
    actions.setState("increment", { count: 1 }),
    actions.navigate("go-home", "/"),
  )
  .widgets(
    widgets
      .card({ variant: "default" })
      .children(
        widgets.cardHeader({ text: "Counter" }).build(),
        widgets
          .cardBody({})
          .children(
            widgets.text({ text: "Current count:" }).build(),
            widgets
              .button({ text: "Increment", variant: "primary" })
              .actions({ onClick: "increment" })
              .build(),
          )
          .build(),
      )
      .build(),
  )
  .build();
```

API surface (summary)

- Parsers:
  - `parseTemplate(content: string, format?: 'json' | 'yaml')` — returns `{ success, data?, validation? }`
  - `parseFragment(content: string, format?: 'json' | 'yaml')`
  - `parseTemplateFile(path: string)`
- Validation:
  - `validateTemplate(template)` — returns detailed validation errors when invalid
- Serializers:
  - `serializeTemplateToJSON(template)`
  - `serializeTemplateToYAML(template)`
- Renderer:
  - `TemplateRenderer` — React component that renders a template tree given `template`, `state`, `data`, `onStateChange`, `onAction`, `onNavigate`
- Hooks:
  - `useTemplate(template, options)` — full lifecycle hook for template-managed state/data/actions
  - `useTemplateState(template, initialOverrides)`
  - `useTemplateActions(template, setState, navigate)`
- Builder helpers:
  - `template(id, name)` — start a typed TemplateBuilder
  - `fragment(id, name)` — fragment builder
  - `widgets.*` — typed widget builders for common widget types
  - `actions.*`, `layouts.*` — helpers for action and layout definitions

Integration with plugin system and API

- The DockStat server exposes plugin frontend helpers that use this package's template format to display and execute plugin pages.
- The canonical API routes that surface templates, fragments, loaders and actions are implemented in:

```typescript
import Elysia, { t } from "elysia"
import PluginHandler from "../../plugins"

const DockStatAPIFrontendPluginRoutes = new Elysia({
  detail: { tags: ["Plugin", "Frontend"] },
  prefix: "/frontend",
})
...
export default DockStatAPIFrontendPluginRoutes
```

- Those endpoints provide:
  - Route listing, grouped routes, navigation items and frontend summary
  - Retrieval of `template` + `fragments` for a plugin route
  - Execution of route `loaders` (collect initialData) and `actions` (triggered by UI)
- Practical flow for rendering a plugin route in your app:
  1. Query `/api/v2/plugins/frontend/navigation` (or `/routes`) to discover plugin routes and `pluginId`.
  2. POST `/api/v2/plugins/frontend/:pluginId/template` with `{ path: "/..." }` to get `template`, `fragments`, `loaders`, `actions` and `initialData`.
  3. Use `TemplateRenderer` and/or `useTemplate` with the returned `template` and `initialData` to render the page client-side.

Types and TypeScript support

- The package is fully typed and exposes type definitions under `./types` in its exports.
- Use the builder API for compile-time validation of templates if you author templates in TypeScript.
- When importing from the package, prefer the explicit entrypoints for clarity (`./parser`, `./renderer`, `./builder` as exported in `package.json`).

Examples & snippets

- YAML template example and builder examples are included in the package README. See the README for more complete snippets and the hooks examples.

```packages/template-renderer/README.md#L1-200
// See README for example usage, hooks and builder samples
```

Best practices

- Prefer parsing and validating templates at plugin installation time (server-side) so the server can catch bad templates before activation.
- When rendering on the client:
  - Use `useTemplate` to manage state/data lifecycle and wire navigation to your router.
  - Register any custom widget renderers (if plugin ships custom widgets) into the registry before rendering.
- Keep loaders idempotent and side-effect free when possible — loaders are executed by the server (and from the API) to gather initial data.

Troubleshooting

- Validation errors: `parseTemplate` returns a `validation` object with errors pointing to specific template nodes. Use these details to correct the template.
- Missing widget mapping: If the template references a widget type not present in the registry, the renderer will show a placeholder or error; register the widget component or map it to an existing widget type.
- Loader or action execution errors: These are surfaced by the plugin handler when the API executes plugin code. Check plugin logs and ensure the plugin's loader/action handlers are exported and callable.

Related docs

- Package README (source & expanded examples): `packages/template-renderer/README.md`
- Plugin frontend API (how templates are served by the API): `api-reference/frontend-plugins.md`
- UI component library: `packages/@dockstat-ui` (widgets referenced by templates)
- \
