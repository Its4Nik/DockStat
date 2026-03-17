import { DockStatDB } from "../database"
import DockNodeHandler from "../docknode"
import BaseLogger from "../logger"

export const DNH = new DockNodeHandler(DockStatDB._sqliteWrapper, BaseLogger)
