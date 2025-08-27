import { createLogger } from '@dockstat/logger'
import type { THEME } from '@dockstat/typings'
import React, { useCallback, useEffect, useState } from 'react'
import { useTheme } from './context'

const logger = createLogger('ThemeHooks')

/**
 * Hook for managing theme switching with loading states
 */
export function useThemeSwitch() {
  const { setThemeName, isLoading, error } = useTheme()
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)

  const switchTheme = useCallback(
    async (themeName: string) => {
      logger.info(`Switching theme to: ${themeName}`)
      setSwitchingTo(themeName)
      try {
        setThemeName(themeName)
        logger.info(`Successfully switched theme to: ${themeName}`)
      } catch (error) {
        logger.error(`Failed to switch theme to ${themeName}: ${error}`)
        throw error
      } finally {
        setSwitchingTo(null)
      }
    },
    [setThemeName]
  )

  return {
    switchTheme,
    isSwitching: isLoading && switchingTo !== null,
    switchingTo,
    error,
  }
}

/**
 * Hook for getting specific CSS variable values
 */
export function useThemeVariable(
  variableName: string,
  fallback?: string
): string | undefined {
  const { themeVars, isThemeLoaded } = useTheme()
  const [value, setValue] = useState<string | undefined>(fallback)

  useEffect(() => {
    if (!isThemeLoaded) {
      logger.debug('Theme not loaded yet, skipping variable lookup')
      return
    }

    const cssVarName = variableName.startsWith('--')
      ? variableName
      : `--${variableName}`
    logger.debug(`Looking up theme variable: ${cssVarName}`)
    const themeValue = themeVars[cssVarName]

    if (themeValue !== undefined) {
      setValue(themeValue)
    } else if (typeof document !== 'undefined') {
      // Try to get from computed styles as fallback
      const computedValue = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVarName)
        .trim()
      setValue(computedValue || fallback)
    }
  }, [variableName, themeVars, isThemeLoaded, fallback])

  return value
}

/**
 * Hook for getting multiple CSS variables at once
 */
export function useThemeVariables(
  variableNames: string[]
): Record<string, string | undefined> {
  const { themeVars, isThemeLoaded } = useTheme()
  const [values, setValues] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (!isThemeLoaded) return

    const newValues: Record<string, string | undefined> = {}

    for (const variableName of variableNames) {
      const cssVarName = variableName.startsWith('--')
        ? variableName
        : `--${variableName}`
      const themeValue = themeVars[cssVarName]

      if (themeValue !== undefined) {
        newValues[variableName] = themeValue
      } else if (typeof document !== 'undefined') {
        // Try to get from computed styles as fallback
        const computedValue = getComputedStyle(document.documentElement)
          .getPropertyValue(cssVarName)
          .trim()
        newValues[variableName] = computedValue || undefined
      }
    }

    setValues(newValues)
  }, [variableNames, themeVars, isThemeLoaded])

  return values
}

/**
 * Hook for accessing theme component styles
 */
export function useComponentTheme<K extends keyof THEME.THEME_components>(
  componentName: K
): THEME.THEME_components[K] | null {
  const { theme, isThemeLoaded } = useTheme()

  if (!isThemeLoaded || !theme?.vars?.components?.[componentName]) {
    return null
  }

  return theme.vars.components[componentName]
}

/**
 * Hook for theme persistence (localStorage)
 */
export function useThemePersistence(storageKey = 'dockstat-theme') {
  const { themeName, setThemeName } = useTheme()

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && themeName) {
      logger.debug(`Persisting theme to localStorage: ${themeName}`)
      localStorage.setItem(storageKey, themeName)
    }
  }, [themeName, storageKey])

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(storageKey)
      logger.debug(`Retrieved theme from localStorage: ${savedTheme}`)
      if (savedTheme && savedTheme !== themeName) {
        logger.info(`Restoring saved theme: ${savedTheme}`)
        setThemeName(savedTheme)
      }
    }
  }, [storageKey, themeName, setThemeName])

  const clearPersistedTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    clearPersistedTheme,
  }
}

/**
 * Hook for detecting system theme preference
 */
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return systemTheme
}

/**
 * Hook for theme validation and health checks
 */
export function useThemeHealthCheck() {
  const { theme, error, isThemeLoaded } = useTheme()
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean
    issues: string[]
    warnings: string[]
  }>({
    isHealthy: true,
    issues: [],
    warnings: [],
  })

  useEffect(() => {
    if (!isThemeLoaded || !theme) {
      logger.warn('Theme health check failed: Theme not loaded')
      setHealthStatus({
        isHealthy: false,
        issues: ['Theme not loaded'],
        warnings: [],
      })
      return
    }

    const issues: string[] = []
    const warnings: string[] = []

    // Check for required theme properties
    if (!theme.name) issues.push('Missing theme name')
    if (!theme.version) warnings.push('Missing theme version')
    if (!theme.creator) warnings.push('Missing theme creator')

    // Check for theme variables
    if (!theme.vars) {
      issues.push('Missing theme variables')
    } else {
      // Check for component styles
      if (!theme.vars.components) {
        warnings.push('Missing component styles')
      }

      // Check for background effects
      if (!theme.vars.background_effect) {
        warnings.push('Missing background effect configuration')
      }
    }

    // Check for errors
    if (error) {
      issues.push(`Theme error: ${error}`)
    }

    setHealthStatus({
      isHealthy: issues.length === 0,
      issues,
      warnings,
    })
  }, [theme, error, isThemeLoaded])

  return healthStatus
}

/**
 * Hook for creating custom CSS properties from theme values
 */
export function useCustomCSSProperties(
  mapping: Record<string, string>,
  prefix = '--custom'
): void {
  const { themeVars, isThemeLoaded } = useTheme()

  useEffect(() => {
    if (!isThemeLoaded || typeof document === 'undefined') return

    const root = document.documentElement

    for (const [customProp, themeProp] of Object.entries(mapping)) {
      const cssVarName = themeProp.startsWith('--')
        ? themeProp
        : `--${themeProp}`
      const value = themeVars[cssVarName]

      if (value) {
        const customPropName = `${prefix}-${customProp}`
        root.style.setProperty(customPropName, value)
      }
    }

    // Cleanup function
    return () => {
      for (const customProp of Object.keys(mapping)) {
        const customPropName = `${prefix}-${customProp}`
        root.style.removeProperty(customPropName)
      }
    }
  }, [mapping, prefix, themeVars, isThemeLoaded])
}
