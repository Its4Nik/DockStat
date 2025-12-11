import type { Meta, StoryObj } from "@storybook/react-vite"
import { LinkWithIcon } from "../components/Link/Link"
import { ArrowLeft, ArrowRight, Link } from "lucide-react"

const meta: Meta<typeof LinkWithIcon> = {
  title: "Navigation/LinkWithIcon",
  component: LinkWithIcon,
  argTypes: {
    label: { control: "text" },
    iconPosition: { control: "radio", options: ["left", "right"] },
    external: { control: "boolean" },
  },
}

export default meta

type Story = StoryObj<typeof LinkWithIcon>

export const LeftIcon: Story = {
  args: {
    label: "Visit Docs",
    href: "https://example.com",
    icon: <Link />,
    iconPosition: "left",
  },
}

export const RightIcon: Story = {
  args: {
    label: "Continue",
    href: "#",
    icon: <ArrowRight />,
    iconPosition: "right",
  },
}

export const ExternalLink: Story = {
  args: {
    label: "External Resource",
    href: "https://example.com",
    external: true,
    icon: <ArrowLeft />,
    iconPosition: "right",
  },
}
