export const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseClasses =
    'inline-flex px-components-badge-padding-x py-components-badge-padding-y text-components-badge-font-size font-medium rounded-components-badge-radius'
  const variants = {
    default:
      'bg-components-badge-default-bg text-components-badge-default-color',
    success:
      'bg-components-badge-success-bg text-components-badge-success-color',
    warning:
      'bg-components-badge-warning-bg text-components-badge-warning-color',
    error: 'bg-components-badge-error-bg text-components-badge-error-color',
  }

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
