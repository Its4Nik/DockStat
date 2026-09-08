import { DockNodeHandler } from "../lib/docknodes"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

const DockNodesServicesLogger = BaseLogger.spawn("DockNodes")

export const DNH = new DockNodeHandler(DockStatDB._sqliteWrapper, BaseLogger)

DockNodesServicesLogger.info("DockNode handler ready")
