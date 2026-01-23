import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { AssetTypeBreakdownV2 } from '../../types/portfolioV2'

interface AllocationData {
  name: string
  value: number
  color: string
}

interface AssetAllocationChartProps {
  breakdown?: Record<string, AssetTypeBreakdownV2>
  isLoading?: boolean
}

const COLORS: Record<string, string> = {
  'MUTUAL_FUND': '#3B82F6',    // blue
  'EQUITY_STOCK': '#8B5CF6',   // purple
  'CRYPTOCURRENCY': '#F97316', // orange
  'GOLD_PHYSICAL': '#EAB308',  // yellow
  'REAL_ESTATE': '#10B981',    // green
  'FIXED_DEPOSIT': '#6366F1'   // indigo
}

const ASSET_LABELS: Record<string, string> = {
  'MUTUAL_FUND': 'Mutual Funds',
  'EQUITY_STOCK': 'Stocks',
  'CRYPTOCURRENCY': 'Crypto',
  'GOLD_PHYSICAL': 'Gold',
  'REAL_ESTATE': 'Property',
  'FIXED_DEPOSIT': 'Fixed Income'
}

export function AssetAllocationChart({ breakdown, isLoading = false }: AssetAllocationChartProps) {
  // Transform breakdown into chart data
  const data: AllocationData[] = breakdown
    ? Object.entries(breakdown)
        .map(([assetType, data]) => ({
          name: ASSET_LABELS[assetType] || assetType,
          value: data.current_value,
          color: COLORS[assetType] || '#6B7280' // gray fallback
        }))
        .filter(item => item.value > 0) // Filter out 0 value assets
    : []

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
        <div className="bg-gray-950 border border-gray-900 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-300">
            {data.name}
          </p>
          <p className="text-lg font-bold text-gray-200">
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-gray-400">
            {data.payload.percentage}% of total
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

  // Calculate total and add percentage to each item
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercent = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1) // renamed to avoid conflict with Recharts' percent prop
  }))

  if (isLoading) {
    return (
      <div className="bg-gray-950 border border-gray-900 rounded-lg p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-300 mb-4">
          Asset Allocation
        </h3>
        <div className="h-60 md:h-80 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-gray-700"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-950 border border-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          Asset Allocation
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p className="text-sm">No asset data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">
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
                {value} ({entry.payload.percentage}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
