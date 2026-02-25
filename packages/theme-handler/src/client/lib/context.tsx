import { createContext } from "react"

export type ThemeContextData = {
  name: string
  id: number
  vars: Record<string, string>
}

export const ThemeContext = createContext<ThemeContextData>({ name: "Undefined", id: 0, vars: {} })
