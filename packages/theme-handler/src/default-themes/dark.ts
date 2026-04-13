export const DarkTheme: Record<string, string> = {
  "--color-accent": "#818cf8",

  // Badges — Error
  "--color-badge-error-bg": "#f87171",
  "--color-badge-error-outlined-border": "#f87171",
  "--color-badge-error-outlined-text": "#fca5a5",
  "--color-badge-error-text": "#18181b",

  // Badges — Primary
  "--color-badge-primary-bg": "#818cf8",
  "--color-badge-primary-outlined-border": "#818cf8",
  "--color-badge-primary-outlined-text": "#a5b4fc",
  "--color-badge-primary-text": "#18181b",

  // Badges — Secondary
  "--color-badge-secondary-bg": "#6272a4",
  "--color-badge-secondary-outlined-border": "#6272a4",
  "--color-badge-secondary-outlined-text": "#8b98c4",
  "--color-badge-secondary-text": "#f8f8f2",

  // Badges — Success
  "--color-badge-success-bg": "#34d399",
  "--color-badge-success-outlined-border": "#34d399",
  "--color-badge-success-outlined-text": "#6ee7b7",
  "--color-badge-success-text": "#18181b",

  // Badges — Warning
  "--color-badge-warning-bg": "#fbbf24",
  "--color-badge-warning-outlined-border": "#fbbf24",
  "--color-badge-warning-outlined-text": "#fcd34d",
  "--color-badge-warning-text": "#18181b",
  "--color-button-danger-bg": "#dc2626",
  "--color-button-danger-hover-bg": "#b91c1c",
  "--color-button-danger-hover-ring": "#f87171",
  "--color-button-danger-hover-text": "#ffffff",

  // Buttons — Danger
  "--color-button-danger-text": "#ffffff",
  "--color-button-ghost-hover-bg": "#44475a",
  "--color-button-ghost-hover-ring": "#44475a",
  "--color-button-ghost-hover-text": "#ffffff",

  // Buttons — Ghost
  "--color-button-ghost-text": "#f8f8f2",
  "--color-button-outline-border": "",
  "--color-button-outline-hover-bg": "#383a4a",
  "--color-button-outline-hover-ring": "#818cf8",

  // Buttons — Outline
  "--color-button-outline-text": "#a5b4fc",
  "--color-button-primary-bg": "#818cf8",
  "--color-button-primary-hover-bg": "#6366f1",
  "--color-button-primary-hover-ring": "#a5b4fc",
  "--color-button-primary-hover-text": "#ffffff",

  // Buttons — Primary
  "--color-button-primary-text": "#ffffff",
  "--color-button-secondary-bg": "#44475a",
  "--color-button-secondary-hover-bg": "#4a4d62",
  "--color-button-secondary-hover-ring": "#6272a4",
  "--color-button-secondary-hover-text": "#ffffff",

  // Buttons — Secondary
  "--color-button-secondary-text": "#f8f8f2",

  // Cards
  "--color-card-default-bg": "#44475a",
  "--color-card-default-border": "#6272a4",
  "--color-card-elevated-bg": "#4a4d62",
  "--color-card-flat-bg": "#383a4a",

  // Card Footer & Header
  "--color-card-footer-border": "#6272a4",
  "--color-card-header-border": "#6272a4",
  "--color-card-outlined-border": "#6272a4",

  // Forms — Checkbox
  "--color-checkbox-border": "#6272a4",
  "--color-checkbox-ring": "#a5b4fc",
  "--color-checkbox-text": "#818cf8",

  // Divider
  "--color-divider-color": "#6272a4",
  "--color-divider-text": "#8b98c4",
  "--color-error": "#ef4444",

  // Hoverbubble
  "--color-hover-bubble-bg": "#44475a",
  "--color-hover-bubble-text": "#f8f8f2",

  // Icon Link
  "--color-icon-link-text": "#a5b4fc",
  "--color-icon-link-text-hover": "#c7d2fe",

  // Inputs — Default
  "--color-input-default-border": "#6272a4",
  "--color-input-default-focus-border": "#818cf8",
  "--color-input-default-focus-ring": "#a5b4fc",
  "--color-input-default-text": "#8b98c4",

  // Inputs — Filled
  "--color-input-filled-bg": "#44475a",
  "--color-input-filled-focus-bg": "#4a4d62",
  "--color-input-filled-focus-ring": "#a5b4fc",
  "--color-input-filled-text": "#8b98c4",
  "--color-input-underline-color": "#6272a4",
  "--color-input-underline-focus-color": "#818cf8",

  // Inputs — Underline
  "--color-input-underline-text": "#8b98c4",
  "--color-main-bg": "#282a36",

  // Modal
  "--color-modal-bg": "#44475a",
  "--color-muted-text": "#6272a4",

  "--color-primary-text": "#f8f8f2",
  "--color-secondary-text": "#e0e0e0",

  // Select — Default
  "--color-select-default-border": "#6272a4",
  "--color-select-default-focus-border": "#818cf8",
  "--color-select-default-focus-ring": "#a5b4fc",
  "--color-select-default-text": "#8b98c4",

  // Select — Filled
  "--color-select-filled-bg": "#44475a",
  "--color-select-filled-focus-bg": "#4a4d62",
  "--color-select-filled-focus-ring": "#a5b4fc",
  "--color-select-filled-text": "#8b98c4",
  "--color-select-underline-color": "#6272a4",
  "--color-select-underline-focus-color": "#818cf8",

  // Select — Underline
  "--color-select-underline-text": "#8b98c4",

  // Slider
  "--color-slider-base-bg": "#364153",
  "--color-slider-gradient-from": "#6272a4",
  "--color-slider-gradient-to": "#818cf8",
  "--color-slider-solid-bg": "#818cf8",
  "--color-success": "#10b981",
  "--color-table-body-bg": "#2a2d3f",
  "--color-table-body-divide": "#4a4d62",
  "--color-table-body-hover": "#4a4d62",
  "--color-table-body-stripe": "#383a4a",
  "--color-table-body-text": "#f8f8f2",

  // Table
  "--color-table-border": "#6272a4",
  "--color-table-head-bg": "#44475a",
  "--color-table-head-divide": "#6272a4",
  "--color-table-head-text": "#f8f8f2",
  "--color-toggle-dot": "#ffffff",
  "--color-toggle-false": "#6272a4",

  // Toggle
  "--color-toggle-true": "#818cf8",
}

export const DarkThemeAnimations: Record<string, Record<string, number | string>> = {
  "--animate-fade-in": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "fade-in",
    timingFunction: "ease-out",
  },

  "--animate-fade-in-up": {
    duration: "1.5s",
    fillMode: "both",
    name: "fade-in-up",
    timingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },

  "--animate-fade-out": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "fade-out",
    timingFunction: "ease-in",
  },

  "--animate-float-up": {
    duration: "2.5s",
    fillMode: "forwards",
    name: "float-up",
    timingFunction: "ease-in-out",
  },

  "--animate-slide-in": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "slide-in",
    timingFunction: "ease-out",
  },

  "--animate-slide-in-left": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "slide-in-left",
    timingFunction: "ease-out",
  },

  "--animate-slide-out": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "slide-out",
    timingFunction: "ease-in",
  },

  "--animate-slide-out-left": {
    duration: "0.3s",
    fillMode: "forwards",
    name: "slide-out-left",
    timingFunction: "ease-in",
  },
  "--animate-wave": {
    duration: "2s",
    iterationCount: "infinite",
    name: "wave",
    timingFunction: "ease-in-out",
  },
}
