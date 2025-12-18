import type { Slide } from "./types"

const SlideHeader = ({
  slide,
  currentStep,
  totalSteps,
}: {
  slide: Slide
  currentStep: number
  totalSteps: number
}) => (
  <div className="flex items-start justify-between gap-6">
    <div className="flex items-start gap-6 flex-1">
      <div className="flex-shrink-0 p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg">
        {slide.icon}
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <h2 className="text-3xl font-bold tracking-tight">{slide.title}</h2>
        <p className="text-base text-slate-400 leading-relaxed max-w-2xl">{slide.subtitle}</p>
      </div>
    </div>
    <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
      <span className="text-sm font-medium text-slate-300">
        {currentStep + 1} / {totalSteps}
      </span>
    </div>
  </div>
)

export { SlideHeader }
