import { DockNodeHandler } from "../lib/docknodes"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

export const DNH = new DockNodeHandler(DockStatDB._sqliteWrapper, BaseLogger)
