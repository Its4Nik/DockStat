import type { Meta, StoryFn } from "@storybook/react-vite"
import { useState } from "react"
import { Slider, type SliderProps } from "../components/Slider/Slider"

export default {
  argTypes: {
    max: { control: "number" },
    min: { control: "number" },
    step: { control: "number" },
  },
  component: Slider,
  tags: ["autodocs"],
  title: "Components/Slider",
} as Meta<typeof Slider>

const Template: StoryFn<typeof Slider> = (args: SliderProps) => {
  const [value, setValue] = useState(args.value ?? 50)
  return (
    <Slider
      {...args}
      onChange={setValue}
      value={value}
    />
  )
}

export const Default = Template.bind({})
Default.args = {
  max: 100,
  min: 0,
  showTicks: true,
  step: 1,
  value: 50,
}
