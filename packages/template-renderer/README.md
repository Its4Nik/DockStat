---
id: 453740d4-b426-423d-98fc-b36f6dff7644
title: "@dockstat/template-renderer"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2025-12-23T12:50:44.974Z
urlId: 5qbatLB5V0
---

> A library for defining frontend pages using JSON/YAML templates composed of widgets from `@dockstat/ui`. Provides full type safety for template definitions and seamless integration with the DockStat plugin system.

## Features

* **Full Type Safety**: Template definitions are fully typed with TypeScript
* **JSON/YAML Support**: Parse templates from JSON or YAML formats
* **Widget Registry**: Maps template widget types to `@dockstat/ui` components
* **Data Binding**: Bind widget props to state and external data
* **Action System**: Handle user interactions with declarative actions
* **Template Fragments**: Create reusable template components
* **Builder API**: Fluent, type-safe API for programmatic template creation
* **Validation**: Comprehensive template validation with detailed error reporting

## Quick Start

### Using JSON/YAML Templates

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

### Rendering a Template

```tsx

import { TemplateRenderer, parseTemplate } from "@dockstat/template-renderer"
import { useState } from "react"

function MyPage() {
  const templateYaml = `...` // Your YAML template
  const result = parseTemplate(templateYaml, "yaml")

  if (!result.success) {
    return <div>Error: {result.validation.errors?.[0]?.message}</div>
  }

  const [state, setState] = useState({})

  return (
    <TemplateRenderer
      template={result.data}
      state={state}
      onStateChange={(updates) => setState((prev) => ({ ...prev, ...updates }))}
      onNavigate={(path) => console.log("Navigate to:", path)}
    />
  )
}
```

### Using the Builder API

```typescript

import {
  template,
  widgets,
  actions,
  layouts,
  TemplateRenderer,
} from "@dockstat/template-renderer"

// Build a template programmatically with full type safety

const myTemplate = template("my-page", "My Page")
  .description("A sample page")
  .layout(layouts.column({ gap: 16 }))
  .state({
    initial: { count: 0 },
  })
  .actions(
    actions.setState("increment", { count: 1 }),
    actions.navigate("go-home", "/")
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
              .build()
          )
          .build()
      )
      .build()
  )
  .build()
```

### Using Hooks

```tsx

import { useTemplate, TemplateRenderer } from "@dockstat/template-renderer"

function MyPage({ template }) {
  const {
    state,
    setState,
    data,
    setData,
    triggerAction,
    registerHandler,
  } = useTemplate(template, {
    initialState: { loaded: false },
    navigate: (path) => router.push(path),
  })

  // Register custom action handlers
  useEffect(() => {
    registerHandler("fetchData", async () => {
      const result = await fetch("/api/data")
      setData({ items: await result.json() })
    })
  }, [])

  return (
    <TemplateRenderer
      template={template}
      state={state}
      data={data}
      onStateChange={setState}
      onAction={triggerAction}
    />
  )
}
```

## Available Widgets

All widgets from `@dockstat/ui` are available:

| Widget Type | Description | Supports Children |
|----|----|----|
| `badge` | Status badge | No |
| `button` | Clickable button | No |
| `card` | Card container | Yes |
| `cardHeader` | Card header section | Yes |
| `cardBody` | Card body section | Yes |
| `cardFooter` | Card footer section | Yes |
| `divider` | Visual separator | No |
| `input` | Text input field | No |
| `checkbox` | Checkbox input | No |
| `checkboxGroup` | Group of checkboxes | No |
| `toggle` | Toggle switch | No |
| `hoverBubble` | Tooltip on hover | Yes |
| `link` | Hyperlink with optional icon | No |
| `modal` | Modal dialog | Yes |
| `slider` | Range slider | No |
| `slides` | Tabbed content | Yes |
| `table` | Data table | No |
| `text` | Text content | No |
| `container` | Layout container | Yes |

## Data Binding

Bind widget props to state or data using the `bindings` property:

```yaml

widgets:
  - type: text
    props:
      text: "" # Will be overwritten by binding
    bindings:
      text: "state.username"

  - type: table
    props:
      columns:
        - key: name
          title: Name
        - key: value
          title: Value
    bindings:
      data: "data.items"
```

## Conditional Rendering

Use the `condition` property to conditionally render widgets:

```yaml

widgets:
  - type: badge
    props:
      text: "Admin"
      variant: warning
    condition: "state.isAdmin"

  - type: text
    props:
      text: "Loading..."
    condition: "state.isLoading === true"
```

## Loop Rendering

Render widgets for each item in an array:

```yaml

widgets:
  - type: card
    props:
      variant: outlined
    loop:
      items: "data.users"
      itemVar: "user"
      indexVar: "i"
      keyExpr: "user.id"
    children:
      - type: text
        props:
          text: ""
        bindings:
          text: "user.name"
```

## Plugin Integration

Use templates in your DockStat plugins:

```typescript

import type { PluginFrontendConfig } from "@dockstat/template-renderer"

const frontendConfig: PluginFrontendConfig = {
  routes: [
    {
      path: "/my-plugin",
      template: myTemplate,
      meta: {
        title: "My Plugin",
        icon: "settings",
        showInNav: true,
      },
    },
  ],
}
```

## API Reference

### Parser Functions

* `parseTemplate(content, format?)` - Parse a template string
* `parseFragment(content, format?)` - Parse a fragment string
* `parseTemplateFile(path)` - Parse a template from file
* `validateTemplate(template)` - Validate a template object
* `serializeTemplateToJSON(template)` - Convert to JSON
* `serializeTemplateToYAML(template)` - Convert to YAML

### Components

* `TemplateRenderer` - Main rendering component
* `useTemplateContext()` - Access render context in custom widgets

### Hooks

* `useTemplate(template, options)` - Complete template management
* `useTemplateState(template, initialOverrides)` - State management only
* `useTemplateActions(template, setState, navigate)` - Action handling only

### Builder

* `template(id, name)` - Create a TemplateBuilder
* `fragment(id, name)` - Create a FragmentBuilder
* `widget(type, props)` - Create a WidgetBuilder
* `widgets.*` - Shorthand widget creators
* `actions.*` - Action config helpers
* `layouts.*` - Layout preset helpers

## License

MIT