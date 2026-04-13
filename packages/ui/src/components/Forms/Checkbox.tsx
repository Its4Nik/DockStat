import { Check, Minus } from "lucide-react"
import React from "react"

export type CheckboxSize = "sm" | "md" | "lg"
export type CheckboxVariant = "default" | "icon"

export interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: CheckboxSize
  label?: string
  className?: string
  indeterminate?: boolean
  id?: string
  name?: string
  value?: string
  "aria-label"?: string
  variant?: CheckboxVariant
  tickedIcon?: React.ReactNode
  unTickedIcon?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    checked = false,
    onChange,
    disabled = false,
    size = "md",
    label,
    className = "",
    indeterminate = false,
    id,
    name,
    value,
    variant = "default",
    ...rest
  } = props

  const internalRef = React.useRef<HTMLInputElement | null>(null)

  React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement, [])

  React.useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = Boolean(indeterminate)
    }
  }, [indeterminate])

  const sizeClasses: Record<CheckboxSize, string> = {
    lg: "w-6 h-6",
    md: "w-5 h-5",
    sm: "w-4 h-4",
  }

  const iconSizeClasses: Record<CheckboxSize, number> = {
    lg: 20,
    md: 16,
    sm: 12,
  }

  const baseClasses =
    "rounded border-checkbox-border text-checkbox-text focus:ring-checkbox-ring focus:ring-offset-0 disabled:opacity-50"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked)
  }

  const ariaChecked: "true" | "false" | "mixed" = indeterminate
    ? "mixed"
    : checked
      ? "true"
      : "false"

  const renderIcon = () => {
    if (indeterminate) {
      return (
        <Minus
          className="text-secondary-text"
          size={iconSizeClasses[size]}
        />
      )
    }

    if (checked) {
      if (props.tickedIcon) {
        return props.tickedIcon
      }
      return (
        <Check
          className="text-success"
          size={iconSizeClasses[size]}
        />
      )
    }
    return props.unTickedIcon ? props.unTickedIcon : null
  }

  return (
    <div
      aria-disabled={disabled}
      className={`inline-flex items-center ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {variant === "icon" ? (
        <div className="relative">
          <input
            aria-checked={ariaChecked}
            checked={checked}
            className={`${sizeClasses[size]} ${baseClasses} sr-only`}
            disabled={disabled}
            id={id}
            name={name}
            onChange={handleChange}
            ref={internalRef}
            type="checkbox"
            value={value}
            {...rest}
          />
          <div
            className={`${sizeClasses[size]} flex items-center justify-center rounded border-checkbox-border transition-colors ${
              disabled
                ? "bg-checkbox-disabled"
                : indeterminate
                  ? "bg-checkbox-indeterminate border-checkbox-indeterminate"
                  : checked
                    ? "bg-checkbox-checked border-checkbox-checked"
                    : "bg-checkbox-bg hover:bg-checkbox-hover"
            }`}
          >
            {renderIcon()}
          </div>
        </div>
      ) : (
        <input
          aria-checked={ariaChecked}
          checked={checked}
          className={`${sizeClasses[size]} ${baseClasses}`}
          disabled={disabled}
          id={id}
          name={name}
          onChange={handleChange}
          ref={internalRef}
          type="checkbox"
          value={value}
          {...rest}
        />
      )}
      {label && <span className="ml-2 text-checkbox-text">{label}</span>}
    </div>
  )
})

Checkbox.displayName = "Checkbox"
