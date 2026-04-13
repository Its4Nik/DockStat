import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowLeft, ArrowRight, Link } from "lucide-react"
import { LinkWithIcon } from "../components/Link/Link"

const meta: Meta<typeof LinkWithIcon> = {
  argTypes: {
    external: { control: "boolean" },
    iconPosition: { control: "radio", options: ["left", "right"] },
    label: { control: "text" },
  },
  component: LinkWithIcon,
  title: "Navigation/LinkWithIcon",
}

export default meta

type Story = StoryObj<typeof LinkWithIcon>

export const LeftIcon: Story = {
  args: {
    href: "https://example.com",
    icon: <Link />,
    iconPosition: "left",
    label: "Visit Docs",
  },
}

export const RightIcon: Story = {
  args: {
    href: "#",
    icon: <ArrowRight />,
    iconPosition: "right",
    label: "Continue",
  },
}

export const ExternalLink: Story = {
  args: {
    external: true,
    href: "https://example.com",
    icon: <ArrowLeft />,
    iconPosition: "right",
    label: "External Resource",
  },
}
