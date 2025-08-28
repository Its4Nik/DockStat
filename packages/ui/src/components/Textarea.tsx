export const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`rounded-textarea-radius border-textarea-border bg-textarea-bg px-textarea-padding-x py-textarea-padding-y text-textarea-font-size text-textarea-color focus:outline-none focus:ring-2 focus:ring-textarea-focus-ring ${className}`}
    {...props}
  />
)
