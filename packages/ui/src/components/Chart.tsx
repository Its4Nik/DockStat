import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ChartData {
  name: string
  value: number
}

interface ChartProps {
  data: ChartData[]
  dataKey: string
  className?: string
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export const Chart = ({
  data,
  dataKey,
  className = '',
  title,
  xAxisLabel,
  yAxisLabel,
}: ChartProps) => {
  return (
    <div
      className={`bg-chart-bg rounded-chart-radius p-chart-padding ${className}`}
    >
      {title && (
        <h3 className="text-chart-title-font-size text-chart-title-color font-medium mb-4">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid-color, #e5e7eb)"
          />
          <XAxis
            dataKey="name"
            stroke="var(--chart-axis-color, #6b7280)"
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -5,
                    fill: 'var(--chart-label-color, #374151)',
                    fontSize: 12,
                  }
                : undefined
            }
          />
          <YAxis
            stroke="var(--chart-axis-color, #6b7280)"
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    fill: 'var(--chart-label-color, #374151)',
                    fontSize: 12,
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg, #ffffff)',
              borderColor: 'var(--chart-tooltip-border, #e5e7eb)',
              borderRadius: 'var(--chart-tooltip-radius, 0.375rem)',
              color: 'var(--chart-tooltip-color, #374151)',
            }}
          />
          <Legend />
          <Bar
            dataKey={dataKey}
            fill="var(--chart-bar-color, #3b82f6)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
