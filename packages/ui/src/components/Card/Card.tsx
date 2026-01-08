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

export type CardSize = "xs" | "sm" | "md" | "lg"

export interface CardProps {
  children: ReactNode
  variant?: CardVariant
  size?: CardSize
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  hoverable?: boolean
  glass?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  onClick,
  hoverable = false,
  glass,
}) => {
  const baseClasses = "shadow-xl rounded-lg transition-all duration-200"

  const variantClasses: Record<CardVariant, string> = {
    default: "bg-card-default-bg border border-card-default-border text-primary-text",
    outlined: "border border-card-outlined-border bg-main-bg text-secondary-text",
    elevated: "bg-card-elevated-bg shadow-2xl text-primary-text",
    flat: "bg-card-flat-bg border-none text-muted-text",
    dark: "border border-card-outlined-border/20 bg-main-bg text-secondary-text",
    error: "border border-error bg-main-bg text-secondary-text",
    success: "border border-success bg-main-bg text-secondary-text",
  }

  const glassVariantClasses: Record<CardVariant, string> = {
    default:
      "bg-card-default-bg/20 backdrop-blur-lg border border-card-default-border text-primary-text",
    outlined:
      "border border-card-outlined-border bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    elevated: "bg-card-elevated-bg/20 backdrop-blur-lg shadow-2xl text-primary-text",
    flat: "bg-card-flat-bg/20 backdrop-blur-lg border-none text-muted-text",
    dark: "border border-card-outlined-border/20 bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    error: "border border-error bg-main-bg/20 backdrop-blur-lg text-secondary-text",
    success: "border border-success bg-main-bg/20 backdrop-blur-lg text-secondary-text",
  }

  const sizeClasses: Record<CardSize, string> = {
    xs: "p-1",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  }

  const hoverClasses = hoverable
    ? `hover:shadow-lg ${variant === "outlined" ? "hover:border-1" : ""}`
    : ""

  const classes = `${baseClasses} ${glass ? glassVariantClasses[variant] : variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${className}`

  if (onClick) {
    return (
      <button
        type="button"
        className={`${classes} cursor-pointer hover:text-muted-text`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  return <div className={classes}>{children}</div>
}

export { CardBody, type CardBodyProps } from "./CardBody"
export { CardFooter, type CardFooterProps } from "./CardFooter"
export { CardHeader, type CardHeaderProps } from "./CardHeader"
