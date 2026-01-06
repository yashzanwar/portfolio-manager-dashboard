import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters'

interface Folio {
  folioNumber: string
  totalInvested: number
  currentValue: number
  realizedProfitLoss: number
  unrealizedProfitLoss: number
  totalProfitLoss: number
  unrealizedProfitLossPercentage: number
  totalUnitsPurchased: number
  totalUnitsSold: number
  currentUnits: number
}

interface Fund {
  isin: string
  schemeName: string
  amc: string
  schemeType: string
  folios: Folio[]
}

interface HoldingsTableProps {
  funds: Fund[]
}

export function HoldingsTable({ funds }: HoldingsTableProps) {
  const [expandedFund, setExpandedFund] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'invested' | 'current' | 'pl'>('current')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const toggleExpand = (isin: string) => {
    setExpandedFund(expandedFund === isin ? null : isin)
  }

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  // Calculate totals for each fund
  const fundsWithTotals = funds.map(fund => {
    const totals = fund.folios.reduce((acc, folio) => ({
      invested: acc.invested + folio.totalInvested,
      current: acc.current + folio.currentValue,
      pl: acc.pl + folio.totalProfitLoss,
      units: acc.units + folio.currentUnits,
    }), { invested: 0, current: 0, pl: 0, units: 0 })

    return {
      ...fund,
      totalInvested: totals.invested,
      currentValue: totals.current,
      totalProfitLoss: totals.pl,
      currentUnits: totals.units,
      plPercentage: totals.invested > 0 ? (totals.pl / totals.invested) * 100 : 0,
    }
  })

  // Sort funds
  const sortedFunds = [...fundsWithTotals].sort((a, b) => {
    let aVal, bVal
    switch (sortBy) {
      case 'name':
        aVal = a.schemeName.toLowerCase()
        bVal = b.schemeName.toLowerCase()
        break
      case 'invested':
        aVal = a.totalInvested
        bVal = b.totalInvested
        break
      case 'current':
        aVal = a.currentValue
        bVal = b.currentValue
        break
      case 'pl':
        aVal = a.totalProfitLoss
        bVal = b.totalProfitLoss
        break
      default:
        return 0
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  if (funds.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Holdings Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Import your CAS statement to see your holdings
        </p>
      </div>
    )
  }

  const SortButton = ({ column, label }: { column: typeof sortBy; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {label}
      {sortBy === column && (
        sortOrder === 'asc' ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
      )}
    </button>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3">
                <SortButton column="name" label="Scheme Name" />
              </th>
              <th className="px-4 py-3 text-right">Units</th>
              <th className="px-4 py-3 text-right">
                <SortButton column="invested" label="Invested" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortButton column="current" label="Current" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortButton column="pl" label="P&L" />
              </th>
              <th className="px-4 py-3 text-right">Returns</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedFunds.map((fund) => (
              <>
                <tr
                  key={fund.isin}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(fund.isin)}
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fund.schemeName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {fund.amc}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                    {formatNumber(fund.currentUnits, 3)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(fund.totalInvested)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(fund.currentValue)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className={fund.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatCurrency(fund.totalProfitLoss)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className={fund.plPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatPercentage(fund.plPercentage)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {fund.folios.length > 1 && (
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {expandedFund === fund.isin ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
                {/* Folio Details - Expanded */}
                {expandedFund === fund.isin && fund.folios.length > 1 && (
                  <>
                    {fund.folios.map((folio, idx) => (
                      <tr key={`${fund.isin}-${folio.folioNumber}`} className="bg-gray-50 dark:bg-gray-900/30">
                        <td className="px-4 py-3 pl-12">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Folio: {folio.folioNumber}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(folio.currentUnits, 3)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(folio.totalInvested)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(folio.currentValue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={folio.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(folio.totalProfitLoss)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={folio.unrealizedProfitLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatPercentage(folio.unrealizedProfitLossPercentage)}
                          </span>
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
