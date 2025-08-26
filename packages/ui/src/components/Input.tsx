export const Input = ({ className = '', ...props }) => (
  <input
    className={`rounded-components-input-radius border-components-input-border bg-components-input-bg px-components-input-padding-x py-components-input-padding-y text-components-input-font-size text-components-input-color focus:outline-none focus:ring-2 focus:ring-components-input-focus-ring ${className}`}
    {...props}
  />
)
