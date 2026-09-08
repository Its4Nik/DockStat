---
"@dockstat/utils": minor
"@dockstat/frontend": minor
---

Integrate universal WebSocket handler and widgets backend across the monorepo

- **@dockstat/utils**: Add `./ws-handler` export with `createWSHandler()` and `WSTopicHandler` class. Enhance `WebSocketProvider` to convert `http(s)://` URLs to `ws(s)://` automatically. Re-export `WSServerEnvelope` and `WSClientMessage` types from `@dockstat/utils/react` so frontend consumers never need to import the server-side ws-handler entry point (preserves code splitting).

- **@dockstat/frontend**: Replace the old per-topic WebSocket connection pattern (`websocketEffects/topicSubscription.ts`) with the shared `WebSocketProvider` from `@dockstat/utils/react`. Single connection multiplexes all topic subscriptions via React Context. Update `useLogs` and `useRamUsage` hooks to use `useTopicSubscription`. Add `widgets` dependency for widget client hooks.

- **widgets** (private, internal): Fix client hook import to use `@dockstat/utils/react` for `WSServerEnvelope` type instead of `@dockstat/utils/ws-handler` (prevents server-side Elysia code from being bundled into the frontend).
