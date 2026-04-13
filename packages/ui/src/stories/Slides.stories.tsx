import type { Meta, StoryObj } from "@storybook/react-vite"
import { Slides } from "../components/Slides/Slides"

const meta: Meta<typeof Slides> = {
  argTypes: {
    buttonPosition: {
      control: "select",
      options: ["left", "center", "right"],
    },
    connected: {
      control: "boolean",
    },
  },
  component: Slides,
  parameters: {
    layout: "padded",
  },
  title: "Components/Slides",
}

export default meta
type Story = StoryObj<typeof Slides>

const sampleSlides = {
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
  Overview: (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-primary-text mb-2">Overview</h3>
      <p className="text-secondary-text">
        This is the overview section. It provides a high-level summary of the content.
      </p>
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
    <Slides
      description="A tabbed interface with animated transitions"
      header="Slide Component"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionLeft: Story = {
  render: () => (
    <Slides
      buttonPosition="left"
      description="Button row positioned on the left"
      header="Left Aligned Buttons"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionCenter: Story = {
  render: () => (
    <Slides
      buttonPosition="center"
      description="Button row positioned in the center"
      header="Center Aligned Buttons"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ButtonPositionRight: Story = {
  render: () => (
    <Slides
      buttonPosition="right"
      description="Button row positioned on the right"
      header="Right Aligned Buttons"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ConnectedButtons: Story = {
  render: () => (
    <Slides
      buttonPosition="left"
      connected={true}
      description="Buttons with no gaps and shared borders (tab-style)"
      header="Connected Button Style"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ConnectedButtonsCentered: Story = {
  render: () => (
    <Slides
      buttonPosition="center"
      connected={true}
      description="Connected buttons positioned in the center"
      header="Connected & Centered"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const WithDefaultSlide: Story = {
  render: () => (
    <Slides
      defaultSlide="Details"
      description="Opens with 'Details' tab selected by default"
      header="Default Slide Set"
    >
      {sampleSlides}
    </Slides>
  ),
}

export const ManySlides: Story = {
  render: () => (
    <Slides
      buttonPosition="center"
      connected={true}
      description="Component with multiple slides"
      header="Many Slides Example"
    >
      {{
        About: <div className="p-4 text-secondary-text">Learn about us here</div>,
        Contact: <div className="p-4 text-secondary-text">Get in touch with us</div>,
        Home: <div className="p-4 text-secondary-text">Welcome to the home section</div>,
        Portfolio: <div className="p-4 text-secondary-text">View our work</div>,
        Services: <div className="p-4 text-secondary-text">Explore our services</div>,
      }}
    </Slides>
  ),
}

export const MinimalHeaderOnly: Story = {
  render: () => (
    <Slides
      buttonPosition="right"
      connected={true}
      header="Header Only"
    >
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
