import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "../components/Forms/Input"

const meta: Meta<typeof Input> = {
  component: Input,
  title: "Inputs/Input",
}

export default meta
type Story = StoryObj<typeof Input>

export const AllInputs: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Input placeholder="Default input" />
      <Input
        placeholder="Filled input"
        variant="filled"
      />
      <Input
        placeholder="Underline input"
        variant="underline"
      />
      <Input
        error
        placeholder="Error state"
      />
      <Input
        placeholder="Success state"
        success
      />
      <Input
        disabled
        placeholder="Disabled input"
      />
    </div>
  ),
}
