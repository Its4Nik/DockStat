import type { Meta, StoryObj } from "@storybook/react-vite"
import IntroScreen from "../welcome/Intro"

const meta: Meta<typeof IntroScreen> = {
  component: IntroScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "App/IntroScreen",
}

export default meta

type Story = StoryObj<typeof IntroScreen>

/**
 * Default story — runs the intro animation once on mount.
 */
export const Default: Story = {
  render: () => (
    <div className="h-screen w-screen bg-indigo-400">
      <IntroScreen />
    </div>
  ),
}
