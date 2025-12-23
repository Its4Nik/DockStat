# Frontend Loaders and Actions

This document describes how to use the frontend loaders and actions system in DockStat plugins. This system allows plugin developers to define data loading and user interactions directly in their plugin configuration.

## Overview

The frontend loaders and actions system provides:

1. **Loaders** - Fetch data from plugin API routes when a page loads
2. **Actions** - Execute operations in response to user interactions
3. **State Management** - Automatically update template state with loaded data
4. **Polling** - Periodically refresh data
5. **Caching** - Cache loader results to reduce API calls

## Loaders

Loaders are used to fetch data when a plugin page is loaded. They call plugin API routes and store the results in the template's state or data.

### Basic Loader

```typescript
{
  path: "/dashboard",
  loaders: [
    {
      id: "dashboardData",        // Unique identifier
      apiRoute: "/dashboard",      // Plugin API route to call
      method: "GET",               // HTTP method (default: GET)
      dataKey: "dashboard",        // Key to store result in template data
    }
  ],
  template: { /* ... */ }
}
```

### Loader with State

Store loaded data directly in template state:

```typescript
{
  id: "userSettings",
  apiRoute: "/settings",
  stateKey: "settings",  // Stored in state.settings
}
```

### Loader with POST Body

```typescript
{
  id: "filteredMetrics",
  apiRoute: "/metrics/filter",
  method: "POST",
  body: {
    type: "HOST",
    limit: 100,
  },
  dataKey: "metrics",
}
```

### Polling Loader

Automatically refresh data at intervals:

```typescript
{
  id: "liveMetrics",
  apiRoute: "/metrics/latest",
  dataKey: "liveData",
  polling: {
    interval: 5000,           // Poll every 5 seconds
    enabled: true,            // Can also be a state binding: "state.autoRefresh"
  },
}
```

### Cached Loader

Cache results to reduce API calls:

```typescript
{
  id: "staticConfig",
  apiRoute: "/config",
  dataKey: "config",
  cache: {
    ttl: 60000,               // Cache for 60 seconds
    key: "config-cache",      // Optional custom cache key
  },
}
```

## Actions

Actions define operations that can be triggered from template widgets (buttons, etc.).

### Action Types

#### `setState` - Update Template State

```typescript
{
  id: "toggleView",
  type: "setState",
  stateUpdates: {
    viewMode: "grid",
    showFilters: true,
  },
}
```

#### `navigate` - Navigate to Another Page

```typescript
{
  id: "goToSettings",
  type: "navigate",
  path: "./settings",        // Relative path within plugin
}
```

#### `api` - Call Plugin API Route

```typescript
{
  id: "deleteItem",
  type: "api",
  apiRoute: "/items/delete",
  method: "POST",
  body: "{{payload}}",       // Use payload from action trigger
  onSuccess: {
    setState: { itemDeleted: true },
    notify: { message: "Item deleted", type: "success" },
    triggerAction: "refreshData",
  },
  onError: {
    notify: { message: "Failed to delete item", type: "error" },
  },
}
```

#### `reload` - Re-execute Loaders

```typescript
{
  id: "refreshData",
  type: "reload",
  loaderIds: ["dashboardData", "metrics"],  // Optional: reload specific loaders
}
```

#### `custom` - Custom Handler

```typescript
{
  id: "customAction",
  type: "custom",
  handler: "myCustomHandler",  // Handler registered in frontend code
}
```

### Action Options

#### Confirmation Dialog

```typescript
{
  id: "deleteAll",
  type: "api",
  apiRoute: "/delete-all",
  confirm: {
    title: "Confirm Delete",
    message: "Are you sure you want to delete all items?",
    confirmText: "Delete",
    cancelText: "Cancel",
  },
}
```

#### Loading Indicator

```typescript
{
  id: "longOperation",
  type: "api",
  apiRoute: "/process",
  showLoading: true,
}
```

#### Debounce

```typescript
{
  id: "search",
  type: "api",
  apiRoute: "/search",
  debounce: 300,  // Wait 300ms before executing
}
```

## Success/Error Handlers

API actions can define success and error handlers:

### onSuccess

```typescript
onSuccess: {
  // Update state with result data
  setState: {
    items: "result.data",      // Map result path to state key
    total: "result.count",
  },
  // Show notification
  notify: {
    message: "Operation completed",
    type: "success",  // or "info"
  },
  // Trigger another action
  triggerAction: "refreshData",
  // Navigate to a path
  navigate: "/success",
}
```

### onError

```typescript
onError: {
  setState: {
    error: "Something went wrong",
    loading: false,
  },
  notify: {
    message: "Operation failed",
    type: "error",  // or "warning"
  },
  triggerAction: "handleError",
}
```

## Data Bindings

Loaders can use state bindings in their body:

```typescript
{
  id: "searchResults",
  apiRoute: "/search",
  method: "POST",
  body: {
    query: "{{state.searchQuery}}",
    page: "{{state.currentPage}}",
  },
}
```

## Complete Example

```typescript
export const config: PluginConfig<MyTable, typeof MyActions> = {
  actions: MyActions,
  apiRoutes: {
    "/dashboard": { actions: ["getDashboardData"], method: "GET" },
    "/items": { actions: ["getItems"], method: "GET" },
    "/items/create": { actions: ["createItem"], method: "POST" },
    "/items/delete": { actions: ["deleteItem"], method: "POST" },
  },
  frontend: {
    // Global loaders run on all routes
    globalLoaders: [
      {
        id: "appConfig",
        apiRoute: "/config",
        dataKey: "config",
        cache: { ttl: 300000 },
      },
    ],
    // Global actions available on all routes
    globalActions: [
      {
        id: "refreshAll",
        type: "reload",
      },
    ],
    routes: [
      {
        path: "/dashboard",
        loaders: [
          {
            id: "dashboardData",
            apiRoute: "/dashboard",
            dataKey: "dashboard",
          },
          {
            id: "liveStats",
            apiRoute: "/stats",
            dataKey: "stats",
            polling: { interval: 10000, enabled: "state.autoRefresh" },
          },
        ],
        actions: [
          {
            id: "toggleAutoRefresh",
            type: "setState",
            stateUpdates: { autoRefresh: "{{!state.autoRefresh}}" },
          },
          {
            id: "createItem",
            type: "api",
            apiRoute: "/items/create",
            method: "POST",
            body: "{{payload}}",
            showLoading: true,
            onSuccess: {
              notify: { message: "Item created!", type: "success" },
              triggerAction: "refreshAll",
            },
            onError: {
              notify: { message: "Failed to create item", type: "error" },
            },
          },
          {
            id: "deleteItem",
            type: "api",
            apiRoute: "/items/delete",
            method: "POST",
            confirm: { message: "Delete this item?" },
            onSuccess: { triggerAction: "refreshAll" },
          },
        ],
        template: {
          id: "my-dashboard",
          name: "My Dashboard",
          state: {
            initial: {
              autoRefresh: true,
            },
          },
          widgets: [
            {
              type: "button",
              props: {
                text: "Create Item",
                variant: "primary",
                action: "createItem",
              },
            },
            {
              type: "table",
              props: {
                columns: [
                  { key: "name", title: "Name" },
                  { key: "actions", title: "Actions" },
                ],
              },
              bindings: {
                data: "dashboard.items",
              },
            },
          ],
        },
      },
    ],
  },
}
```

## API Endpoints

The following API endpoints are available for frontend loader/action execution:

### Get Route Loaders
```
GET /api/v2/plugins/frontend/:pluginId/loaders?path=/dashboard
```

### Execute All Loaders
```
POST /api/v2/plugins/frontend/:pluginId/loaders/execute
Body: { path: "/dashboard", state: { ... } }
```

### Execute Single Loader
```
POST /api/v2/plugins/frontend/:pluginId/loaders/:loaderId/execute
Body: { path: "/dashboard", state: { ... } }
```

### Get Route Actions
```
GET /api/v2/plugins/frontend/:pluginId/actions?path=/dashboard
```

### Execute Action
```
POST /api/v2/plugins/frontend/:pluginId/actions/:actionId/execute
Body: { path: "/dashboard", state: { ... }, payload: { ... } }
```

### Get Action Definition
```
GET /api/v2/plugins/frontend/:pluginId/actions/:actionId?path=/dashboard
```

## Builder Helpers

The `@dockstat/template-renderer` package provides builder helpers for creating loaders and actions:

```typescript
import { loaders, actions } from "@dockstat/template-renderer"

// Loader builders
const dashboardLoader = loaders.data("dashboard", "/dashboard")
const pollingLoader = loaders.polling("live", "/metrics", 5000)
const cachedLoader = loaders.cached("config", "/config", 60000)
const stateLoader = loaders.toState("settings", "/settings", "userSettings")

// Action builders
const setStateAction = actions.setState("toggle", { visible: true })
const navigateAction = actions.navigate("goHome", "/")
const apiAction = actions.api("save", "/save", {
  method: "POST",
  body: "{{payload}}",
  onSuccess: { notify: { message: "Saved!", type: "success" } },
})
const reloadAction = actions.reload("refresh", ["dashboard", "metrics"])
const customAction = actions.custom("custom", "myHandler")
```
