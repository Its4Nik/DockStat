import { QueryClient } from "@tanstack/react-query"
import { createContext } from "react"

// Create a proper QueryClient instance
const queryClient = new QueryClient()

export const QueryClientContext = createContext<QueryClient>(queryClient)
