import Elysia from "elysia"

export const WebSocketElysiaInstance = new Elysia({
  name: "WebSocket",
  websocket: {
    idleTimeout: 30,
    sendPings: true,
    perMessageDeflate: true,
  },
  prefix: "/ws",
}).ws("/test", {
  message(ws, message) {
    if ((message as string).trim()) ws.send(`Elysia received: ${message}`)
  },
})
