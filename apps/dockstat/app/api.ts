import type { TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

export const ClientAPI = treaty<TreatyType>("http://localhost:3000").api.v2
