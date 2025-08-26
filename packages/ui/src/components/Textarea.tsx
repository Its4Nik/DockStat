export const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`rounded-components-textarea-radius border-components-textarea-border bg-components-textarea-bg px-components-textarea-padding-x py-components-textarea-padding-y text-components-textarea-font-size text-components-textarea-color focus:outline-none focus:ring-2 focus:ring-components-textarea-focus-ring ${className}`}
    {...props}
  />
)
