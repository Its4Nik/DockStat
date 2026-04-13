import type { Meta, StoryObj } from "@storybook/react-vite"
import { ThemeSidebar } from "../components/ThemeSidebar"

const meta: Meta<typeof ThemeSidebar> = {
  component: ThemeSidebar,
  title: "Components/ThemeSidebar",
}

export default meta
type Story = StoryObj<typeof ThemeSidebar>

export const Basic: Story = {
  args: {
    allColors: [
      { color: "#282a36", colorName: "--color-main-bg" },
      { color: "#f8f8f2", colorName: "--color-primary-text" },
      { color: "#e0e0e0", colorName: "--color-secondary-text" },
      { color: "#6272a4", colorName: "--color-muted-text" },
      { color: "#818cf8", colorName: "--color-accent" },
      { color: "#ef4444", colorName: "--color-error" },
      { color: "#10b981", colorName: "--color-success" },

      { color: "#818cf8", colorName: "--color-badge-primary-bg" },
      { color: "#18181b", colorName: "--color-badge-primary-text" },
      { color: "#a5b4fc", colorName: "--color-badge-primary-outlined-text" },
      { color: "#818cf8", colorName: "--color-badge-primary-outlined-border" },

      { color: "#6272a4", colorName: "--color-badge-secondary-bg" },
      { color: "#f8f8f2", colorName: "--color-badge-secondary-text" },
      { color: "#8b98c4", colorName: "--color-badge-secondary-outlined-text" },
      { color: "#6272a4", colorName: "--color-badge-secondary-outlined-border" },

      { color: "#34d399", colorName: "--color-badge-success-bg" },
      { color: "#18181b", colorName: "--color-badge-success-text" },
      { color: "#6ee7b7", colorName: "--color-badge-success-outlined-text" },
      { color: "#34d399", colorName: "--color-badge-success-outlined-border" },

      { color: "#fbbf24", colorName: "--color-badge-warning-bg" },
      { color: "#18181b", colorName: "--color-badge-warning-text" },
      { color: "#fcd34d", colorName: "--color-badge-warning-outlined-text" },
      { color: "#fbbf24", colorName: "--color-badge-warning-outlined-border" },

      { color: "#f87171", colorName: "--color-badge-error-bg" },
      { color: "#18181b", colorName: "--color-badge-error-text" },
      { color: "#fca5a5", colorName: "--color-badge-error-outlined-text" },
      { color: "#f87171", colorName: "--color-badge-error-outlined-border" },

      { color: "#ffffff", colorName: "--color-button-primary-text" },
      { color: "#818cf8", colorName: "--color-button-primary-bg" },
      { color: "#ffffff", colorName: "--color-button-primary-hover-text" },
      { color: "#6366f1", colorName: "--color-button-primary-hover-bg" },
      { color: "#a5b4fc", colorName: "--color-button-primary-hover-ring" },

      { color: "#f8f8f2", colorName: "--color-button-secondary-text" },
      { color: "#44475a", colorName: "--color-button-secondary-bg" },
      { color: "#ffffff", colorName: "--color-button-secondary-hover-text" },
      { color: "#4a4d62", colorName: "--color-button-secondary-hover-bg" },
      { color: "#6272a4", colorName: "--color-button-secondary-hover-ring" },

      { color: "#a5b4fc", colorName: "--color-button-outline-text" },
      { color: "", colorName: "--color-button-outline-border" },
      { color: "#383a4a", colorName: "--color-button-outline-hover-bg" },
      { color: "#818cf8", colorName: "--color-button-outline-hover-ring" },

      { color: "#f8f8f2", colorName: "--color-button-ghost-text" },
      { color: "#ffffff", colorName: "--color-button-ghost-hover-text" },
      { color: "#44475a", colorName: "--color-button-ghost-hover-bg" },
      { color: "#44475a", colorName: "--color-button-ghost-hover-ring" },

      { color: "#ffffff", colorName: "--color-button-danger-text" },
      { color: "#dc2626", colorName: "--color-button-danger-bg" },
      { color: "#ffffff", colorName: "--color-button-danger-hover-text" },
      { color: "#b91c1c", colorName: "--color-button-danger-hover-bg" },
      { color: "#f87171", colorName: "--color-button-danger-hover-ring" },

      { color: "#44475a", colorName: "--color-card-default-bg" },
      { color: "#6272a4", colorName: "--color-card-default-border" },
      { color: "#6272a4", colorName: "--color-card-outlined-border" },
      { color: "#4a4d62", colorName: "--color-card-elevated-bg" },
      { color: "#383a4a", colorName: "--color-card-flat-bg" },
      { color: "#6272a4", colorName: "--color-card-footer-border" },
      { color: "#6272a4", colorName: "--color-card-header-border" },

      { color: "#6272a4", colorName: "--color-divider-color" },
      { color: "#8b98c4", colorName: "--color-divider-text" },

      { color: "#6272a4", colorName: "--color-checkbox-border" },
      { color: "#818cf8", colorName: "--color-checkbox-text" },
      { color: "#a5b4fc", colorName: "--color-checkbox-ring" },

      { color: "#6272a4", colorName: "--color-input-default-border" },
      { color: "#8b98c4", colorName: "--color-input-default-text" },
      { color: "#818cf8", colorName: "--color-input-default-focus-border" },
      { color: "#a5b4fc", colorName: "--color-input-default-focus-ring" },

      { color: "#44475a", colorName: "--color-input-filled-bg" },
      { color: "#8b98c4", colorName: "--color-input-filled-text" },
      { color: "#4a4d62", colorName: "--color-input-filled-focus-bg" },
      { color: "#a5b4fc", colorName: "--color-input-filled-focus-ring" },

      { color: "#8b98c4", colorName: "--color-input-underline-text" },
      { color: "#6272a4", colorName: "--color-input-underline-color" },
      { color: "#818cf8", colorName: "--color-input-underline-focus-color" },

      { color: "#6272a4", colorName: "--color-select-default-border" },
      { color: "#8b98c4", colorName: "--color-select-default-text" },
      { color: "#818cf8", colorName: "--color-select-default-focus-border" },
      { color: "#a5b4fc", colorName: "--color-select-default-focus-ring" },

      { color: "#44475a", colorName: "--color-select-filled-bg" },
      { color: "#8b98c4", colorName: "--color-select-filled-text" },
      { color: "#4a4d62", colorName: "--color-select-filled-focus-bg" },
      { color: "#a5b4fc", colorName: "--color-select-filled-focus-ring" },

      { color: "#8b98c4", colorName: "--color-select-underline-text" },
      { color: "#6272a4", colorName: "--color-select-underline-color" },
      { color: "#818cf8", colorName: "--color-select-underline-focus-color" },

      { color: "#364153", colorName: "--color-slider-base-bg" },
      { color: "#6272a4", colorName: "--color-slider-gradient-from" },
      { color: "#818cf8", colorName: "--color-slider-gradient-to" },
      { color: "#818cf8", colorName: "--color-slider-solid-bg" },

      { color: "#818cf8", colorName: "--color-toggle-true" },
      { color: "#6272a4", colorName: "--color-toggle-false" },
      { color: "#ffffff", colorName: "--color-toggle-dot" },

      { color: "#44475a", colorName: "--color-hover-bubble-bg" },
      { color: "#f8f8f2", colorName: "--color-hover-bubble-text" },

      { color: "#a5b4fc", colorName: "--color-icon-link-text" },
      { color: "#c7d2fe", colorName: "--color-icon-link-text-hover" },

      { color: "#44475a", colorName: "--color-modal-bg" },

      { color: "#6272a4", colorName: "--color-table-border" },
      { color: "#6272a4", colorName: "--color-table-head-divide" },
      { color: "#f8f8f2", colorName: "--color-table-head-text" },
      { color: "#44475a", colorName: "--color-table-head-bg" },
      { color: "#2a2d3f", colorName: "--color-table-body-bg" },
      { color: "#f8f8f2", colorName: "--color-table-body-text" },
      { color: "#4a4d62", colorName: "--color-table-body-divide" },
      { color: "#4a4d62", colorName: "--color-table-body-hover" },
      { color: "#383a4a", colorName: "--color-table-body-stripe" },
    ],
    isOpen: true,
  },
}
