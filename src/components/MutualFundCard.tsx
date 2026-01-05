import { TrendingUp, TrendingDown } from 'lucide-react'
import { MutualFund } from '../data/mockData'

interface MutualFundCardProps {
  fund: MutualFund
}

export function MutualFundCard({ fund }: MutualFundCardProps) {
  const isPositive = fund.returns >= 0
  const isGainToday = fund.oneDayChange >= 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all hover:scale-[1.02]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {fund.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{fund.category}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(fund.riskLevel)}`}>
          {fund.riskLevel} Risk
        </span>
      </div>

      {/* Main values */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ₹{fund.currentValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Returns</p>
          <p className={`text-xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ₹{fund.returns.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Returns percentage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-2xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {fund.returnsPercentage > 0 ? '+' : ''}{fund.returnsPercentage.toFixed(2)}%
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
          <p className={`text-sm font-semibold ${isGainToday ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isGainToday ? '+' : ''}{fund.oneDayChange}%
          </p>
        </div>
      </div>

      {/* Additional details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">NAV</p>
          <p className="font-semibold text-gray-900 dark:text-white">₹{fund.nav}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Units</p>
          <p className="font-semibold text-gray-900 dark:text-white">{fund.units}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">1Y Returns</p>
          <p className="font-semibold text-green-600 dark:text-green-400">+{fund.oneYearReturn}%</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Expense</p>
          <p className="font-semibold text-gray-900 dark:text-white">{fund.expenseRatio}%</p>
        </div>
      </div>
    </div>
  )
}
