import { DockStatAPI, type TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

const API = DockStatAPI

export const ServerAPI = treaty<TreatyType>("http://localhost:3000").api.v2

API.listen({ port: 3000, reusePort: true })
