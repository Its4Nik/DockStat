import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../components/Forms/Input';

const meta: Meta<typeof Input> = {
  title: 'Inputs/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const AllInputs: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Input placeholder="Default input" />
      <Input variant="filled" placeholder="Filled input" />
      <Input variant="underline" placeholder="Underline input" />
      <Input error placeholder="Error state" />
      <Input success placeholder="Success state" />
      <Input disabled placeholder="Disabled input" />
    </div>
  ),
};
