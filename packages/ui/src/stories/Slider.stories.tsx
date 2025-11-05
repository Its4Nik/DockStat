import { useState } from "react";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { Slider, type SliderProps, } from '../components/Slider/Slider';

export default {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
} as Meta<typeof Slider>;

const Template: StoryFn<typeof Slider> = (args: SliderProps) => {
  const [value, setValue] = useState(args.value ?? 50);
  return <Slider {...args} value={value} onChange={setValue} />;
};

export const Default = Template.bind({});
Default.args = {
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  showTicks: true,
};
