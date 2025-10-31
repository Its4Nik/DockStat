import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '../components/Modal/Modal';
import { useArgs } from '@storybook/client-api';

const meta: Meta<typeof Modal> = {
  title: 'Feedback/Modal',
  component: Modal,
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Interactive: Story = {
  args: {
    open: false,
    title: 'Sample Modal',
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs();
    const toggle = () => updateArgs({ open: !args.open });

    return (
      <div className="p-8">
        <button
          onClick={toggle}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Open Modal
        </button>
        <Modal {...args} onClose={() => updateArgs({ open: false })}>
          <p className="text-gray-700">
            This is a demo modal. Click outside or press “Close” to dismiss.
          </p>
        </Modal>
      </div>
    );
  },
};
