export const Input = ({ className = '', ...props }) => (
  <input
    className={`rounded-input-radius border-input-border bg-input-bg px-input-padding-x py-input-padding-y text-input-font-size text-input-color focus:outline-none focus:ring-2 focus:ring-input-focus-ring ${className}`}
    {...props}
  />
)
