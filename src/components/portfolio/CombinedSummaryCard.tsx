import { TrendingUp, TrendingDown, Briefcase, DollarSign, Target } from 'lucide-react'
import { Card } from '../common'
import { CombinedOverallSummary } from '../../types/combinedPortfolio'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

interface CombinedSummaryCardProps {
  summary?: CombinedOverallSummary
  portfolioCount?: number
  mode?: 'single' | 'combined'
  xirr?: number
}

export function CombinedSummaryCard({ summary, portfolioCount = 1, mode = 'single', xirr }: CombinedSummaryCardProps) {
  console.log('CombinedSummaryCard received:', { summary, portfolioCount, mode, xirr })
  
  // Safety check: if summary is undefined, return null or a loading state
  if (!summary) {
    console.warn('CombinedSummaryCard: summary is undefined')
    return null
  }
  
  const isPositive = (summary.total_profit_loss || 0) >= 0

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-200 dark:border-gray-700">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'combined' ? 'Combined Portfolio Summary' : 'Portfolio Summary'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {portfolioCount} {portfolioCount === 1 ? 'portfolio' : 'portfolios'} selected
            </p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {/* Current Value */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.current_value || 0)}
            </p>
          </div>

          {/* Total Invested */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.total_invested || 0)}
            </p>
          </div>

          {/* 1 Day Return */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">1 Day Return</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                -
              </p>
            </div>
            <p className="text-sm font-medium mt-1 text-gray-500 dark:text-gray-400">
              -
            </p>
          </div>

          {/* Total Returns */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Returns</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(summary.total_profit_loss || 0)}
              </p>
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <p className={`text-sm font-medium mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercentage(summary.unrealized_profit_loss_percentage || 0)}
            </p>
          </div>

          {/* XIRR */}
          {xirr !== undefined && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">XIRR</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${xirr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {xirr >= 0 ? '+' : ''}{xirr.toFixed(2)}%
                </p>
                <Target className={`w-5 h-5 ${xirr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <p className="text-sm font-medium mt-1 text-gray-600 dark:text-gray-400">
                Annualized
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Schemes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{summary.total_schemes || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded">
              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Folios</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{summary.total_folios || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
