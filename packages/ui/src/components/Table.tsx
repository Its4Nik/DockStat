import type { ReactNode } from 'react'

interface defaultProps {
  children: ReactNode
  className?: string
}

export const Table = ({ children, className = '' }: defaultProps) => (
  <table
    className={`w-full rounded-table-radius overflow-hidden ${className}`}
  >
    {children}
  </table>
)

export const TableHead = ({ children, className = '' }: defaultProps) => (
  <thead className={`bg-table-header-bg ${className}`}>
    {children}
  </thead>
)

export const TableBody = ({ children, className = '' }: defaultProps) => (
  <tbody
    className={`bg-table-body-bg divide-y divide-table-divider ${className}`}
  >
    {children}
  </tbody>
)

export const TableRow = ({ children, className = '' }: defaultProps) => (
  <tr className={className}>{children}</tr>
)

interface cell extends defaultProps {
  header?: boolean
}
export const TableCell = ({
  children,
  className = '',
  header = false,
}: cell) => {
  const Component = header ? 'th' : 'td'
  return (
    <Component
      className={`px-table-cell-padding-x py-table-cell-padding-y text-table-cell-font-size ${className}`}
    >
      {children}
    </Component>
  )
}
