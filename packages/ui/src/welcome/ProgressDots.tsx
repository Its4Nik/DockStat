import type { Slide } from "./types"

export const ProgressDots = ({
  slides,
  currentIndex,
  onDotClick,
}: {
  slides: Slide[]
  currentIndex: number
  onDotClick: (index: number) => void
}) => (
  <div className="flex items-center gap-2">
    {slides.map((slide, index) => (
      <button
        type="button"
        key={slide.title}
        onClick={() => onDotClick(index)}
        aria-label={`Go to step ${index + 1}`}
        className={`w-3 h-3 rounded-full transition-all ${index === currentIndex ? "bg-white scale-125" : index < currentIndex ? "bg-success" : "bg-gray-400"}`}
      />
    ))}
  </div>
)
