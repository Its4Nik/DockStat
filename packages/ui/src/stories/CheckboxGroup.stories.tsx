import { useArgs } from "@storybook/client-api"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CheckboxGroup } from "../components/Forms/CheckboxGroup"

const meta: Meta<typeof CheckboxGroup> = {
  title: "Inputs/CheckboxGroup",
  component: CheckboxGroup,
  argTypes: {
    direction: {
      control: "radio",
      options: ["horizontal", "vertical"],
      defaultValue: "vertical",
    },
  },
}

export default meta

type Story = StoryObj<typeof CheckboxGroup>

const sampleOptions = [
  { value: "apple", label: "Apple" },
  { value: "orange", label: "Orange" },
  { value: "banana", label: "Banana" },
  { value: "grape", label: "Grape", disabled: true },
]

/**
 * Interactive — uses useArgs to make controls update live
 */
export const Vertical: Story = {
  args: {
    options: sampleOptions,
    selectedValues: ["apple"],
    direction: "vertical",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()

    const handleChange = (values: string[]) => {
      updateArgs({ selectedValues: values })
    }

    return <CheckboxGroup direction="vertical" {...args} onChange={handleChange} />
  },
}

/**
 * Horizontal layout demo
 */
export const Horizontal: Story = {
  args: {
    options: sampleOptions,
    selectedValues: ["orange", "banana"],
    direction: "horizontal",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    return <CheckboxGroup {...args} onChange={(v) => updateArgs({ selectedValues: v })} />
  },
}

/**
 * Disabled option example
 */
export const WithDisabled: Story = {
  args: {
    options: sampleOptions,
    selectedValues: ["grape"],
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    return <CheckboxGroup {...args} onChange={(v) => updateArgs({ selectedValues: v })} />
  },
}
