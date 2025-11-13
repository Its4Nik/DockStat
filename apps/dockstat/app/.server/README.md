# DockStat API Convention — Elysia + Eden Treaty + React Router

A deep-dive guide to the API pattern you already started: an Elysia backend exposing typed routes, Eden Treaty for type-safe clients, and React Router powering loaders/actions and `<Form>` integration. This README explains the mental model, the server/client split that keeps Vite sane, how to proxy React Router requests to the Elysia handler, how to use `Form` and `action` with typed responses, plus security, error handling, streaming, dev workflow and deployment notes. Copy-paste-ready code snippets are included and oriented for Bun; Docker guidance is provided near the end.

---

# Philosophy and mental model

Think of Elysia as the authoritative API engine that owns routes, types and validation. Eden Treaty is the bridge that either generates or provides a typed interface so callers don’t guess inputs/outputs. React Router is the UI-facing request coordinator: it handles navigation, runs `loader`/`action` server-side in SSR or during client-side transitions, and supplies `<Form>` which posts to `action` endpoints. The core rule is: server-only code that depends on the Elysia runtime, Treaty internals, or `ApiHandler` must remain server-only (imported only inside modules that are built for SSR/server). Client bundles must not import server-only modules directly; keep them behind an alias or produce a build-time typed client.

This pattern gives you single-source type safety, preserves the semantics of React Router’s loaders/actions/Forms, and avoids Vite bundling problems by ensuring no accidental server-side side-effects are executed during the client build.


:::tip
Place server-only code under a single server-only folder or alias. An example layout:
The key: `.server/*` is never bundled into the browser output.
:::

---

# Core server pieces explained

[`./api/index.ts`](./api/index.ts) contains the DockStatAPI. It should exports the Elysia instance but must not call `.listen()` during import.

(`index.ts`)[./index.ts] is the explicit server entry. It imports `DockStatAPI` and calls `.listen()` once; this ensures imports remain pure and tooling doesn’t start servers unexpectedly.

[`treaty.ts`](./treaty.ts) builds two things and exports them both: a `createStaticHandler` (React Router `ApiHandler`) configured to map to the Elysia routes, and a server-side `treaty` client . This module never calls `.listen()`.

[`proxy.ts`](./proxy.ts) contains `proxyQuery(request, reqId)` — a robust function that:

* clones and forwards the incoming `Request` to `ApiHandler.query()` while preserving body and headers
* avoids mutating the original `Request` (some runtimes error on that),
* interprets the `ApiHandler` return value (it might return a `Response` directly or the structured `{ loaderData, actionData }` object),
* returns either a `Response` or the appropriate loader/action value expected by React Router.

The small route file under [`app/routes/proxy.ts`](./../routes/proxy.ts) imports only the server-only proxy and forwards React Router `loader` and `action` calls to `proxyQuery`. The loader/action remains tiny and importable from route registration without pulling server runtime into the client bundle (because your Vite config marks the alias as server-only in SSR context).

---

# Using React Router `<Form>` with this pattern

`<Form>` submits to the route’s `action`. With the proxy setup, that `action` executes `proxyQuery` which forwards the `Request` to the Elysia handler. From the UI author’s perspective you simply use React Router `Form` normally; the backend will receive the same request with form-encoded body, files, etc.

Example `Form`:

```tsx
import { Form, useActionData, useNavigation } from "react-router";

export default function UserForm() {
  const actionData = useActionData();
  const navigation = useNavigation();

  return (
    <Form method="post" action="/api/users/create">
      <input name="name" />
      <input name="email" />
      <button type="submit" disabled={navigation.state !== "idle"}>Create</button>
      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
    </Form>
  );
}
```

The `action` path `/api/users/create` is an example route that maps to the proxy route, which forwards the `Request` to the Elysia handler at `/api/users/create`. Elysia receives the form-encoded body, validates it (via the Elysia schema), and returns either a redirect/Response or form data that React Router will surface to the client.

If you want the `action` to do a redirect after successful processing, return a `Response` with a `Location` header (or use `redirect()` helpers) on the Elysia side. `ApiHandler` will pass these `Response` objects through and React Router will handle them correctly.

---

# Handling file uploads and streaming bodies

The proxy clones the request into a new `Request` with the body read into a buffer. This approachis safe for normal uploads and avoids stream re-consumption issues. If you need to support very large uploads without buffering server memory, you can change the forwarding strategy to pass the request's body stream directly when the environment supports it:

* For Bun and Node with streaming support, create a `Request` that references `original.body` directly and set headers accordingly. Be careful: some environments disallow reusing an already-consumed stream. Use this optimization only when you control the runtime and know streams can be proxied without cloning.

By default, cloning to ArrayBuffer is the safest cross-platform option.

---

# Errors and Response passthrough

When the Elysia route returns a `Response` (for example a redirect, custom status, or streamed body), `ApiHandler.query(...)` often returns that `Response` directly. `proxyQuery` will pass that `Response` back to React Router unchanged. This preserves status codes, headers and response body.

If the Elysia handler returns structured loader/action data, `ApiHandler.query(...)` returns `{ loaderData, actionData }`. `proxyQuery` extracts the correct piece based on request method and returns the plain data for React Router.

Make sure to have a consistent convention: Elysia routes that will be used from client `loader` calls should either return JSON structure expected by the UI or return a `Response` when they intend to control the full response (redirects, file streams, errors).

---

# Security: cookies vs headers and CSRF

Prefer cookies for authentication when the UI and API are same-origin. Cookies have secure/httponly flags and avoid exposing secrets in JS. If you do use headers (Authorization, custom tokens), ensure you protect CSRF. React Router `<Form>` posts are CSRF-prone when you rely on cookies only; include anti-CSRF tokens in forms or use SameSite=Lax/Strict cookies and double-submit tokens.

The proxy injects `x-dockstatapi-requestid` header — that’s fine for correlation tracing. Never use such headers for auth. If you need to pass user identity from server-side caller to Elysia, prefer server-side session lookup or signed tokens set on the server.

---

# Final tips and best practices

Keep server-only code under one alias. Avoid side-effects on import. Use the proxy pattern for React Router loaders/actions so the UI behaves as if it's directly talking to Elysia while keeping the bundle clean. Prefer server-side Treaty usage; if you need a client-side typed API, generate a client during the build. Use `<Form>` naturally — your `action` receives the same request shape and proxy forwards it unchanged to Elysia. Rely on Elysia’s validation so frontend code can be simpler and typed responses are consistent.
