import { systemStats } from "../lib/sysStats";

export const MiscLoaders = {
  getStats: () => systemStats(),
}
