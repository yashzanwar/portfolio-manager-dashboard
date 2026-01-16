import { TrendingUp, TrendingDown, Wallet, DollarSign, Percent, Target } from 'lucide-react'

interface SummaryStat {
  label: string
  value: string
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

interface TotalValueSummaryProps {
  totalValue?: number
  totalInvested?: number
  totalGain?: number
  totalGainPercent?: number
  xirr?: number
  isLoading?: boolean
}

export function TotalValueSummary({
  totalValue = 0,
  totalInvested = 0,
  totalGain = 0,
  totalGainPercent = 0,
  xirr,
  isLoading = false
}: TotalValueSummaryProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}k`
    return `₹${amount.toFixed(2)}`
  }

  const stats: SummaryStat[] = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      icon: <Wallet className="w-6 h-6" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Total Invested',
      value: formatCurrency(totalInvested),
      icon: <DollarSign className="w-6 h-6" />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Total Gains/Loss',
      value: formatCurrency(Math.abs(totalGain)),
      change: totalGainPercent !== 0 ? `${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%` : undefined,
      changeType: totalGain > 0 ? 'increase' : totalGain < 0 ? 'decrease' : 'neutral',
      icon: totalGain >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />,
      iconBg: totalGain >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      iconColor: totalGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }
  ]

  // Add XIRR stat if available
  if (xirr !== undefined) {
    stats.push({
      label: 'XIRR (Annualized)',
      value: `${xirr >= 0 ? '+' : ''}${xirr.toFixed(2)}%`,
      changeType: xirr > 0 ? 'increase' : xirr < 0 ? 'decrease' : 'neutral',
      icon: <Target className="w-6 h-6" />,
      iconBg: xirr >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      iconColor: xirr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              {stat.change && (
                <div className="flex items-center gap-1">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : stat.changeType === 'decrease' ? (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400'
                      : stat.changeType === 'decrease'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
