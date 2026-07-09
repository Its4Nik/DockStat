/**
 * WebSocket handler for the widgets subsystem.
 *
 * Thin wrapper around the universal `createWSHandler` from
 * `@dockstat/utils/ws-handler` that adds widget-specific
 * topic resolution and convenience methods.
 *
 * Supports optional auth integration.
 */

import type { Logger } from "@dockstat/logger"
import Elysia, { t } from "elysia"
import { createWSHandler } from "@dockstat/utils/ws-handler"
import type { WSTopicHandler } from "@dockstat/utils/ws-handler"
import type { DataPayload } from "../types"
import type { WidgetWSData, WidgetWSTopic } from "./types"
import { resolveWidgetTopicKey } from "./types"

export interface WidgetWSHandlerConfig {
  /** Enable authentication for WebSocket connections */
  requireAuth?: boolean
  /** Token verification function (from @dockstat/auth) */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>
}

export class WidgetWSHandler {
  private handler: WSTopicHandler
  private log: Logger

  constructor(
    baseLogger: Logger,
    config?: WidgetWSHandlerConfig
  ) {
    this.log = baseLogger.spawn("WidgetWS")

    this.handler = createWSHandler(baseLogger,{
      bodySchema: t.Object({
        topic: t.Union([
          t.Object({ dashboardId: t.String(), type: t.Literal("dashboard") }),
          t.Object({ type: t.Literal("widgets") }),
        ]),
        type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe")]),
      }),
      onFirstSubscriber: (topic) => {
        this.log.debug(`First subscriber on "${topic}"`)
      },
      onLastSubscriberLeave: (topic) => {
        this.log.debug(`Last subscriber left "${topic}"`)
      },
      prefix: "/ws/widgets",
      requireAuth: config?.requireAuth ?? false,
      resolveKey: resolveWidgetTopicKey,
      responseSchema: t.Object({
        data: t.Any(),
        timestamp: t.Number(),
        topic: t.String(),
      }),
      verifyToken: config?.verifyToken,
    })
  }

  /**
   * Push data updates for a specific dashboard.
   */
  sendDataUpdate(dashboardId: string, payloads: DataPayload[]): number {
    const data: WidgetWSData = {
      dashboardId,
      payloads,
      type: "data-update",
    }
    return this.handler.send({ dashboardId, type: "dashboard" }, data)
  }

  /**
   * Push a generic widget event to all widget subscribers.
   */
  sendToAll(data: WidgetWSData): number {
    return this.handler.send({ type: "widgets" }, data)
  }

  /**
   * Publish arbitrary data to a widgets topic.
   */
  send(topic: WidgetWSTopic, data: unknown): number {
    return this.handler.send(topic, data)
  }

  /** Mount this on your Elysia app */
  getRoutes() {
    return this.handler.getRoutes()
  }

  /** Subscriber count for a topic */
  subscriberCount(topic: string): number {
    return this.handler.subscriberCount(topic)
  }

  /** All active topic keys */
  activeTopics(): string[] {
    return this.handler.activeTopics()
  }
}
