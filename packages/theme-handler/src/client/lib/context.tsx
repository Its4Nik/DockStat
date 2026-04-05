import { createContext } from "react"

export type ThemeContextData = {
  name: string
  id: number
  vars: Record<string, string>
}

export const ThemeContext = createContext<ThemeContextData>({ id: 0, name: "Undefined", vars: {} })
