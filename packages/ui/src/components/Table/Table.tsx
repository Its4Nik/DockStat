import type React from 'react';

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Table = <T,>({
  data,
  columns,
  className = '',
  striped = false,
  bordered = false,
  hoverable = false,
  size = 'md',
}: TableProps<T>): React.ReactElement => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const tableClasses = "min-w-full divide-y divide-table-head-divide";

  const theadClasses = 'bg-table-head-bg';

  const tbodyClasses = "bg-table-body-bg divide-y divide-table-body-divide";

  return (
    <div className={`overflow-hidden shadow-sm rounded-lg ${bordered ? 'border border-table-border' : ''} ${className}`}>
      <table className={tableClasses}>
        <thead className={theadClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`${sizeClasses[size]} font-semibold text-table-head-text text-${column.align || 'left'}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={tbodyClasses}>
          {data.map((record, index) => (
            <tr key={String(record)} className={`${hoverable ? 'transition-colors duration-150 cursor-pointer hover:bg-table-body-hover hover:cursor-default' : ''} ${striped ? `${index % 2 === 0 ? "bg-table-body-stripe" : ""}` : ""}`}>
              {columns.map((column) => (
                <td
                  key={column.key as string}
                  className={`${sizeClasses[size]} text-${column.align || 'left'} text-table-body-text`}
                >
                  {column.render
                    ? column.render(record[column.key], record)
                    : String(record[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
