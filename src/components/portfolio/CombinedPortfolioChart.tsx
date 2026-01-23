import React, { useState, useMemo } from 'react'
import { Card } from '../common'
import { useCombinedHistory } from '../../hooks/useCombinedHistory'
import { DateRangeOption, DateRange } from '../../types/portfolioHistory'
import { formatCurrency } from '../../utils/formatters'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'

interface CombinedPortfolioChartProps {
  portfolioIds: number[]
  mode: 'single' | 'combined'
  assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK'
}

const DATE_RANGES: DateRange[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '90 Days', value: '90d', days: 90 },
  { label: '1 Year', value: '1y', days: 365 },
  { label: 'All Time', value: 'all' },
]

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

export function CombinedPortfolioChart({ portfolioIds, mode, assetType }: CombinedPortfolioChartProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('30d')
  const [visiblePortfolios, setVisiblePortfolios] = useState<Set<number>>(new Set())

  const { data: historyData, isLoading, error } = useCombinedHistory(portfolioIds, selectedRange, assetType)

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!historyData?.combined?.data_points) return []

    return historyData.combined.data_points.map((point, index) => {
      // Convert date array [year, month, day] to Date object
      const dateObj = new Date(point.date[0], point.date[1] - 1, point.date[2])
      const dataPoint: any = {
        date: dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: historyData.combined.data_points.length > 90 ? 'numeric' : undefined
        }),
        fullDate: dateObj.toISOString().split('T')[0],
        total: point.value,
      }

      // Add individual portfolio values from portfolios array
      if (mode === 'combined' && historyData.portfolios) {
        historyData.portfolios.forEach((portfolio) => {
          const portfolioPoint = portfolio.data_points[index]
          if (portfolioPoint) {
            dataPoint[`portfolio_${portfolio.id}`] = portfolioPoint.value
            dataPoint[`portfolio_${portfolio.id}_name`] = portfolio.name
          }
        })
      }

      return dataPoint
    })
  }, [historyData, mode])

  // Calculate Y-axis domain with padding to show variations better
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 'auto']
    
    const values = chartData.map(d => d.total).filter(v => v != null)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    
    // Add 5% padding on top and bottom to show variations clearly
    const padding = range * 0.05 || maxValue * 0.05 || 1000
    const domainMin = Math.max(0, minValue - padding)
    const domainMax = maxValue + padding
    
    return [Math.floor(domainMin), Math.ceil(domainMax)]
  }, [chartData])

  // Determine line color based on gain/loss
  const lineColor = useMemo(() => {
    if (chartData.length < 2) return '#3B82F6' // Default blue
    const startValue = chartData[0]?.total || 0
    const endValue = chartData[chartData.length - 1]?.total || 0
    return endValue >= startValue ? '#10B981' : '#EF4444' // Green for gain, Red for loss
  }, [chartData])

  // Get unique portfolios from the data
  const portfolios = useMemo(() => {
    if (!historyData?.portfolios || historyData.portfolios.length === 0) return []
    return historyData.portfolios.map((p) => ({
      id: p.id,
      name: p.name,
      color: COLORS[p.id % COLORS.length],
    }))
  }, [historyData])

  const togglePortfolio = (portfolioId: number) => {
    setVisiblePortfolios((prev) => {
      const next = new Set(prev)
      if (next.has(portfolioId)) {
        next.delete(portfolioId)
      } else {
        next.add(portfolioId)
      }
      return next
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="bg-gray-950 p-3 rounded-lg shadow-lg border border-gray-900">
        <p className="text-sm font-medium text-gray-300 mb-2">
          {payload[0]?.payload?.fullDate}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="font-medium text-gray-200">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-300">
              Portfolio Value History
            </h3>
          </div>
          <div className="h-60 md:h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-300">
              Portfolio Value History
            </h3>
          </div>
          <div className="text-center py-8 text-red-400">
            Failed to load chart data
          </div>
        </div>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300">
              Portfolio Value History
            </h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            No historical data available
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-4 md:p-6">
        {/* Header with Title and Date Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-base md:text-lg font-semibold text-gray-300">
              Portfolio Value History
            </h3>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex gap-1">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setSelectedRange(range.value)}
                  className={`px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    selectedRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-black text-gray-400 hover:bg-gray-950 border border-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Legend (for combined mode) */}
        {mode === 'combined' && portfolios.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={() => setVisiblePortfolios(new Set())}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-gray-900 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              Total
            </button>
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                onClick={() => togglePortfolio(portfolio.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  visiblePortfolios.has(portfolio.id)
                    ? 'bg-gray-950 border border-gray-800 text-gray-300'
                    : 'bg-black border border-gray-900 text-gray-500 hover:bg-gray-950 hover:text-gray-400'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: portfolio.color }}
                />
                <span>{portfolio.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-60 md:h-80 overflow-x-auto">
          <div className="min-w-[500px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-900" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-500"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs text-gray-500"
                tick={{ fill: 'currentColor' }}
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
                  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
                  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                  return `₹${value.toFixed(0)}`
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Total Line - Color changes based on gain/loss */}
              <Line
                type="monotone"
                dataKey="total"
                name="Total Value"
                stroke={lineColor}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />

              {/* Individual Portfolio Lines - Toggle based on selection */}
              {mode === 'combined' &&
                portfolios.map((portfolio) =>
                  visiblePortfolios.has(portfolio.id) ? (
                    <Line
                      key={portfolio.id}
                      type="monotone"
                      dataKey={`portfolio_${portfolio.id}`}
                      name={portfolio.name}
                      stroke={portfolio.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ) : null
                )}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Start Value</p>
                <p className="text-sm font-semibold text-gray-300">
                  {formatCurrency(chartData[0]?.total || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Value</p>
                <p className="text-sm font-semibold text-gray-300">
                  {formatCurrency(chartData[chartData.length - 1]?.total || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Change</p>
                <p className={`text-sm font-semibold ${
                  (chartData[chartData.length - 1]?.total || 0) >= (chartData[0]?.total || 0)
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {formatCurrency(
                    (chartData[chartData.length - 1]?.total || 0) - (chartData[0]?.total || 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">% Change</p>
                <p className={`text-sm font-semibold ${
                  (chartData[chartData.length - 1]?.total || 0) >= (chartData[0]?.total || 0)
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {chartData[0]?.total
                    ? (
                        (((chartData[chartData.length - 1]?.total || 0) - chartData[0].total) /
                          chartData[0].total) *
                        100
                      ).toFixed(2)
                    : '0.00'}
                  %
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
