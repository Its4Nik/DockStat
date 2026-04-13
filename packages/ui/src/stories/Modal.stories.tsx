import { useArgs } from "@storybook/client-api"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "../components/Badge/Badge"
import { Button } from "../components/Button/Button"
import { Modal } from "../components/Modal/Modal"

const meta: Meta<typeof Modal> = {
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
  },
  component: Modal,
  title: "Feedback/Modal",
}

export default meta

type Story = StoryObj<typeof Modal>

export const Interactive: Story = {
  args: {
    open: false,
    title: "Sample Modal",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    const toggle = () => updateArgs({ open: !args.open })

    return (
      <div>
        <Button onClick={toggle}>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => updateArgs({ open: false })}
        >
          <p>This is a demo modal. Click outside or press “Close” to dismiss.</p>
        </Modal>
      </div>
    )
  },
}

export const StringFooter: Story = {
  args: {
    footer: "Sample String footer",
    open: false,
    title: "String Footer",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    const toggle = () => updateArgs({ open: !args.open })

    return (
      <div>
        <Button onClick={toggle}>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => updateArgs({ open: false })}
        >
          <p>This is a demo modal. Click outside or press “Close” to dismiss.</p>
        </Modal>
      </div>
    )
  },
}

export const ElementFooter: Story = {
  args: {
    footer: <Badge variant="primary">Example Element</Badge>,
    open: false,
    title: "String Footer",
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs()
    const toggle = () => updateArgs({ open: !args.open })

    return (
      <div>
        <Button onClick={toggle}>Open Modal</Button>
        <Modal
          {...args}
          onClose={() => updateArgs({ open: false })}
        >
          <p>This is a demo modal. Click outside or press “Close” to dismiss.</p>
        </Modal>
      </div>
    )
  },
}
