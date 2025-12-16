import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "../components/Badge/Badge"

type Story = StoryObj<typeof Badge>

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
}

export default meta

export const AllBadges: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="space-x-2">
        <Badge variant="primary"> Primary </Badge>
        <Badge variant="secondary"> Secondary </Badge>
        <Badge variant="success"> Success </Badge>
        <Badge variant="warning"> Warning </Badge>
        <Badge variant="error"> Error </Badge>
      </div>
      <div className="space-x-2">
        <Badge variant="primary" outlined>
          {" "}
          Primary{" "}
        </Badge>
        <Badge variant="secondary" outlined>
          {" "}
          Secondary{" "}
        </Badge>
        <Badge variant="success" outlined>
          {" "}
          Success{" "}
        </Badge>
        <Badge variant="warning" outlined>
          {" "}
          Warning{" "}
        </Badge>
        <Badge variant="error" outlined>
          {" "}
          Error{" "}
        </Badge>
      </div>
    </div>
  ),
}
