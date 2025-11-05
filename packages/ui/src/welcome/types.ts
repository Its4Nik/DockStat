import type { JSX } from "react/jsx-dev-runtime";

interface Slide {
  title: string;
  subtitle?: string;
  icon?: JSX.Element;
  bullets?: { title: string; desc?: string }[];
  footer?: JSX.Element;
}

interface OnboardingProps {
  setOnBoardingComplete: (v: boolean) => void;
}

export type {
  OnboardingProps,
  Slide
}
