import { useCallback, useRef, useMemo } from 'react'
import type { THEME } from '@dockstat/typings'
import { applyCSSVariables, removeCSSVariables } from '../cssVars'
import {
  type CSSVariableParserConfig,
  parseThemeVars,
  defaultParserConfig,
  parserConfigs
} from '../cssVariableParser'

interface UseThemeCSSProps {
  cssParserConfig?: Partial<CSSVariableParserConfig>
  enableTailwindVariables?: boolean
  themeNamespace?: 'components' | 'background' | undefined
}

export function useThemeCSS({
  cssParserConfig = {},
  enableTailwindVariables = true,
  themeNamespace
}: UseThemeCSSProps) {
  const currentCSSVarsRef = useRef<Record<string, string>>({})

  // Parse CSS config
  const finalCssParserConfig = useMemo(() => {
    let baseConfig: CSSVariableParserConfig = defaultParserConfig

    if (themeNamespace === 'components') {
      baseConfig = parserConfigs.componentsOnly as CSSVariableParserConfig
    } else {
      baseConfig = parserConfigs.standard as CSSVariableParserConfig
    }

    if (enableTailwindVariables) {
      baseConfig = {
        ...baseConfig,
        prefix: '',
        transformKey: (_key: string, path: string[]) => {
          if (path[0] === 'components') {
            return path.slice(1).join('-').toLowerCase()
          }
          return path.join('-').toLowerCase()
        },
      }
    }

    return { ...baseConfig, ...(cssParserConfig as CSSVariableParserConfig) }
  }, [cssParserConfig, enableTailwindVariables, themeNamespace])

  const applyThemeVariables = useCallback(
    (themeConfig: THEME.THEME_config): Record<string, string> => {
      // Remove old variables first
      if (Object.keys(currentCSSVarsRef.current).length > 0) {
        removeCSSVariables(currentCSSVarsRef.current)
        currentCSSVarsRef.current = {}
      }

      let cssVars: Record<string, string> = {}

      if (themeNamespace === 'components') {
        cssVars = parseThemeVars(
          { components: themeConfig.vars.components } as THEME.THEME_vars,
          finalCssParserConfig
        )
      } else if (themeNamespace === 'background') {
        cssVars = parseThemeVars(
          { background_effect: themeConfig.vars.background_effect } as THEME.THEME_vars,
          finalCssParserConfig
        )
      } else {
        cssVars = parseThemeVars(themeConfig.vars, finalCssParserConfig)
      }

      // Apply new variables
      applyCSSVariables(cssVars)
      currentCSSVarsRef.current = cssVars

      return cssVars
    },
    [finalCssParserConfig, themeNamespace]
  )

  const cleanup = useCallback(() => {
    if (Object.keys(currentCSSVarsRef.current).length > 0) {
      removeCSSVariables(currentCSSVarsRef.current)
      currentCSSVarsRef.current = {}
    }
  }, [])

  return {
    applyThemeVariables,
    cleanup
  }
}
