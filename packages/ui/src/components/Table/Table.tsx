import React from 'react';

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

  const tableClasses = `min-w-full divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`;

  const theadClasses = 'bg-gray-50';

  const tbodyClasses = "bg-white divide-y divide-gray-200";

  return (
    <div className={`overflow-hidden shadow-sm rounded-lg ${className}`}>
      <table className={tableClasses}>
        <thead className={theadClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                className={`${sizeClasses[size]} font-semibold text-gray-900 text-${column.align || 'left'}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={tbodyClasses}>
          {data.map((record, index) => (
            <tr key={index} className={`${hoverable ? 'transition-colors cursor-pointer hover:bg-gray-50 hover:cursor-default' : ''} ${striped ? `${index % 2 === 0 ? "bg-gray-100" : ""}` : ""}`}>
              {columns.map((column) => (
                <td
                  key={column.key as string}
                  className={`${sizeClasses[size]} text-${column.align || 'left'} text-gray-900`}
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
