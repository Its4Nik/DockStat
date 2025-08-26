import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import type { ReactNode } from 'react'

interface HoverCardProps {
  trigger: ReactNode
  content: ReactNode
  className?: string
}

export const HoverCard = ({
  trigger,
  content,
  className = '',
}: HoverCardProps) => (
  <Popover className={`relative ${className}`}>
    <PopoverButton as="div">{trigger}</PopoverButton>
    <PopoverPanel className="absolute z-10 mt-2 rounded-components-hovercard-radius bg-components-hovercard-bg p-components-hovercard-padding shadow-components-hovercard-shadow">
      {content}
    </PopoverPanel>
  </Popover>
)
