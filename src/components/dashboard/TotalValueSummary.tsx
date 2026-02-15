import { TrendingUp, TrendingDown, Wallet, DollarSign, Target } from 'lucide-react'

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
  dayProfitLoss?: number
  dayProfitLossPercent?: number
  xirr?: number
  isLoading?: boolean
}

export function TotalValueSummary({
  totalValue = 0,
  totalInvested = 0,
  totalGain = 0,
  totalGainPercent = 0,
  dayProfitLoss = 0,
  dayProfitLossPercent = 0,
  xirr,
  isLoading = false
}: TotalValueSummaryProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}k`
    return `₹${amount.toFixed(2)}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
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
      label: '1D P&L',
      value: formatCurrency(dayProfitLoss),
      change: formatPercentage(dayProfitLossPercent),
      changeType: dayProfitLoss > 0 ? 'increase' : dayProfitLoss < 0 ? 'decrease' : 'neutral',
      icon: dayProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      iconBg: 'bg-gray-900',
      iconColor: dayProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Total Gains/Loss',
      value: formatCurrency(totalGain),
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
      <>
        {/* Mobile Loading */}
        <div className="md:hidden">
          <div className="bg-gray-950 px-4 py-5 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-24 mx-auto mb-2"></div>
            <div className="h-8 bg-gray-800 rounded w-32 mx-auto"></div>
          </div>
          <div className="bg-gray-950 px-4 pb-5 grid grid-cols-3 gap-2 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-3 bg-gray-800 rounded w-16 mb-2"></div>
                <div className="h-5 bg-gray-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop Loading */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </>
    )
  }

  return (
    <>
      {/* Mobile Summary Card - Groww Style */}
      <div className="md:hidden">
        {/* Current Value - Top Center */}
        <div className="bg-gray-950 px-4 py-5 text-center">
          <div className="text-sm text-gray-400 mb-1">Current value</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(totalValue)}
          </div>
        </div>

        {/* 1D P&L - Single Line */}
        <div className="bg-gray-950 px-4 pb-3 text-center">
          <div className="text-sm font-semibold">
            <span className="text-gray-400">1D P&L</span>{' '}
            <span className={dayProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(Math.abs(dayProfitLoss))}
            </span>
          </div>
        </div>

        {/* Summary Grid: Invested, Total P&L, XIRR */}
        <div className="bg-gray-950 px-4 pb-5 grid grid-cols-3 gap-2">
          {/* Invested */}
          <div className="text-left">
            <div className="text-xs text-gray-400 mb-1">Invested</div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(totalInvested)}
            </div>
          </div>

          {/* Total P&L */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Total P&L</div>
            <div className={`text-sm font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalGain)}
            </div>
          </div>

          {/* XIRR */}
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">XIRR</div>
            <div className={`text-sm font-bold ${(xirr ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {xirr != null ? `${xirr.toFixed(2)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
    </>
  )
}
