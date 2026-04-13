import { QueryClient } from "@tanstack/react-query"
import { createContext } from "react"

export const queryClient = new QueryClient()
export const QueryClientContext = createContext<QueryClient>(queryClient)
