import type { QueryClient } from "@tanstack/react-query"
import { createContext } from "react"

export const QueryClientContext = createContext<QueryClient>({} as QueryClient)
