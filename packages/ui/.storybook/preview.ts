import type { Preview } from '@storybook/react-vite'
import '../src/tailwind.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        "main-bg": { name: "Tailwind --color-main-bg", value: 'var(--color-main-bg)' },
        light: { name: "Light", value: "#F7F9F2" }
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  initialGlobals: {
    backgrounds: {
      value: "main-bg"
    }
  }
};

export default preview;
