/**
 * Apply CSS variables to the document root element
 * Uses requestAnimationFrame for proper timing and prevents race conditions
 */
export function applyCSSVariables(variables: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Cancel any pending frame to prevent race conditions
  let frameId: number | null = null;

  const applyVars = () => {
    try {
      const root = document.documentElement;
      if (!root) {
        console.warn('Document root not available');
        return;
      }

      // Batch all changes together
      const style = root.style;
      if (!style) {
        console.warn('Root style not available');
        return;
      }

      // Apply all variables in a single batch
      const entries = Object.entries(variables);
      for (const [key, value] of entries) {
        try {
          // Validate CSS variable name
          if (key && typeof key === 'string' && key.startsWith('--')) {
            style.setProperty(key, value);
          } else if (key) {
            // Auto-prefix if needed
            style.setProperty(`--${key}`, value);
          }
        } catch (error) {
          console.warn(`Failed to set CSS variable ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to apply CSS variables:', error);
    }
  };

  // Cancel any pending animation frame
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }

  // Schedule the application
  frameId = requestAnimationFrame(applyVars);
}

/**
 * Remove CSS variables from the document root element
 * Uses requestAnimationFrame for proper timing and prevents race conditions
 */
export function removeCSSVariables(variables: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Cancel any pending frame to prevent race conditions
  let frameId: number | null = null;

  const removeVars = () => {
    try {
      const root = document.documentElement;
      if (!root) {
        console.warn('Document root not available');
        return;
      }

      const style = root.style;
      if (!style) {
        console.warn('Root style not available');
        return;
      }

      // Remove all variables in a single batch
      const entries = Object.entries(variables);
      for (const [key,] of entries) {
        try {
          // Handle both prefixed and unprefixed keys
          if (key && typeof key === 'string') {
            if (key.startsWith('--')) {
              style.removeProperty(key);
            } else {
              style.removeProperty(`--${key}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to remove CSS variable ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to remove CSS variables:', error);
    }
  };

  // Cancel any pending animation frame
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }

  // Schedule the removal
  frameId = requestAnimationFrame(removeVars);
}

/**
 * Get the current value of a CSS variable
 */
export function getCSSVariable(name: string): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const root = document.documentElement;
    if (!root) return null;

    const computedStyle = getComputedStyle(root);
    const varName = name.startsWith('--') ? name : `--${name}`;
    return computedStyle.getPropertyValue(varName).trim() || null;
  } catch (error) {
    console.warn(`Failed to get CSS variable ${name}:`, error);
    return null;
  }
}

/**
 * Check if a CSS variable exists
 */
export function hasCSSVariable(name: string): boolean {
  return getCSSVariable(name) !== null;
}

/**
 * Clear all CSS variables that match a pattern
 */
export function clearCSSVariablesByPattern(pattern: string | RegExp): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  requestAnimationFrame(() => {
    try {
      const root = document.documentElement;
      if (!root || !root.style) return;

      const style = root.style;
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

      // Get all inline styles
      for (let i = style.length - 1; i >= 0; i--) {
        const prop = style[i];
        if (prop && regex.test(prop)) {
          style.removeProperty(prop);
        }
      }
    } catch (error) {
      console.error('Failed to clear CSS variables by pattern:', error);
    }
  });
}
