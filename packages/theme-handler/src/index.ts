// Main theme handler exports
export { default as ThemeHandler } from '../index'

// React components and providers
export { ThemeProvider, type ThemeProviderProps } from './ThemeProvider'
export { ThemeLoadingOverlay } from './ThemeLoadingOverlay'

// Context and hooks
export { ThemeContext, useTheme, type ThemeContextType } from './context'
export {
  useThemeSwitch,
  useThemeVariable,
  useThemeVariables,
  useComponentTheme,
  useThemePersistence,
  useSystemTheme,
  useThemeHealthCheck,
  useCustomCSSProperties,
} from './hooks'

// CSS variable parsing utilities
export {
  parseThemeVars,
  flattenThemeVars,
  applyCSSVariables,
  removeCSSVariables,
  defaultParserConfig,
  parserConfigs,
  type CSSVariableParserConfig,
} from './cssVariableParser'

// Re-export theme types for convenience
export type { THEME } from '@dockstat/typings'
