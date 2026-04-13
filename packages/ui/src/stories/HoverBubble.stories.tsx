import type { Meta, StoryObj } from "@storybook/react-vite"
import { HoverBubble } from "../components/HoverBubble/HoverBubble"

const meta: Meta<typeof HoverBubble> = {
  argTypes: {
    label: { control: "text" },
    position: {
      control: "radio",
      defaultValue: "top",
      options: ["top", "bottom", "left", "right"],
    },
  },
  component: HoverBubble,
  title: "Feedback/HoverBubble",
}

export default meta

type Story = StoryObj<typeof HoverBubble>

export const Default: Story = {
  args: {
    label: "Tooltip content here",
    position: "top",
  },
  render: (args) => (
    <div className="p-10 flex justify-center">
      <HoverBubble {...args}>
        <button
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          type="button"
        >
          Hover me
        </button>
      </HoverBubble>
    </div>
  ),
}

export const AllPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 place-items-center p-10">
      <HoverBubble
        label="Top"
        position="top"
      >
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          type="button"
        >
          Top
        </button>
      </HoverBubble>
      <HoverBubble
        label="Bottom"
        position="bottom"
      >
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          type="button"
        >
          Bottom
        </button>
      </HoverBubble>
      <HoverBubble
        label="Left"
        position="left"
      >
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          type="button"
        >
          Left
        </button>
      </HoverBubble>
      <HoverBubble
        label="Right"
        position="right"
      >
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          type="button"
        >
          Right
        </button>
      </HoverBubble>
    </div>
  ),
}
