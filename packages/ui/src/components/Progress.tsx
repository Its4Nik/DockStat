export const Progress = ({ value = 0, max = 100, className = '' }) => (
  <div
    className={`w-full bg-components-progress-bg rounded-components-progress-radius ${className}`}
  >
    <progress
      className="h-full bg-components-progress-bar-bg transition-all duration-300 rounded-components-progress-radius"
      style={{ width: `${(value / max) * 100}%` }}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    />
  </div>
)
