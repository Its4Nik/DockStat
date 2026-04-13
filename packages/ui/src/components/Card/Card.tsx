import type React from "react"
import type { MouseEventHandler, ReactNode } from "react"

export type CardVariant =
  | "default"
  | "outlined"
  | "elevated"
  | "flat"
  | "dark"
  | "error"
  | "success"
  | "custom"

export type CardSize = "xs" | "sm" | "md" | "lg"

export interface CardProps {
  children: ReactNode
  variant?: CardVariant
  size?: CardSize
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  hoverable?: boolean
  glass?: boolean
  tabIndex?: number
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  onClick,
  hoverable = false,
  glass,
  tabIndex,
}) => {
  const baseClasses = "shadow-xl rounded-lg transition-all duration-200"

  const variantClasses: Record<CardVariant, string> = {
    custom: "",
    dark: "border border-card-outlined-border/20 bg-main-bg text-secondary-text",
    default: "bg-card-default-bg border border-card-default-border text-primary-text",
    elevated: "bg-card-elevated-bg shadow-2xl text-primary-text",
    error: "border border-error bg-main-bg text-secondary-text",
    flat: "bg-card-flat-bg border-none text-muted-text",
    outlined: "border border-card-outlined-border bg-main-bg text-secondary-text",
    success: "border border-success bg-main-bg text-secondary-text",
  }

  const glassVariantClasses: Record<CardVariant, string> = {
    custom: "",
    dark: "border border-card-outlined-border/20 bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    default:
      "bg-card-default-bg/20 backdrop-blur-lg border border-card-default-border text-primary-text",
    elevated: "bg-card-elevated-bg/20 backdrop-blur-lg shadow-2xl text-primary-text",
    error: "border border-error bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    flat: "bg-card-flat-bg/20 backdrop-blur-lg border-none text-muted-text",
    outlined:
      "border border-card-outlined-border bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    success: "border border-success bg-main-bg/20 backdrop-blur-lg text-secondary-text",
  }

  const sizeClasses: Record<CardSize, string> = {
    lg: "p-8",
    md: "p-6",
    sm: "p-3",
    xs: "p-1",
  }

  const hoverClasses = hoverable
    ? `hover:shadow-lg ${variant === "outlined" ? "hover:border-1" : ""}`
    : ""

  const classes = `${baseClasses} ${glass ? glassVariantClasses[variant] : variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${className}`

  if (onClick) {
    return (
      <button
        className={`${classes} cursor-pointer hover:text-muted-text`}
        onClick={onClick}
        tabIndex={tabIndex}
        type="button"
      >
        {children}
      </button>
    )
  }

  return (
    <div
      className={classes}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  )
}

export { CardBody, type CardBodyProps } from "./CardBody"
export { CardFooter, type CardFooterProps } from "./CardFooter"
export { CardHeader, type CardHeaderProps } from "./CardHeader"
