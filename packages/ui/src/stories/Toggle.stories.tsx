import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from '../components/Forms/Toggle';
import { useArgs } from '@storybook/client-api';

const meta: Meta<typeof Toggle> = {
  title: 'Inputs/Toggle',
  component: Toggle,
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      defaultValue: 'md',
    },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Toggle>;

/**
 * Interactive toggle
 */
export const Interactive: Story = {
  args: {
    checked: false,
    size: 'md',
    label: 'Enable notifications',
  },
  render: (args) => {
    // eslint-disable-next-line
    const [, updateArgs] = useArgs();

    const handleChange = (checked: boolean) => {
      updateArgs({ checked });
      args.onChange?.(checked);
    };

    return <Toggle {...args} onChange={handleChange} />;
  },
};

/**
 * All sizes side by side
 */
export const Sizes: Story = {
  render: () => (
    <div className="w-full flex gap-8">
      <Toggle size="sm" label="Small" />
      <Toggle size="md" label="Medium" checked />
      <Toggle size="lg" label="Large" />
    </div>
  ),
};

/**
 * Disabled state demo
 */
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled toggle',
  },
};
