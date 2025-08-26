import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
}

export const Dropdown = ({ trigger, children }: DropdownProps) => (
  <Menu as="div" className="relative inline-block text-left">
    <MenuButton className="flex items-center">{trigger}</MenuButton>
    <Transition
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-components-dropdown-radius bg-components-dropdown-bg shadow-components-dropdown-shadow focus:outline-none">
        {children}
      </MenuItems>
    </Transition>
  </Menu>
)

interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export const DropdownItem = ({
  children,
  className = '',
  ...props
}: DropdownItemProps) => (
  <MenuItem>
    {({ active }: { active: boolean }) => (
      <button
        className={`${
          active
            ? 'bg-components-dropdown-item-hover-bg text-components-dropdown-item-hover-color'
            : ''
        } flex w-full items-center rounded-md px-4 py-2 text-sm ${className}`}
        {...props}
      >
        {children}
      </button>
    )}
  </MenuItem>
)
