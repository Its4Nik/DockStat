import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
  forwardRef,
} from 'react'

/**
 * HoverCard — compound component
 *
 * Usage:
 * <HoverCard>
 *   <HoverCard.Trigger>...</HoverCard.Trigger>
 *   <HoverCard.Content>...</HoverCard.Content>
 * </HoverCard>
 */

interface HoverCardProps {
  children: ReactNode
  /** Whether the card should open on hover/focus (default true). If false, you can still control via click on the trigger. */
  openOnHover?: boolean
  className?: string
}

type HoverCardContextType = {
  open: boolean
  openCard: () => void
  closeCard: () => void
  toggleCard: () => void
  openOnHover: boolean
}

const HoverCardContext = createContext<HoverCardContextType | null>(null)

export const HoverCard = ({ children, openOnHover = true, className = '' }: HoverCardProps) => {
  const [open, setOpen] = useState(false)
  const openRef = useRef<NodeJS.Timeout | null>(null)
  const closeRef = useRef<NodeJS.Timeout | null>(null)

  const openCard = () => {
    if (closeRef.current) {
      clearTimeout(closeRef.current)
      closeRef.current = null
    }
    if (!open) {
      // small debounce so quick pointer moves don't flash
      if (openRef.current) clearTimeout(openRef.current)
      openRef.current = setTimeout(() => setOpen(true), 80)
    }
  }

  const closeCard = () => {
    if (openRef.current) {
      clearTimeout(openRef.current)
      openRef.current = null
    }
    if (open) {
      if (closeRef.current) clearTimeout(closeRef.current)
      closeRef.current = setTimeout(() => setOpen(false), 120)
    }
  }

  const toggleCard = () => setOpen((s) => !s)

  // close on Escape globally when open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    return () => {
      if (openRef.current) clearTimeout(openRef.current)
      if (closeRef.current) clearTimeout(closeRef.current)
    }
  }, [])

  return (
    <HoverCardContext.Provider value={{ open, openCard, closeCard, toggleCard, openOnHover }}>
      <div
        className={`relative inline-block ${className}`}
        // If user hovers container directly, open/close appropriately
        onMouseEnter={() => openOnHover && openCard()}
        onMouseLeave={() => openOnHover && closeCard()}
      >
        {children}
      </div>
    </HoverCardContext.Provider>
  )
}

/* ---------- Trigger ---------- */

interface TriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export const Trigger = forwardRef<HTMLDivElement, TriggerProps>(({ children, className = '', ...rest }, ref) => {
  const ctx = useContext(HoverCardContext)
  if (!ctx) {
    console.warn('HoverCard.Trigger must be used inside a HoverCard')
    return <div {...rest} ref={ref}>{children}</div>
  }
  const { openCard, closeCard, toggleCard, openOnHover, open } = ctx

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={className}
      onMouseEnter={() => openOnHover && openCard()}
      onMouseLeave={() => openOnHover && closeCard()}
      onFocus={() => openCard()}
      onBlur={() => closeCard()}
      onClick={(e) => {
        // If openOnHover is false, allow click toggle behavior
        if (!openOnHover) {
          e.stopPropagation()
          toggleCard()
        }
      }}
      {...rest}
    >
      {children}
    </div>
  )
})
Trigger.displayName = 'HoverCard.Trigger'

/* ---------- Content ---------- */

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  /** optional prop to keep the content mounted even when closed */
  static?: boolean
}

export const Content = forwardRef<HTMLDivElement, ContentProps>(({ children, className = '', static: isStatic = false, ...rest }, ref) => {
  const ctx = useContext(HoverCardContext)
  if (!ctx) {
    console.warn('HoverCard.Content must be used inside a HoverCard')
    return <div {...rest} ref={ref}>{children}</div>
  }

  const { open, openCard, closeCard } = ctx

  // If static, always render (useful for fine-grained animation control)
  if (!isStatic && !open) return null

  return (
    <div
      ref={ref}
      // keep content open while pointer is over panel
      onMouseEnter={() => openCard()}
      onMouseLeave={() => closeCard()}
      onFocus={() => openCard()}
      onBlur={() => closeCard()}
      className={
        `absolute z-10 mt-2 whitespace-normal ` +
        `rounded-hovercard-radius ` +
        `bg-hovercard-bg ` +
        `p-hovercard-padding ` +
        `shadow-hovercard-shadow ` +
        className
      }
      {...rest}
    >
      {children}
    </div>
  )
})

Content.displayName = 'HoverCard.Content'

/* Attach subcomponents to main export for nice API */
HoverCard.Trigger = Trigger
HoverCard.Content = Content

export default HoverCard
