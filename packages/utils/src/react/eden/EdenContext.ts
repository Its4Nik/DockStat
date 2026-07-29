import { createContext } from "react"
import type { Client } from "./index"

export const EdenContext = createContext<Client | null>(null)
