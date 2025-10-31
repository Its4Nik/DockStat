import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card/Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardBody>
        <h3 className="text-lg font-semibold">Default Card</h3>
        <p className="text-gray-600">This is a default card with some content.</p>
      </CardBody>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default">
        <CardBody>Default Card</CardBody>
      </Card>
      <Card variant="outlined">
        <CardBody>Outlined Card</CardBody>
      </Card>
      <Card variant="elevated">
        <CardBody>Elevated Card</CardBody>
      </Card>
      <Card variant="flat">
        <CardBody>Flat Card</CardBody>
      </Card>
    </div>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
      </CardHeader>
      <CardBody>
        <p className="text-gray-600">This is the main content of the card.</p>
      </CardBody>
      <CardFooter>
        <p className="text-sm text-gray-500">Card footer</p>
      </CardFooter>
    </Card>
  ),
};
