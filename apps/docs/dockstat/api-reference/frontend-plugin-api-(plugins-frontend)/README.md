---
id: 560ed81b-f22c-4a72-ba1d-650d377e885b
title: Frontend Plugin API (plugins/frontend)
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: b174143d-f906-4f8d-8cb5-9fc96512e575
updatedAt: 2026-01-01T14:25:48.152Z
urlId: mok9JVXj9w
---

This document describes the frontend-related plugin endpoints exposed by the DockStat API. These routes live under the plugin routes prefix and are implemented in the API at:

```apps/api/src/routes/plugins/frontend.ts#L1-999
// See the canonical route implementation and route details here
```

Base URL (development)

* [http://localhost:3000/api/v2/plugins/frontend](http://localhost:9876/api/v2/plugins/frontend)

Overview

* These endpoints let clients inspect plugin-provided frontend routes, templates and fragments, and execute route-level "loaders" and "actions" provided by plugins.
* The endpoints are implemented by the `PluginHandler` module which exposes functions such as `getAllFrontendRoutes`, `getFrontendNavigationItems`, `executeRouteLoaders`, `executeAction`, etc. The route definitions and handler wiring are in the implementation referenced above.

Important note about `pluginId`

* The routes accept `:pluginId` as a path parameter. Internally the code converts it to a Number (e.g. `Number(params.pluginId)`), so pass numeric plugin IDs (or numeric strings) when calling these endpoints.

Common response shape

* Success responses generally return JSON objects with the requested data (arrays / objects).
* When a referenced resource (route, loader, action) can't be found, the endpoints return an error object with contextual fields (e.g. `error`, `pluginId`, `routePath`, `loaderId` / `actionId`).

Endpoints


1. GET /routes

* Path: `/plugins/frontend/routes`
* Description: Return all frontend routes provided by all loaded plugins.
* Response: Array of route definitions. Each route typically contains metadata such as `pluginId`, `path`, `meta` (title, icon, showInNav), and route config.

Example:

```json
[
  {
    "pluginId": 1,
    "path": "/my-plugin",
    "meta": { "title": "My Plugin", "icon": "settings", "showInNav": true },
    "templateId": "my-plugin::my-template"
  }
]
```


2. GET /routes/by-plugin

* Path: `/plugins/frontend/routes/by-plugin`
* Description: Returns frontend routes grouped by plugin.
* Response: Object keyed by `pluginId` with arrays of route objects.


3. GET /navigation

* Path: `/plugins/frontend/navigation`
* Description: Returns navigation items for plugins that expose frontend routes (useful for building a combined navigation).
* Response: Array of navigation entries (title, path, icon, pluginId, order, etc).


4. GET /summary

* Path: `/plugins/frontend/summary`
* Description: Returns a compact summary of frontend configurations across plugins (counts, which plugins expose routes/templates/fragments, etc).
* Response: Summary object.


5. POST /:pluginId/template

* Path: `/plugins/frontend/:pluginId/template`
* Description: Get the template for a specific plugin frontend route, along with fragments, loader/action definitions, and initial data produced by executing route loaders.
* Params:
  * Path param: `pluginId` (string numeric)
* Body:
  * `{ "path": "/route-path" }` — string path to the route (the server will normalize to `/${body.path || ""}`)
* Response:
  * On success:

    ```json
    {
      "route": { "path": "/my-plugin", "meta": { "title": "My Plugin" }, "config": { /* route config */ } },
      "template": { /* template object (builder / parsed JSON/YAML) */ },
      "fragments": { /* shared fragments keyed by fragment id */ },
      "loaders": [ /* loader definitions for this route */ ],
      "actions": [ /* action definitions for this route */ ],
      "initialData": {
        "loaderResults": [ /* results for each loader executed */ ],
        "state": { /* merged state as returned from loaders */ },
        "data": { /* additional data returned by loaders */ }
      }
    }
    ```
  * If route not found:

    ```json
    {
      "error": "Route not found",
      "pluginId": 1,
      "routePath": "/non-existent"
    }
    ```

Usage example (curl)

```bash
curl -X POST "http://localhost:9876/api/v2/plugins/frontend/1/template" \
  -H "Content-Type: application/json" \
  -d '{"path": "my-plugin"}'
```


6. GET /:pluginId/has-routes

* Path: `/plugins/frontend/:pluginId/has-routes`
* Description: Check whether the plugin exposes any frontend routes.
* Response:
  * `{ "pluginId": 1, "hasFrontendRoutes": true }`

Frontend Loaders endpoints

* Loaders are route-level functions provided by plugins that produce initial data/state for a frontend route.


7. GET /:pluginId/loaders

* Path: `/plugins/frontend/:pluginId/loaders`
* Query:
  * `path` (optional) — route path for which to list loaders
* Response:
  * `{ "pluginId": 1, "routePath": "/my-plugin", "loaders": [ /* loader defs */ ] }`


8. POST /:pluginId/loaders/execute

* Path: `/plugins/frontend/:pluginId/loaders/execute`
* Body:
  * `{ "path": "/route", "state": { /* optional state to pass to loaders */ } }`
* Description: Execute all loaders for the given route. Returns combined loader results, state and any loader-specific data.
* Response:
  * `{ "pluginId": 1, "routePath": "/my-plugin", "results": [ ... ], "state": { ... }, "data": { ... } }`


9. POST /:pluginId/loaders/:loaderId/execute

* Path: `/plugins/frontend/:pluginId/loaders/:loaderId/execute`
* Body:
  * `{ "path": "/route", "state": { /* optional */ } }`
* Description: Execute a specific loader by its ID.
* Response:
  * On success:
    * `{ "pluginId": 1, "routePath": "/my-plugin", "loaderId": "loader-1", "result": { /* loader output */ } }`
  * If loader not found:

    ```json
    {
      "error": "Loader not found",
      "pluginId": 1,
      "routePath": "/my-plugin",
      "loaderId": "unknown"
    }
    ```

Frontend Actions endpoints

* Actions are operations bound to UI events (e.g. button clicks) implemented by plugins.


10. GET /:pluginId/actions

* Path: `/plugins/frontend/:pluginId/actions`
* Query:
  * `path` (optional) — route path
* Description: List actions available for a plugin route.
* Response:
  * `{ "pluginId": 1, "routePath": "/my-plugin", "actions": [ /* action defs */ ] }`


11. POST /:pluginId/actions/:actionId/execute

* Path: `/plugins/frontend/:pluginId/actions/:actionId/execute`
* Body:
  * `{ "path": "/route", "state": { /* optional state */ }, "payload": /* optional arbitrary payload */ }`
* Description: Execute a single frontend action. Useful to drive state changes or call plugin-provided handlers from the API (or test them).
* Response:
  * On success:
    * `{ "pluginId": 1, "routePath": "/my-plugin", "actionId": "act-1", "result": { /* action result */ } }`
  * If action not found:
    * Returns an error object similar to the loader not found case.


12. GET /:pluginId/actions/:actionId

* Path: `/plugins/frontend/:pluginId/actions/:actionId`
* Query:
  * `path` (optional) — route path
* Description: Get a specific action's definition (id, type, expected payload, side effects, etc).
* Response:
  * On success:
    * `{ "pluginId": 1, "routePath": "/my-plugin", "action": { /* action definition */ } }`
  * If not found:
    * `{ "error": "Action not found", "pluginId": 1, "routePath": "/my-plugin", "actionId": "unknown" }`

Schemas and types

* Request validation is provided using `t.Object(...)` schemas in the route definitions. Example validators:
  * `params: t.Object({ pluginId: t.String() })` (plugin id is validated as a string param)
  * `body: t.Object({ path: t.String(), state: t.Optional(t.Record(t.String(), t.Unknown())) })`
  * `query: t.Object({ path: t.Optional(t.String()) })`

Integration with templates and fragments

* The POST `/template` endpoint returns `template` and `fragments` objects that correspond to the Template/Fragment formats used by `@dockstat/template-renderer`.
* See the package README for the template format, builder API, parsers, and rendering components:

```packages/template-renderer/README.md#L1-200
# @dockstat/template-renderer
...
```

* The renderer package exposes:
  * `TemplateRenderer` component
  * `parseTemplate`, `parseFragment`
  * `useTemplate` hooks
  * Builder helpers (programmatic creation)
* Use the returned `template` and `fragments` with `TemplateRenderer` or `useTemplate` in the frontend.

Error handling

* Typical error responses include:
  * `400` — Validation errors (invalid body/query/params)
  * `404` (implicit) — Resource not found responses are returned as JSON with `error` field (e.g. `Route not found`, `Loader not found`, `Action not found`)
  * `500` — Internal server errors with structured error messages
* The API applies a global error handler that returns structured JSON errors for server-side issues.

Examples and common workflows

* Build navigation: call GET `/plugins/frontend/navigation` and merge returned entries into your main UI navigation.
* Render a plugin route:

  
  1. GET the route list or navigation to find the pluginId and route path.
  2. POST `/plugins/frontend/:pluginId/template` with `{ "path": "/route" }` to obtain the template + fragments + initialData.
  3. Use `TemplateRenderer` (or `useTemplate`) with the returned `template`, `fragments` and `initialData` to render the plugin page client-side.
* Execute a UI action server-side (for testing or remote triggers): POST `/plugins/frontend/:pluginId/actions/:actionId/execute` with optional state/payload.

Security considerations

* These endpoints do not enforce authentication by default in the current development setup. For production, you should ensure:
  * Routes are behind authenticated middleware or a reverse proxy enforcing auth.
  * Only trusted clients can execute loaders/actions that may mutate state.