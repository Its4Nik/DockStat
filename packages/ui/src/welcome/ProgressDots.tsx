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
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
              </svg>
            </span>
          )}
        </button>
      )
    })}
  </div>
)
