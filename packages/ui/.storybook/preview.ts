import type { Preview } from "@storybook/react-vite"
import "../src/App.css"

const preview: Preview = {
  initialGlobals: {
    backgrounds: {
      value: "main-bg",
    },
  },
  parameters: {
    backgrounds: {
      options: {
        light: { name: "Light", value: "#F7F9F2" },
        "main-bg": { name: "Tailwind --color-main-bg", value: "var(--color-main-bg)" },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
