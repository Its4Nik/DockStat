import { useEffect, useState } from "react"
import { Card } from "../Card/Card"

export type SliderProps = {
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  className?: string
  label?: string
  showValue?: boolean
  disabled?: boolean
  variant?: "gradient" | "solid"
  size?: "sm" | "md" | "lg"
}

const sliderBase = "absolute h-[50%] top-[25%] rounded-full transition-all duration-75"

const sliderStyles = {
  gradient: "bg-linear-to-r from-slider-gradient-from to-slider-gradient-to",
  solid: "bg-slider-solid-bg",
}

const sizes = {
  sm: "h-1",
  md: "h-3",
  lg: "h-5",
}

export const Slider = ({
  min = 0,
  max = 100,
  step = 1,
  value: externalValue,
  onChange,
  className = "",
  label = "",
  showValue = true,
  disabled = false,
  variant = "solid",
  size = "md",
}: SliderProps) => {
  const [internalValue, setInternalValue] = useState((min + max) / 2)
  const isControlled = externalValue !== undefined
  const value = isControlled ? externalValue : internalValue

  useEffect(() => {
    if (!isControlled) {
      setInternalValue((min + max) / 2)
    }
  }, [min, max, isControlled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    if (!isControlled) setInternalValue(newValue)
    onChange?.(newValue)
  }

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <Card className="px-2 py-1 text-sm font-medium">{label}</Card>}
          {showValue && (
            <Card className="px-2 py-1 text-sm font-medium" variant="default">
              {value}
            </Card>
          )}
        </div>
      )}

      {/* Slider pill container */}
      <div
        className={`relative w-full ${sizes[size]} rounded-full bg-slider-base-bg overflow-hidden`}
      >
        {/* Filled portion */}
        <div
          className={`${sliderBase} ${sliderStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Invisible input overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            absolute inset-0 w-full h-full opacity-0 cursor-pointer
            ${disabled ? "cursor-not-allowed" : ""}
          `}
        />

        {/* Knob */}
        <div
          className={`bg-transparent pointer-events-none
            ${disabled ? "cursor-not-allowed" : "cursor-auto"}
          `}
          style={{
            left: `calc(${percentage}% - 0.625rem)`, // centers knob
          }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-xs text-muted-text mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
