export const Table = ({ children, className = '' }) => (
  <table
    className={`w-full rounded-components-table-radius overflow-hidden ${className}`}
  >
    {children}
  </table>
)

export const TableHead = ({ children, className = '' }) => (
  <thead className={`bg-components-table-header-bg ${className}`}>
    {children}
  </thead>
)

export const TableBody = ({ children, className = '' }) => (
  <tbody
    className={`bg-components-table-body-bg divide-y divide-components-table-divider ${className}`}
  >
    {children}
  </tbody>
)

export const TableRow = ({ children, className = '' }) => (
  <tr className={className}>{children}</tr>
)

export const TableCell = ({ children, className = '', header = false }) => {
  const Component = header ? 'th' : 'td'
  return (
    <Component
      className={`px-components-table-cell-padding-x py-components-table-cell-padding-y text-components-table-cell-font-size ${className}`}
    >
      {children}
    </Component>
  )
}
