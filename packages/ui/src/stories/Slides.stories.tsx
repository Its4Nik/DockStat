import type { Meta, StoryObj } from "@storybook/react-vite"
import { Slides } from "../components/Slides/Slides"

const meta: Meta<typeof Slides> = {
  title: "Components/Slides",
  component: Slides,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    buttonPosition: {
      control: "select",
      options: ["left", "center", "right"],
    },
    connected: {
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<typeof Slides>

const sampleSlides = {
  Overview: (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-primary-text mb-2">Overview</h3>
      <p className="text-secondary-text">
        This is the overview section. It provides a high-level summary of the content.
      </p>
    </div>
  ),
  Details: (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-primary-text mb-2">Details</h3>
      <p className="text-secondary-text">
        Here you'll find detailed information about the topic. This section dives deeper into
        specifics.
      </p>
      <ul className="list-disc list-inside mt-2 text-secondary-text">
        <li>Feature one</li>
        <li>Feature two</li>
        <li>Feature three</li>
      </ul>
    </div>
  ),
  Settings: (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-primary-text mb-2">Settings</h3>
      <p className="text-secondary-text">
        Configure your preferences in this section. Adjust settings to customize your experience.
      </p>
    </div>
  ),
}

export const Default: Story = {
  render: () => (
    <Slides header="Slide Component" description="A tabbed interface with animated transitions">
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionLeft: Story = {
  render: () => (
    <Slides
      header="Left Aligned Buttons"
      description="Button row positioned on the left"
      buttonPosition="left"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionCenter: Story = {
  render: () => (
    <Slides
      header="Center Aligned Buttons"
      description="Button row positioned in the center"
      buttonPosition="center"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionRight: Story = {
  render: () => (
    <Slides
      header="Right Aligned Buttons"
      description="Button row positioned on the right"
      buttonPosition="right"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ConnectedButtons: Story = {
  render: () => (
    <Slides
      header="Connected Button Style"
      description="Buttons with no gaps and shared borders (tab-style)"
      connected={true}
      buttonPosition="left"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ConnectedButtonsCentered: Story = {
  render: () => (
    <Slides
      header="Connected & Centered"
      description="Connected buttons positioned in the center"
      connected={true}
      buttonPosition="center"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const WithDefaultSlide: Story = {
  render: () => (
    <Slides
      header="Default Slide Set"
      description="Opens with 'Details' tab selected by default"
      defaultSlide="Details"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ManySlides: Story = {
  render: () => (
    <Slides
      header="Many Slides Example"
      description="Component with multiple slides"
      connected={true}
      buttonPosition="center"
    >
      {{
        Home: <div className="p-4 text-secondary-text">Welcome to the home section</div>,
        About: <div className="p-4 text-secondary-text">Learn about us here</div>,
        Services: <div className="p-4 text-secondary-text">Explore our services</div>,
        Portfolio: <div className="p-4 text-secondary-text">View our work</div>,
        Contact: <div className="p-4 text-secondary-text">Get in touch with us</div>,
      }}
    </Slides>
  ),
}

export const MinimalHeaderOnly: Story = {
  render: () => (
    <Slides header="Header Only" buttonPosition="right" connected={true}>
      {{
        Tab1: <div className="p-4 text-secondary-text">Content for Tab 1</div>,
        Tab2: <div className="p-4 text-secondary-text">Content for Tab 2</div>,
      }}
    </Slides>
  ),
}

export const NoHeaderOrDescription: Story = {
  render: () => (
    <Slides buttonPosition="center">
      {{
        First: <div className="p-4 text-secondary-text">First slide content</div>,
        Second: <div className="p-4 text-secondary-text">Second slide content</div>,
        Third: <div className="p-4 text-secondary-text">Third slide content</div>,
      }}
    </Slides>
  ),
}

