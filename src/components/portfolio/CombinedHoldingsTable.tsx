import React, { useState } from 'react'
import { Card } from '../common'
import { CombinedFundDetail } from '../../types/combinedPortfolio'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Building2 } from 'lucide-react'

interface CombinedHoldingsTableProps {
  funds: CombinedFundDetail[]
  mode: 'single' | 'combined'
}

export function CombinedHoldingsTable({ funds, mode }: CombinedHoldingsTableProps) {
  const [expandedFunds, setExpandedFunds] = useState<Set<string>>(new Set())

  const toggleFund = (isin: string) => {
    setExpandedFunds(prev => {
      const next = new Set(prev)
      if (next.has(isin)) {
        next.delete(isin)
      } else {
        next.add(isin)
      }
      return next
    })
  }

  const totalValue = funds.reduce((sum, f) => sum + f.current_value, 0)

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Holdings by Fund {mode === 'combined' && '(Consolidated)'}
          </h3>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {funds.length} {funds.length === 1 ? 'fund' : 'funds'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {mode === 'combined' && <span className="mr-2">▼</span>}
                  Scheme Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invested
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Returns
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {funds.map((fund) => {
                const isExpanded = expandedFunds.has(fund.isin)
                const isPositive = fund.total_profit_loss >= 0
                const percentOfTotal = (fund.current_value / totalValue) * 100
                const hasMultiplePortfolios = mode === 'combined' && fund.portfolio_breakdown && fund.portfolio_breakdown.length > 1

                return (
                  <React.Fragment key={fund.isin}>
                    {/* Main Fund Row */}
                    <tr 
                      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        hasMultiplePortfolios ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => hasMultiplePortfolios && toggleFund(fund.isin)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          {hasMultiplePortfolios && (
                            <button className="mt-1 focus:outline-none">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {fund.scheme_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {fund.amc}
                            </div>
                            {hasMultiplePortfolios && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {fund.portfolio_breakdown.length} portfolios
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fund.scheme_type === 'EQUITY'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {fund.scheme_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {fund.current_units.toFixed(3)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(fund.total_invested)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(fund.current_value)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`text-sm font-medium ${
                            isPositive 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(fund.total_profit_loss)}
                          </span>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className={`text-xs ${
                          isPositive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatPercentage(fund.unrealized_profit_loss_percentage)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {percentOfTotal.toFixed(2)}%
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Portfolio Breakdown Rows */}
                    {isExpanded && fund.portfolio_breakdown && fund.portfolio_breakdown.map((breakdown) => {
                      const portfolioPercent = breakdown.current_value 
                        ? ((breakdown.current_value / fund.current_value) * 100).toFixed(1)
                        : '0.0'
                      
                      return (
                        <tr 
                          key={`${fund.isin}-${breakdown.portfolio_id}`}
                          className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50"
                        >
                          <td className="px-4 py-3 pl-16">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ↳ {breakdown.portfolio_name || `Portfolio ${breakdown.portfolio_id}`}
                            </div>
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {(breakdown.current_units || 0).toFixed(3)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(breakdown.current_value || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(breakdown.current_value || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {portfolioPercent}%
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
