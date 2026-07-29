/**
 * Data source registration via WebSocket pub/sub.
 * Integrates with the main DSWebSockerHandler for data source publishing.
 */

import type { Logger } from "@dockstat/logger"
import type { DataPipeNode, DataPipeNodeData } from "../types"
import { DataProvider, type PipeContext } from "./types"

/**
 * WebSocket data source provider that subscribes to topics
 * from the main DSWebSockerHandler and pushes data through the pipe.
 */
export class WebSocketDataSourceProvider extends DataProvider {
  readonly type = "websocket-source"

  private subscriptions = new Map<string, () => void>()
  private log: Logger
  private publishCallback: ((topic: string, data: unknown) => number) | undefined
  private subscribeCallback:
    | ((topic: string, callback: (data: unknown) => void) => (() => void) | undefined)
    | undefined
  private latestData = new Map<string, unknown>()

  constructor(
    private logger: Logger,
    private config: {
      /** Callback to publish data to websocket subscribers */
      publish?: (topic: string, data: unknown) => number
      /** Callback to subscribe to websocket topics */
      subscribe?: (topic: string, callback: (data: unknown) => void) => (() => void) | undefined
    }
  ) {
    super()
    this.log = logger.spawn("WSDataSource")
    this.publishCallback = config.publish
    this.subscribeCallback = config.subscribe
  }

  /**
   * Update the publish/subscribe callbacks after construction.
   * Used by WidgetsService.connectDataSourceHandler().
   */
  setCallbacks(config: {
    subscribe: (topic: string, callback: (data: unknown) => void) => (() => void) | undefined
    publish?: (topic: string, data: unknown) => number
  }): void {
    this.publishCallback = config.publish
    this.subscribeCallback = config.subscribe
  }

  override execute(data: DataPipeNodeData): unknown {
    const topic = data.topic
    const fallbackValue = data.fallback

    if (!topic) {
      this.log.warn("WebSocket data source node missing 'topic' in data")
      return fallbackValue
    }

    // Return latest cached data for this topic
    return this.latestData.get(topic) ?? fallbackValue
  }

  /**
   * Register a websocket data source.
   * This subscribes to a topic and caches incoming data for pipe consumption.
   */
  registerDataSource(topic: string): void {
    if (this.subscriptions.has(topic)) {
      this.log.warn(`Data source "${topic}" already registered`)
      return
    }

    if (this.subscribeCallback) {
      const unsubscribe = this.subscribeCallback(topic, (data) => {
        this.latestData.set(topic, data)
        this.log.debug(`Received data for topic "${topic}"`)
      })

      if (unsubscribe) {
        this.subscriptions.set(topic, unsubscribe)
        this.log.info(`Registered websocket data source: "${topic}"`)
      }
    } else {
      this.log.warn("No subscribe callback configured - data sources will not receive live data")
    }
  }

  /**
   * Unregister a websocket data source.
   */
  unregisterDataSource(topic: string): void {
    const unsubscribe = this.subscriptions.get(topic)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(topic)
      this.latestData.delete(topic)
      this.log.info(`Unregistered websocket data source: "${topic}"`)
    }
  }

  /**
   * Publish data to a websocket topic (useful for testing or manual data injection).
   */
  publishToTopic(topic: string, data: unknown): number {
    this.latestData.set(topic, data)
    if (this.publishCallback) {
      return this.publishCallback(topic, data)
    }
    return 0
  }

  override dispose(): void {
    for (const [topic, unsubscribe] of this.subscriptions.entries()) {
      unsubscribe()
      this.log.debug(`Cleaned up data source: "${topic}"`)
    }
    this.subscriptions.clear()
    this.latestData.clear()
  }
}
