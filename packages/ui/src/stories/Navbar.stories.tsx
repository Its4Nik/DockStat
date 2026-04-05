import type { Meta, StoryObj } from "@storybook/react-vite"
import { Navbar } from "../components/Navbar/Navbar"

const meta: Meta<typeof Navbar> = {
  component: Navbar,
  title: "Layout/Navbar",
}

export default meta

type Story = StoryObj<typeof Navbar>

export const Default: Story = {
  args: {
    isNavigating: false,
  },
}
