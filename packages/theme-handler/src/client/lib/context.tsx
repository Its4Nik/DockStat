import { createContext } from "react"

export type ThemeContextData = {
  id: number
  vars: Record<string, string>
}

export const ThemeContext = createContext<ThemeContextData>({ id: 0, vars: {} })
