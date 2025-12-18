import { DockStatAPI, type TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"
import Logger from "@dockstat/logger"

const log = new Logger("RRS")
const PORT = Number(
  Bun.env.DOCKSTAT_API_PORT || (Bun.env.NODE_ENV || "dev") === "production" ? 3000 : 5173
)

const API = DockStatAPI

export const ServerAPI = treaty<TreatyType>(`http://localhost:${PORT}`).api.v2

API.listen({ port: PORT, reusePort: true }, () => {
  log.info(`DockStatAPI started on ${PORT}`)
})
