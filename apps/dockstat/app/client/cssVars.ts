export function applyCSSVariables(variables: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  requestAnimationFrame(() => {
    const root = document.documentElement;
    if (!root) return;

    for (const [key, value] of Object.entries(variables)) {
      try {
        root.style.setProperty(key, value);
      } catch (error) {
        console.warn(`Failed to set CSS variable ${key}:`, error);
      }
    }
  });
}

export function removeCSSVariables(variables: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  requestAnimationFrame(() => {
    const root = document.documentElement;
    if (!root) return;

    for (const key of Object.keys(variables)) {
      try {
        root.style.removeProperty(key);
      } catch (error) {
        console.warn(`Failed to remove CSS variable ${key}:`, error);
      }
    }
  });
}
