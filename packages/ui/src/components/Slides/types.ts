export type ButtonRowPosition = "left" | "center" | "right"
export type SlideVariant = "default" | "minimal"

export interface SlidesProps {
  children: Record<string, React.ReactNode>
  header?: string
  description?: string | React.ReactNode
  buttonPosition?: ButtonRowPosition
  connected?: boolean
  defaultSlide?: string
  selectedSlide?: string
  onSlideChange?: (slideKey: string | null) => void
  hideable?: boolean
  variant?: SlideVariant
  className?: string
  controlledSlide?: string | null
}
