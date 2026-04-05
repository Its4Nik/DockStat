import { BaseModule } from "../base";
import type { ServiceFilters } from "./types";

export class ServicesModule extends BaseModule {
  /**
   *
   * @param filters
   * @param status Include service status, with count of running and desired tasks.
   */
  async list(filters?: ServiceFilters, status?: boolean) {
    const res = await this.request("/services", "GET", undefined, undefined, {filters: filters, status: status})
    return (await res.json())
  }
}
