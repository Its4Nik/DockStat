import type { DOCKER } from "@dockstat/typings"
import { DockerClientManagerCore } from "./core"

/**
 * Streams mixin for Docker Client Manager.
 *
 * Exposes StreamManager controls through the manager so tests and callers
 * can manage streaming channels via the DCM -> worker -> client path.
 *
 * The worker side forwards:
 *  - stream_createConnection
 *  - stream_closeConnection
 *  - stream_subscribe
 *  - stream_unsubscribe
 *  - stream_getSubscriptions
 *  - stream_getChannels
 *
 * Stream payloads are proxied back to the manager as events of type "message:send".
 */
export class Streams extends DockerClientManagerCore {
  /**
   * Create a logical connection on the worker's StreamManager.
   * Useful for grouping subscriptions per frontend/client.
   */
  public async createConnection(clientId: number, connectionId: string): Promise<void> {
    await this.sendRequest(clientId, {
      type: "stream_createConnection",
      connectionId,
    })
  }

  /**
   * Close a previously created logical connection.
   * All subscriptions tied to this connection will be unsubscribed.
   */
  public async closeConnection(clientId: number, connectionId: string): Promise<void> {
    await this.sendRequest(clientId, {
      type: "stream_closeConnection",
      connectionId,
    })
  }

  /**
   * Subscribe to a stream channel.
   * Returns a subscriptionId that can be used to unsubscribe later.
   */
  public async subscribe(
    clientId: number,
    connectionId: string,
    channel: DOCKER.StreamChannel["type"] | string,
    options: DOCKER.StreamOptions
  ): Promise<string> {
    const res = await this.sendRequest<string | undefined>(clientId, {
      type: "stream_subscribe",
      connectionId,
      channel,
      options,
    })

    if (!res || typeof res !== "string") {
      throw new Error("Worker did not return a subscriptionId for stream_subscribe")
    }

    return res
  }

  /**
   * Unsubscribe from a stream using the subscriptionId returned by subscribe().
   * Returns true if a subscription was removed, false otherwise.
   */
  public async unsubscribe(clientId: number, subscriptionId: string): Promise<boolean> {
    const res = await this.sendRequest<boolean | undefined>(clientId, {
      type: "stream_unsubscribe",
      subscriptionId,
    })

    return res === true
  }

  /**
   * Get current subscriptions. Optionally scope by connectionId.
   */
  public async getSubscriptions(
    clientId: number,
    connectionId?: string
  ): Promise<DOCKER.StreamSubscription[]> {
    const res = await this.sendRequest<DOCKER.StreamSubscription[] | undefined>(clientId, {
      type: "stream_getSubscriptions",
      connectionId,
    })

    return Array.isArray(res) ? res : []
  }

  /**
   * Discover available channels supported by the worker's StreamManager.
   */
  public async getChannels(clientId: number): Promise<DOCKER.StreamChannel[]> {
    const res = await this.sendRequest<DOCKER.StreamChannel[] | undefined>(clientId, {
      type: "stream_getChannels",
    })

    return Array.isArray(res) ? res : []
  }
}

export default Streams
