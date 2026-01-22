import { createActions } from "@dockstat/plugin-builder"
import type { StackConfig } from "../types"

export const DockStacksActions = createActions<StackConfig>({
  getStacks: ({ logger }) => {
    logger.debug("Test")
    return ""
  },
})
