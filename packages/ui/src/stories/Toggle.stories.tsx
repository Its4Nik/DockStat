import { useArgs } from "@storybook/client-api"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Toggle } from "../components/Forms/Toggle"

const meta: Meta<typeof Toggle> = {
  argTypes: {
    disabled: { control: "boolean" },
    label: { control: "text" },
    size: {
      control: "radio",
      defaultValue: "md",
      options: ["sm", "md", "lg"],
    },
  },
  component: Toggle,
  title: "Inputs/Toggle",
}

export default meta

type Story = StoryObj<typeof Toggle>

/**
 * Interactive toggle
 */
export const Interactive: Story = {
  args: {
    checked: false,
    label: "Enable notifications",
    size: "md",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()

    const handleChange = (checked: boolean) => {
      updateArgs({ checked })
      args.onChange?.(checked)
    }

    return (
      <Toggle
        {...args}
        onChange={handleChange}
      />
    )
  },
}

/**
 * All sizes side by side
 */
export const Sizes: Story = {
  render: () => (
    <div className="w-full flex gap-8">
      <Toggle
        label="Small"
        size="sm"
      />
      <Toggle
        checked
        label="Medium"
        size="md"
      />
      <Toggle
        label="Large"
        size="lg"
      />
    </div>
  ),
}

/**
 * Disabled state demo
 */
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
    label: "Disabled toggle",
  },
}
