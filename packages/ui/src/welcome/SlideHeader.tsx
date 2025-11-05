import type { Slide } from "./types";

const SlideHeader = ({ slide, currentStep, totalSteps }: {
  slide: Slide;
  currentStep: number;
  totalSteps: number;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-md bg-slate-900 text-white">{slide.icon}</div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{slide.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400">{slide.subtitle}</p>
      </div>
    </div>
    <div className="text-xs sm:text-sm text-slate-500 mt-1">
      Step {currentStep + 1} / {totalSteps}
    </div>
  </div>
);

export {
  SlideHeader
}
