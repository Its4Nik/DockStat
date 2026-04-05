import { useArgs } from "@storybook/client-api"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CheckboxGroup } from "../components/Forms/CheckboxGroup"

const meta: Meta<typeof CheckboxGroup> = {
  argTypes: {
    direction: {
      control: "radio",
      defaultValue: "vertical",
      options: ["horizontal", "vertical"],
    },
  },
  component: CheckboxGroup,
  title: "Inputs/CheckboxGroup",
}

export default meta

type Story = StoryObj<typeof CheckboxGroup>

const sampleOptions = [
  { label: "Apple", value: "apple" },
  { label: "Orange", value: "orange" },
  { label: "Banana", value: "banana" },
  { disabled: true, label: "Grape", value: "grape" },
]

/**
 * Interactive — uses useArgs to make controls update live
 */
export const Vertical: Story = {
  args: {
    direction: "vertical",
    options: sampleOptions,
    selectedValues: ["apple"],
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()

    const handleChange = (values: string[]) => {
      updateArgs({ selectedValues: values })
    }

    return (
      <CheckboxGroup
        direction="vertical"
        {...args}
        onChange={handleChange}
      />
    )
  },
}

/**
 * Horizontal layout demo
 */
export const Horizontal: Story = {
  args: {
    direction: "horizontal",
    options: sampleOptions,
    selectedValues: ["orange", "banana"],
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    return (
      <CheckboxGroup
        {...args}
        onChange={(v) => updateArgs({ selectedValues: v })}
      />
    )
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
    return (
      <CheckboxGroup
        {...args}
        onChange={(v) => updateArgs({ selectedValues: v })}
      />
    )
  },
}
