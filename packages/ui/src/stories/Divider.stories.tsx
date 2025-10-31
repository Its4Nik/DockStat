import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '../components/Divider/Divider';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  argTypes: {
    variant: {
      control: 'radio',
      options: ['solid', 'dashed', 'dotted'],
      defaultValue: 'solid',
    },
    label: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

/**
 * Basic horizontal divider
 */
export const Default: Story = {
  args: {
    variant: 'solid',
  },
};

/**
 * Divider with centered label
 */
export const WithLabel: Story = {
  args: {
    label: 'Section Title',
    variant: 'solid',
  },
};

/**
 * Variants demo
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Divider variant="solid" />
      <Divider variant="dashed" />
      <Divider variant="dotted" />
      <Divider label="With Label" />
    </div>
  ),
};
