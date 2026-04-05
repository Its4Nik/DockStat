import { BaseModule } from "../base"
import type {
  InitSwarmRoute,
  InspectSwarmRoute,
  JoinSwarmRoute,
  LeaveSwarmRoute,
  UnlockKeySwarmRoute,
  UnlockSwarmRoute,
  UpdateSwarmRoute,
} from "./types"

/**
 * Swarm module for Docker API
 */
export class SwarmModule extends BaseModule {
  /**
   * Inspect swarm
   */
  async inspect() {
    const res = await this.request("/swarm", "GET")
    return (await res.json()) as InspectSwarmRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Initialize a new swarm
   */
  async init(config: InitSwarmRoute["requestBody"]["content"]["application/json"]) {
    const res = await this.request("/swarm/init", "POST", config)
    return (await res.json()) as InitSwarmRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Join an existing swarm
   */
  async join(config: JoinSwarmRoute["requestBody"]["content"]["application/json"]) {
    await this.request("/swarm/join", "POST", config)
  }

  /**
   * Leave a swarm
   */
  async leave(options?: LeaveSwarmRoute["parameters"]["query"]): Promise<void> {
    await this.request("/swarm/leave", "POST", undefined, undefined, options)
  }

  /**
   * Update a swarm
   */
  async update(
    body: UpdateSwarmRoute["requestBody"]["content"]["application/json"],
    options: UpdateSwarmRoute["parameters"]["query"]
  ): Promise<void> {
    await this.request("/swarm/update", "POST", body, undefined, options)
  }

  /**
   * Get the unlock key
   */
  async unlockkey() {
    const res = await this.request("/swarm/unlockkey", "GET")
    return (await res.json()) as UnlockKeySwarmRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Unlock a locked manager
   */
  async unlock(
    body: UnlockSwarmRoute["requestBody"]["content"]["application/json"]
  ): Promise<void> {
    await this.request("/swarm/unlock", "POST", body)
  }
}
