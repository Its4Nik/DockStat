import type { Meta, StoryObj } from "@storybook/react-vite"
import { Divider } from "../components/Divider/Divider"

const meta: Meta<typeof Divider> = {
  argTypes: {
    label: { control: "text" },
    variant: {
      control: "radio",
      defaultValue: "solid",
      options: ["solid", "dashed", "dotted"],
    },
  },
  component: Divider,
  title: "Layout/Divider",
}

export default meta

type Story = StoryObj<typeof Divider>

/**
 * Basic horizontal divider
 */
export const Default: Story = {
  args: {
    variant: "solid",
  },
}

/**
 * Divider with centered label
 */
export const WithLabel: Story = {
  args: {
    label: "Section Title",
    variant: "solid",
  },
}

/**
 * Variants demo
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Divider variant="solid" />
      <Divider variant="dashed" />
      <Divider variant="dotted" />
      <Divider label="With Label" />
    </div>
  ),
}
