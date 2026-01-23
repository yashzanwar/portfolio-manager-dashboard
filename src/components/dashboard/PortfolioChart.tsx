import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { PortfolioAPI } from '../../services/portfolioApi'
import { formatCurrency } from '../../utils/formatters'
import { ChartSkeleton } from '../common'

type TimePeriod = '1W' | '1M' | '6M' | '1Y' | '5Y' | 'ALL'

interface PortfolioChartProps {
  portfolioId: number
}

interface ChartDataPoint {
  date: string
  value: number
  formattedDate: string
}

export function PortfolioChart({ portfolioId }: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ change: number; changePercentage: number } | null>(null)

  const periods: { value: TimePeriod; label: string; days: number }[] = [
    { value: '1W', label: '1 Week', days: 7 },
    { value: '1M', label: '1 Month', days: 30 },
    { value: '6M', label: '6 Months', days: 180 },
    { value: '1Y', label: '1 Year', days: 365 },
    { value: '5Y', label: '5 Years', days: 1825 },
    { value: 'ALL', label: 'All Time', days: 0 }, // Using complete-history API
  ]

  useEffect(() => {
    fetchChartData()
  }, [portfolioId, selectedPeriod])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      let response: any

      if (selectedPeriod === 'ALL') {
        // Use complete history endpoint for ALL time
        response = await PortfolioAPI.getCompletePortfolioHistory(portfolioId)
      } else {
        // Use date range endpoint for other periods
        const endDate = new Date()
        const startDate = new Date()
        const period = periods.find(p => p.value === selectedPeriod)
        
        if (period) {
          startDate.setDate(startDate.getDate() - period.days)
        }

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        response = await PortfolioAPI.getPortfolioValueHistory(
          portfolioId,
          startDateStr,
          endDateStr
        )
      }

      // Transform data for recharts
      const transformedData: ChartDataPoint[] = response.dataPoints.map((point) => ({
        date: point.date,
        value: point.value,
        formattedDate: formatDate(point.date, selectedPeriod),
      }))

      setChartData(transformedData)

      // Calculate stats
      if (transformedData.length >= 2) {
        const firstValue = transformedData[0].value
        const lastValue = transformedData[transformedData.length - 1].value
        const change = lastValue - firstValue
        const changePercentage = firstValue > 0 ? (change / firstValue) * 100 : 0

        setStats({ change, changePercentage })
      }
    } catch (err: any) {
      console.error('Error fetching chart data:', err)
      setError(err.response?.data?.message || 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string, period: TimePeriod): string => {
    const date = new Date(dateStr)
    
    if (period === '1W') {
      // Show day of week for 1 week
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    } else if (period === '1M') {
      // Show date for 1 month
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      // Show month/year for longer periods
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {new Date(data.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Portfolio Performance
          </h3>
          {stats && !loading && (
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${stats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.change >= 0 ? '+' : ''}{formatCurrency(stats.change)}
              </span>
              <span className={`flex items-center gap-1 text-sm font-medium ${stats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stats.changePercentage >= 0 ? '+' : ''}{stats.changePercentage.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1 mt-4 sm:mt-0 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : error ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error Loading Chart</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={stats && stats.change >= 0 ? '#10b981' : '#ef4444'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={stats && stats.change >= 0 ? '#10b981' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="formattedDate"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
              domain={['dataMin - dataMin * 0.01', 'dataMax + dataMax * 0.01']}
              tickFormatter={(value) => {
                if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
                if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
                if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
                return `₹${value.toFixed(0)}`
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="natural"
              dataKey="value"
              stroke={stats && stats.change >= 0 ? '#10b981' : '#ef4444'}
              strokeWidth={2.5}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
