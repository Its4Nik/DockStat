import { useArgs } from "@storybook/client-api"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Checkbox } from "../components/Forms/Checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Inputs/Checkbox",
  component: Checkbox,
  argTypes: {
    checked: {
      defaultValue: false,
      control: "boolean",
    },
    disabled: {
      defaultValue: false,
      control: "boolean",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
    label: {
      control: "text",
    },
    indeterminate: { control: "boolean" },
    onChange: { action: "changed" },
  },
}

export default meta

type Story = StoryObj<typeof Checkbox>

/**
 * Interactive — updates Storybook Controls when toggled in Canvas.
 * Uses useArgs to mirror user interaction back into args.
 */
export const Interactive: Story = {
  args: {
    checked: false,
    label: "Interactive checkbox",
    size: "md",
  },
  render: (args) => {
    // useArgs must be called inside render
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()

    const handleChange = (nextChecked: boolean) => {
      // update controls + call any action arg
      updateArgs({ checked: nextChecked })
      args.onChange?.(nextChecked)
    }

    return <Checkbox {...args} onChange={handleChange} />
  },
}

/**
 * Uncontrolled example — local component state (doesn't touch story args).
 * Useful to show component behavior when used inside local-state components.
 */
export const Uncontrolled: Story = {
  render: (args) => {
    // eslint-disable-next-line
    const [checked, setChecked] = useState<boolean>(!!args.checked)

    return (
      <div className="space-y-2">
        <Checkbox
          {...args}
          checked={checked}
          onChange={(c) => {
            setChecked(c)
            args.onChange?.(c)
          }}
          label="Uncontrolled (local state)"
        />
        <div className="text-xs text-muted-text">
          Local state value: {checked ? "true" : "false"}
        </div>
      </div>
    )
  },
}

/**
 * Indeterminate story — shows initial indeterminate state and clears indeterminate
 * on first user interaction (common pattern).
 */
export const Indeterminate: Story = {
  args: {
    checked: false,
    indeterminate: true,
    label: "Indeterminate (click to clear)",
  },
  render: (args) => {
    // local state to simulate clearing indeterminate on first click
    // eslint-disable-next-line
    const [isIndeterminate, setIsIndeterminate] = useState<boolean>(!!args.indeterminate)
    // eslint-disable-next-line
    const [checked, setChecked] = useState<boolean>(!!args.checked)

    const handleChange = (c: boolean) => {
      // typical UX: clicking clears indeterminate and sets checked
      setIsIndeterminate(false)
      setChecked(c)
      args.onChange?.(c)
    }

    return (
      <Checkbox
        {...args}
        indeterminate={isIndeterminate}
        checked={checked}
        onChange={handleChange}
      />
    )
  },
}

/**
 * Sizes - show sm / md / lg together
 */
export const Sizes: Story = {
  render: (args) => {
    // eslint-disable-next-line
    const [s1, setS1] = useState(false)
    // eslint-disable-next-line
    const [s2, setS2] = useState(true)
    // eslint-disable-next-line
    const [s3, setS3] = useState(false)

    return (
      <div className="flex items-center gap-6 text-muted-text">
        <div className="inline-flex items-center gap-2">
          <Checkbox {...args} size="sm" checked={s1} onChange={setS1} />
          <span className="text-sm">sm</span>
        </div>

        <div className="inline-flex items-center gap-2">
          <Checkbox {...args} size="md" checked={s2} onChange={setS2} />
          <span className="text-sm">md</span>
        </div>

        <div className="inline-flex items-center gap-2">
          <Checkbox {...args} size="lg" checked={s3} onChange={setS3} />
          <span className="text-sm">lg</span>
        </div>
      </div>
    )
  },
}

/**
 * Disabled
 */
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
    label: "Disabled and checked",
  },
  render: (args) => <Checkbox {...args} onChange={(c) => args.onChange?.(c)} />,
}
