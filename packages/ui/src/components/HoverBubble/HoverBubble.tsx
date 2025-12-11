import { Triangle } from "lucide-react"
import type { FC, ReactNode } from "react"

export interface HoverBubbleProps {
  label: string
  position?: "top" | "bottom" | "left" | "right"
  children: ReactNode
  className?: string
}

export const HoverBubble: FC<HoverBubbleProps> = ({
  label,
  position = "top",
  children,
  className = "",
}) => {
  const positionClasses: Record<"top" | "bottom" | "left" | "right", string> = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  }

  // Arrow placement - uses border trick for triangle
  const arrowClasses: Record<"top" | "bottom" | "left" | "right", string> = {
    top: "left-1/2 -translate-x-1/2 top-full",
    bottom: "left-1/2 -translate-x-1/2 bottom-full",
    left: "top-1/2 -translate-y-1/2 left-full",
    right: "top-1/2 -translate-y-1/2 right-full",
  }

  return (
    <div className="relative inline-block group">
      {children}

      {/* Tooltip container:
          - Uses opacity + transform for smooth transitions (not display)
          - pointer-events-none so it doesn't block the hover
          - role="tooltip" for accessibility
          - max-w clamps to min(16rem, calc(100vw - 2rem)) so it never overflows mobile
      */}
      <div
        role="tooltip"
        className={`
          absolute z-50
          opacity-0 scale-95 p-4
          group-hover:opacity-100 group-hover:scale-100
          transition-all duration-200 ease-out
          motion-safe:transform-gpu
          pointer-events-none
          bg-hover-bubble-bg text-hover-bubble-text text-xs font-medium
          rounded-md px-3 py-2 whitespace-pre-line flex-wrap-reverse
          shadow-2xl
          w-[min(16rem,calc(100vw-18rem))]
          ${positionClasses[position]} ${className}
        `}
      >
        <div className="relative">
          {/* label text */}
          <span className="block">{label}</span>

          {/* arrow: small triangle (keeps pointer-events-none) */}
          <Triangle className={`absolute text-hover-bubble-bg w-6 h-6 ${arrowClasses[position]}`} />
        </div>
      </div>
    </div>
  )
}
