// Onboarding.stories.tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { WelcomeToDockStat } from "../welcome/Onboarding"

const meta = {
  argTypes: {
    setOnBoardingComplete: {
      action: "onboardingComplete",
      description: "Callback fired when onboarding is completed or skipped",
    },
  },
  component: WelcomeToDockStat,
  parameters: {
    docs: {
      description: {
        component:
          "A multi-step onboarding flow for introducing users to DockStat features and functionality.",
      },
    },
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Components/Onboarding",
} satisfies Meta<typeof WelcomeToDockStat>

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {
    setOnBoardingComplete: (complete: boolean) => console.log("Onboarding complete:", complete),
  },
  parameters: {
    docs: {
      description: {
        story: "The default onboarding experience with all steps and animations.",
      },
    },
  },
}
