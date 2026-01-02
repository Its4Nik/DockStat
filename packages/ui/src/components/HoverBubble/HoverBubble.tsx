import { ArrowBigDown } from "lucide-react"
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
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
  }

  const arrowClasses: Record<"top" | "bottom" | "left" | "right", string> = {
    top: "left-1/2 -translate-x-1/2 top-full -mt-1",
    bottom: "left-1/2 -translate-x-1/2 bottom-full -mb-1 rotate-180",
    left: "top-1/2 -translate-y-1/2 left-full -ml-1 -rotate-90",
    right: "top-1/2 -translate-y-1/2 right-full -mr-1 rotate-90",
  }

  return (
    <div className="relative inline-block group">
      {children}

      <div
        role="tooltip"
        className={`
          absolute z-50
          opacity-0 scale-95
          group-hover:opacity-100 group-hover:scale-100
          transition-all duration-200 ease-out
          motion-safe:transform-gpu
          pointer-events-none
          bg-hover-bubble-bg text-hover-bubble-text text-xs font-medium
          rounded-md px-3 py-2 whitespace-pre-line
          shadow-2xl
          max-w-[min(16rem,calc(100vw-18rem))]
          ${positionClasses[position]} ${className}
        `}
      >
        {label}

        <ArrowBigDown
          className={`absolute text-hover-bubble-bg w-4 h-4 ${arrowClasses[position]}`}
        />
      </div>
    </div>
  )
}
