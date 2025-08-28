import type { THEME } from '@dockstat/typings'

/**
 * Configuration for CSS variable parsing
 */
export interface CSSVariableParserConfig {
  prefix: string
  separator: string
  transformKey?: (key: string, path: string[]) => string
  transformValue?: (value: unknown, key: string, path: string[]) => string
  shouldInclude?: (key: string, value: unknown, path: string[]) => boolean
}

/**
 * Default configuration for CSS variable parsing
 */
export const defaultParserConfig: CSSVariableParserConfig = {
  prefix: '--theme',
  separator: '-',
  transformKey: (key: string, path: string[]) => {
    // Handle special cases for background effects and components
    if (path[0] === 'background_effect') {
      const effectType = path[1] // Aurora, Gradient, or Solid
      return `${key.toLowerCase()}-${effectType.toLowerCase()}`
    }
    if (path[0] === 'components') {
      const componentName = path[1] // Card, etc.
      return `${componentName.toLowerCase()}-${key.toLowerCase()}`
    }
    return key
      .toLowerCase()
      .replace(/[A-Z_]/g, (match) =>
        match === '_' ? '-' : `-${match.toLowerCase()}`
      )
  },
  transformValue: (value: unknown) => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? '1' : '0'
    return String(value)
  },
  shouldInclude: (_key: string, value: unknown, path: string[]) => {
    // Only include primitive values that can be used as CSS variables
    const isPrimitive =
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'

    if (!isPrimitive) return false

    // Special handling for background effects
    if (path[0] === 'background_effect') {
      return true // Include all primitive values from background effects
    }

    // Special handling for component properties
    if (path[0] === 'components') {
      // Include all primitive component properties
      return path.length > 1
    }

    return true
  },
}

/**
 * Flattens a nested object into CSS variable key-value pairs
 */
export function flattenThemeVars(
  obj: Record<string, unknown>,
  config: CSSVariableParserConfig = defaultParserConfig,
  path: string[] = []
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenThemeVars(value as Record<string, unknown>, config, currentPath)
      for (const [k, v] of Object.entries(nested)) {
        result[k] = v
      }
    } else {
      // Only apply shouldInclude filter to primitive values
      if (config.shouldInclude && !config.shouldInclude(key, value, currentPath)) {
        continue
      }

      // Convert to CSS variable
      const parts = currentPath.map((k) =>
        config.transformKey ? config.transformKey(k, currentPath) : k
      )

      const cssVarName = `${config.prefix}${config.separator}${parts.join(config.separator)}`

      const transformedValue = config.transformValue
        ? config.transformValue(value, key, currentPath)
        : String(value)

      result[cssVarName] = transformedValue
    }
  }

  return result
}

/**
 * Parses theme variables into CSS variables using the provided configuration
 */
export function parseThemeVars(
  themeVars: THEME.THEME_vars,
  config: Partial<CSSVariableParserConfig> = {}
): Record<string, string> {
  const finalConfig: CSSVariableParserConfig = { ...defaultParserConfig, ...config }
  return flattenThemeVars(themeVars as Record<string, unknown>, finalConfig)
}

/**
 * Applies CSS variables to the document root
 */
export function applyCSSVariables(variables: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('applyCSSVariables: window or document is undefined');
    return;
  }
  console.log('applyCSSVariables called with:', variables);

  const root = document.documentElement;
  console.log('Current CSS variables on root:', {
    variableCount: Object.keys(variables).length,
    firstFew: Object.entries(variables).slice(0, 5)
  });
  for (const [key, value] of Object.entries(variables)) {
    console.log(`Setting CSS variable ${key} = ${value}`);
    root.style.setProperty(key, value);
    // Verify the variable was set
    const applied = getComputedStyle(root).getPropertyValue(key);
    console.log(`Verified ${key} = ${applied}`);
  }
  console.log('All CSS variables applied');
}

/**
 * Removes CSS variables from the document root
 */
export function removeCSSVariables(variables: Record<string, string>): void {
  if (typeof document === 'undefined') return
  console.log('removeCSSVariables called with:', Object.keys(variables));
  if (typeof document === 'undefined') {
    console.warn('removeCSSVariables: document is undefined');
    return;
  }
  const root = document.documentElement
  for (const key of Object.keys(variables)) {
    console.log(`Removing CSS variable: ${key}`);
    root.style.removeProperty(key)
  }
  console.log('CSS variables removed');
}

/**
 * Predefined parser configurations for common use cases
 */
export const parserConfigs = {
  /**
   * Standard configuration with kebab-case keys
   */
  standard: defaultParserConfig,

  /**
   * Compact configuration with shorter variable names
   */
  compact: {
    ...defaultParserConfig,
    prefix: '--t',
    transformKey: (key: string, _path: string[]) =>
      key
        .toLowerCase()
        .replace(/[A-Z_]/g, (match) =>
          match === '_' ? '' : match.toLowerCase()
        ),
  } as CSSVariableParserConfig,

  /**
   * Verbose configuration with full path in variable names
   */
  verbose: {
    ...defaultParserConfig,
    prefix: '--dockstat-theme',
    separator: '__',
    transformKey: (key: string) => key,
  } as CSSVariableParserConfig,

  /**
   * Component-focused configuration that only includes component styles
   */
  componentsOnly: {
    ...defaultParserConfig,
    prefix: '--theme-components',
    shouldInclude: (_key: string, value: unknown, path: string[]) => {
      return (
        path[0] === 'components' &&
        path.length > 1 && // Must be a component property
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean')
      )
    },
    transformKey: (_key: string, path: string[]) => {
      if (path.length < 2) return ''
      const componentName = path[1]
      const propertyPath = path.slice(2).join('-')
      return `${componentName.toLowerCase()}-${propertyPath.toLowerCase()}`
    },
  } as CSSVariableParserConfig,
} as const
