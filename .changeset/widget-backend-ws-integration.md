---
"@dockstat/utils": minor
"@dockstat/auth": minor
"@dockstat/api": minor
"@dockstat/frontend": minor
---

Integrate universal WebSocket handler and widgets backend across the monorepo

- **@dockstat/utils**: Add `./ws-handler` export with `createWSHandler()` and `WSTopicHandler` class. Enhance `WebSocketProvider` to convert `http(s)://` URLs to `ws(s)://` automatically. Re-export `WSServerEnvelope` and `WSClientMessage` types from `@dockstat/utils/react` so frontend consumers never need to import the server-side ws-handler entry point (preserves code splitting).

- **@dockstat/auth**: Re-export `verifyAuthToken` and `createAuthToken` from the public API entry point (`@dockstat/auth`) so WebSocket handlers and other consumers don't need to import from internal paths (`src/utils/jwt`). Fix auth middleware to properly set `authMethod = "jwt"` when the token is provided via query parameter (`?token=`), which is required for WebSocket upgrade requests that can't set custom headers in browsers.

- **@dockstat/api**: Migrate the custom `WebSocketHandler` in `apps/api/src/websockets/handler.ts` to use the universal `createWSHandler` from `@dockstat/utils/ws-handler`. Wire `WidgetsService` into the authenticated route guard with auth-aware WebSocket connections. Fix missing `DockStatDB` import. Wrap `verifyAuthToken` to extract the user object for the WS handler config.

- **@dockstat/frontend**: Replace the old per-topic WebSocket connection pattern (`websocketEffects/topicSubscription.ts`) with the shared `WebSocketProvider` from `@dockstat/utils/react`. Single connection multiplexes all topic subscriptions via React Context. Update `useLogs` and `useRamUsage` hooks to use `useTopicSubscription`. Add `widgets` dependency for widget client hooks.

- **widgets** (private, internal): Fix client hook import to use `@dockstat/utils/react` for `WSServerEnvelope` type instead of `@dockstat/utils/ws-handler` (prevents server-side Elysia code from being bundled into the frontend).
