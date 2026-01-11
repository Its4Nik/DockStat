import type React from "react"
import { NavLink, type NavLinkRenderProps } from "react-router"

export interface LinkWithIconProps {
  href: string
  children?: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  className?: string
  external?: boolean
  navLinkActive?: (props: NavLinkRenderProps) => string | undefined
  style?: React.CSSProperties
}

export const LinkWithIcon: React.FC<LinkWithIconProps> = ({
  href,
  children,
  icon,
  iconPosition = "left",
  className = "",
  external = false,
  navLinkActive,
  style,
}) => {
  const isLeft = icon && iconPosition === "left"
  const isRight = icon && iconPosition === "right"

  if (typeof navLinkActive === "function") {
    return (
      <NavLink
        to={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={navLinkActive}
        style={style}
      >
        {isLeft && <span className="mr-1">{icon}</span>}
        {children}
        {isRight && <span className="ml-1">{icon}</span>}
      </NavLink>
    )
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center text-icon-link-text hover:icon-link-text-hover transition-colors hover:underline ${className}`}
    >
      {isLeft && <span className="mr-1">{icon}</span>}
      {children}
      {isRight && <span className="ml-1">{icon}</span>}
    </a>
  )
}
