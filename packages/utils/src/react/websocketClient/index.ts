export {
  useAllMessages,
  useTopicSubscription,
  useWebSocketContext,
  WebSocketProvider,
} from "./use-websocket"
export type {
  UseTopicSubscriptionOptions,
  UseTopicSubscriptionReturn,
  WebSocketProviderConfig,
} from "./use-websocket"
// Re-export WS envelope types so frontend consumers never need to import
// from "@dockstat/utils/ws-handler" (which would pull in server-side Elysia
// code and break code splitting). These are type-only and erased at build.
export type {
  WSClientMessage,
  WSServerEnvelope,
} from "../../ws-handler"
