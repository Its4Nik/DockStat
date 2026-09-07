import { createContext } from "react-router";

export type ThemeListItem = {
  name: string
  variables: Record<string, string>
}

const ThemeContext = createContext<Map<number, ThemeListItem>>(new Map())

export { ThemeContext }
