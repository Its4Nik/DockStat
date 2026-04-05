import { createActions } from "@dockstat/plugin-builder"

import type { StackConfig } from "../types"

export const DockStacksActions = createActions<StackConfig>({
  getStacks: ({ table, logger }) => {
    logger.debug("Getting Stacks")
    const stacks = table?.select(["*"]).all()
    logger.debug(`Got ${(stacks || []).length} stacks`)
    return stacks
  },
})
