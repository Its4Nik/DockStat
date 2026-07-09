---
id: aab7cefb-b84b-4be9-8840-a873b69c6850
title: "Frontend: Websockets"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: a81b5d89-a300-47ac-8ffa-a3b851645978
updatedAt: 2026-07-09T00:00:00.000Z
urlId: vcQwuQaPn0
---

# WebSocket Subscription Pattern Guide

## Overview

The frontend uses a **shared WebSocket connection** managed by `WebSocketProvider` from `@dockstat/utils/react`. A single connection is opened per endpoint and shared across the entire component tree via React Context. Components subscribe to topics using `useTopicSubscription` and receive typed data updates in real-time.

This replaces the old per-topic connection pattern. All topic subscriptions now multiplex over one connection, reducing overhead and simplifying reconnection logic.

## Architecture

```
WebSocketProvider (single WS connection)
├── useTopicSubscription("logs")          → log entries
├── useTopicSubscription("metrics/containers") → RAM usage
├── useTopicSubscription("metrics/stacks")     → stack metrics
└── useWidgetData({ dashboardId })        → widget data updates
```

## Setup

### 1. Mount the Provider

Wrap your app with `WebSocketProvider`. This is done in `src/providers/index.tsx`:

```tsx
import { WebSocketProvider } from "@dockstat/utils/react"

const wsBaseUrl = `${import.meta.env.DOCKSTAT_API_PORT || "http://localhost:3030"}/api/v2/ws`

<WebSocketProvider url={wsBaseUrl} requireAuth>
  <App />
</WebSocketProvider>
```

The provider:
- Resolves `http://` URLs to `ws://` automatically (and `https://` → `wss://`)
- Reads the auth token from `localStorage` and passes it as a `?token=` query parameter when `requireAuth` is enabled
- Auto-reconnects on disconnect (configurable interval)
- Shares subscriptions across all components via ref counting

### 2. Subscribe to a Topic

```tsx
import { useTopicSubscription } from "@dockstat/utils/react"

function RamGauge() {
  const { data, connected } = useTopicSubscription<string>("metrics/containers")
  return <div>RSS: {data ?? "Connecting..."}</div>
}
```

## Helper Hooks

Thin wrapper hooks in `src/lib/websocketEffects/` provide topic-specific subscriptions:

| Hook | Topic | Returns |
|------|-------|---------|
| `useLogFeed()` | `"logs"` | Latest `LogEntry \| null` |
| `useRssFeed()` | `"metrics/containers"` | Latest RAM usage string |
| `useTopicData<T>(topic)` | Any | Latest data payload |

### Usage

```tsx
import { useLogFeed } from "@WSS"

function LogViewer() {
  const logEntry = useLogFeed()
  // logEntry is LogEntry | null
}
```

## Widget Data

Widget dashboards use `useWidgetData` from `widgets/client`, which subscribes to the `widgets/dashboard/:id` topic on a separate WS endpoint (`/api/v2/ws/widgets`):

```tsx
import { useWidgetData } from "widgets/client"

function Dashboard() {
  const { data, connected, evaluate } = useWidgetData({
    dashboardId: "my-dashboard",
  })
}
```

## Rules

* **One provider, one connection.** Don't mount multiple `WebSocketProvider`s for the same endpoint.
* **Topic-based subscriptions.** Use `useTopicSubscription` — the provider handles subscribe/unsubscribe automatically via ref counting.
* **Auth tokens are passed via query parameter** (`?token=`) for maximum client compatibility.
* **Always destructure `{ connected }`** if you need to show connection status to the user.
