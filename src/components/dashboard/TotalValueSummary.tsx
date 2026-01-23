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
      icon: <Wallet className="w-5 h-5" />,
      iconBg: 'bg-gray-900',
      iconColor: 'text-gray-400'
    },
    {
      label: 'Total Invested',
      value: formatCurrency(totalInvested),
      icon: <DollarSign className="w-5 h-5" />,
      iconBg: 'bg-gray-900',
      iconColor: 'text-gray-400'
    },
    {
      label: 'Total Gains/Loss',
      value: formatCurrency(Math.abs(totalGain)),
      change: totalGainPercent !== 0 ? `${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%` : undefined,
      changeType: totalGain > 0 ? 'increase' : totalGain < 0 ? 'decrease' : 'neutral',
      icon: totalGain >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      iconBg: 'bg-gray-900',
      iconColor: totalGain >= 0 ? 'text-green-400' : 'text-red-400'
    }
  ]

  // Add XIRR stat if available
  if (xirr !== undefined) {
    stats.push({
      label: 'XIRR (Annualized)',
      value: `${xirr >= 0 ? '+' : ''}${xirr.toFixed(2)}%`,
      changeType: xirr > 0 ? 'increase' : xirr < 0 ? 'decrease' : 'neutral',
      icon: <Target className="w-5 h-5" />,
      iconBg: 'bg-gray-900',
      iconColor: xirr >= 0 ? 'text-green-400' : 'text-red-400'
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-950 border border-gray-900 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-900 rounded w-2/3"></div>
                <div className="h-6 bg-gray-900 rounded w-1/2"></div>
              </div>
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
          className="bg-gray-950 border border-gray-900 rounded-lg p-4 hover:border-gray-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 mb-0.5">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-gray-200">
                {stat.value}
              </p>
              {stat.change && (
                <div className="flex items-center gap-1 mt-0.5">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : stat.changeType === 'decrease' ? (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  ) : null}
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'increase' 
                      ? 'text-green-400'
                      : stat.changeType === 'decrease'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
