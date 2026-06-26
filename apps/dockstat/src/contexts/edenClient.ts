import { eden } from "@dockstat/utils/react"
import { createContext } from "react"
import { toast } from "@/lib/toast"

export const EdenClientContext = createContext<eden.Client>(new eden.Client(toast))
