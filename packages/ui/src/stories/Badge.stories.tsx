import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "../components/Badge/Badge"

type Story = StoryObj<typeof Badge>

const meta: Meta<typeof Badge> = {
  component: Badge,
  title: "Components/Badge",
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
        <Badge
          outlined
          variant="primary"
        >
          {" "}
          Primary{" "}
        </Badge>
        <Badge
          outlined
          variant="secondary"
        >
          {" "}
          Secondary{" "}
        </Badge>
        <Badge
          outlined
          variant="success"
        >
          {" "}
          Success{" "}
        </Badge>
        <Badge
          outlined
          variant="warning"
        >
          {" "}
          Warning{" "}
        </Badge>
        <Badge
          outlined
          variant="error"
        >
          {" "}
          Error{" "}
        </Badge>
      </div>
    </div>
  ),
}
