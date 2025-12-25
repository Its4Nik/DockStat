import { Check } from "lucide-react"
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
  <div className="flex items-center gap-3">
    {slides.map((slide, index) => {
      const isActive = index === currentIndex
      const isCompleted = index < currentIndex

      return (
        <button
          type="button"
          key={slide.title}
          onClick={() => onDotClick(index)}
          aria-label={`Go to step ${index + 1}: ${slide.title}`}
          aria-current={isActive ? "step" : undefined}
          className={`relative transition-all duration-300 ease-out
            ${isActive ? "w-10 h-3" : "w-3 h-3"}
            ${isActive ? "bg-white" : isCompleted ? "bg-green-500" : "bg-slate-600"}
            ${isActive ? "rounded-full" : "rounded-full"}
            ${!isActive && "hover:scale-125 hover:bg-slate-400"}
            ${isActive && "scale-110"}
          `}
        >
          {/* Active indicator glow */}
          {isActive && (
            <span className="absolute inset-0 rounded-full bg-white/50 blur-sm animate-pulse" />
          )}

          {/* Completed checkmark (optional subtle indicator) */}
          {isCompleted && !isActive && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Check size={16} />
            </span>
          )}
        </button>
      )
    })}
  </div>
)
