import { DockStatAPI, type TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"
import Logger from "@dockstat/logger"

const RRSLogger = new Logger("RRS")

const PORT = Number(
  Bun.env.DOCKSTAT_API_PORT || (Bun.env.NODE_ENV || "dev") === "production" ? 3000 : 5173
)

DockStatAPI.listen(PORT)

RRSLogger.info(`DockStatAPI listening on ${PORT}`)

export const ServerAPI = treaty<TreatyType>(`http://localhost:${PORT}`).api.v2
