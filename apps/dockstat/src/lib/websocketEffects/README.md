# WebSocket "Effect" Pattern Guide

## Overview
Utility that opens a WebSocket, keeps local React state in sync, and returns a cleanup function to drop the connection.  
Useful for live dashboards, logs, or any stream that updates faster than polling.

## Code
```ts
import { api } from "../api";

export const rssFeedEffect = (
  setRamUsage: React.Dispatch<React.SetStateAction<string>>
) => {
  // 1. open the socket
  const rssFeed = api.api.v2.misc.stats.rss.subscribe();

  // 2. push every incoming message into React state
  rssFeed.subscribe((message) => setRamUsage(message.data));

  // 3. return the disposal logic
  return () => rssFeed.close();
};
```

## Usage in a component
```tsx
import { useEffect, useState } from "react";
import { rssFeedEffect } from "@/lib/effects/rssFeedEffect";

export function RamGauge() {
  const [ram, setRam] = useState("");

  useEffect(() => rssFeedEffect(setRamUsage), [])

  return <div>RSS: {ram}</div>;
}
```

## Backend: per-socket periodic pushes
When the server must send data on an interval **per connection**, store the timer in a `WeakMap` so it is automatically garbage-collected when the socket closes.

```ts
const wsIntervals = new WeakMap<WebSocket, Timer>();

new Elysia()
  .ws("/stats/rss", {
    response: t.String(), // HAS TO BE DEFINED FOR CORRECT FRONTEND TYPINGS

    open(ws) {
      const sendRss = () => ws.send(formatBytes(process.memoryUsage().rss));
      sendRss(); // immediate
      wsIntervals.set(ws, setInterval(sendRss, 2000));
    },

    close(ws) {
      const interval = wsIntervals.get(ws);
      if (interval) {
        clearInterval(interval);
        wsIntervals.delete(ws);
      }
    },
  });
```

## Rules
- One effect = one socket.  
- Always return a cleanup function so the socket is closed on unmount.  
- Keep the effect **pure**: no UI, no toasts, only state synchronization.
