import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface AllocationData {
  name: string
  value: number
  color: string
}

interface AssetAllocationChartProps {
  data?: AllocationData[]
  isLoading?: boolean
}

const COLORS = {
  'mutual-funds': '#3B82F6',  // blue
  'stocks': '#8B5CF6',         // purple
  'crypto': '#F97316',         // orange
  'gold': '#EAB308',           // yellow
  'property': '#10B981',       // green
  'fixed-income': '#6366F1'    // indigo
}

const DEFAULT_DATA: AllocationData[] = [
  { name: 'Mutual Funds', value: 45, color: COLORS['mutual-funds'] },
  { name: 'Stocks', value: 25, color: COLORS['stocks'] },
  { name: 'Crypto', value: 10, color: COLORS['crypto'] },
  { name: 'Gold', value: 8, color: COLORS['gold'] },
  { name: 'Property', value: 7, color: COLORS['property'] },
  { name: 'Fixed Income', value: 5, color: COLORS['fixed-income'] }
]

export function AssetAllocationChart({ data = DEFAULT_DATA, isLoading = false }: AssetAllocationChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`
    return `₹${value.toFixed(0)}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.payload.percent}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show label if less than 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Calculate total and add percent to each item
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercent = data.map(item => ({
    ...item,
    percent: ((item.value / total) * 100).toFixed(1)
  }))

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Asset Allocation
        </h3>
        <div className="h-60 md:h-80 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Asset Allocation
      </h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={dataWithPercent}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithPercent.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value} ({entry.payload.percent}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
