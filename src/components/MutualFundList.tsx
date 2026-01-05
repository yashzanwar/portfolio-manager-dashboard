import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Eye, ShoppingCart, BarChart3, Star, ArrowUpDown } from 'lucide-react'
import { MutualFund } from '../data/mockData'
import { useState, useMemo } from 'react'

interface MutualFundListProps {
  funds: MutualFund[]
}

type SortColumn = 'name' | 'currentValue' | 'returns' | 'nav' | 'category'
type SortDirection = 'asc' | 'desc'

export function MutualFundList({ funds }: MutualFundListProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>('currentValue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'name' || column === 'category' ? 'asc' : 'desc')
    }
  }

  const sortedFunds = useMemo(() => {
    const sorted = [...funds].sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'currentValue':
          comparison = a.currentValue - b.currentValue
          break
        case 'returns':
          comparison = a.returns - b.returns
          break
        case 'nav':
          comparison = a.nav - b.nav
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [funds, sortColumn, sortDirection])

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

  const getPerformanceBgColor = (returnsPercentage: number) => {
    if (returnsPercentage >= 30) return 'bg-green-50/50 dark:bg-green-900/10'
    if (returnsPercentage >= 20) return 'bg-green-50/30 dark:bg-green-900/5'
    if (returnsPercentage >= 10) return 'bg-blue-50/30 dark:bg-blue-900/5'
    if (returnsPercentage < 0) return 'bg-red-50/30 dark:bg-red-900/5'
    return ''
  }



  const toggleRow = (fundId: string) => {
    setExpandedRow(expandedRow === fundId ? null : fundId)
  }

  return (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header - Hidden on mobile */}
      <div className="hidden lg:grid lg:grid-cols-10 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400">
        <div 
          className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          onClick={() => handleSort('name')}
        >
          Fund Name
          <ArrowUpDown className="w-4 h-4" />
        </div>
        <div 
          className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          onClick={() => handleSort('currentValue')}
        >
          Current Value
          <ArrowUpDown className="w-4 h-4" />
        </div>
        <div 
          className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          onClick={() => handleSort('returns')}
        >
          Returns
          <ArrowUpDown className="w-4 h-4" />
        </div>
        <div 
          className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          onClick={() => handleSort('nav')}
        >
          NAV
          <ArrowUpDown className="w-4 h-4" />
        </div>
        <div 
          className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          onClick={() => handleSort('category')}
        >
          Category
          <ArrowUpDown className="w-4 h-4" />
        </div>
      </div>

      {/* Fund rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {sortedFunds.map((fund) => {
          const isPositive = fund.returns >= 0
          const isGainToday = fund.oneDayChange >= 0
          const isExpanded = expandedRow === fund.id
          const isHovered = hoveredRow === fund.id

          return (
            <div
              key={fund.id}
              className={`transition-all ${getPerformanceBgColor(fund.returnsPercentage)}`}
              onMouseEnter={() => setHoveredRow(fund.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <div
                className="px-4 lg:px-6 py-4 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer group relative"
                onClick={() => toggleRow(fund.id)}
              >
                {/* Desktop view */}
                <div className="hidden lg:grid lg:grid-cols-10 gap-4 items-center">
                  {/* Fund Name */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {fund.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Current Value */}
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{fund.currentValue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Invested: ₹{fund.invested.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Returns */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          ₹{fund.returns.toLocaleString('en-IN')}
                        </p>
                        <span className={`text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {fund.returnsPercentage > 0 ? '+' : ''}{fund.returnsPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NAV */}
                  <div className="col-span-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{fund.nav}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fund.units} units
                    </p>
                  </div>

                  {/* Category */}
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{fund.category}</span>
                    <div className="flex items-center gap-2">
                      {/* Hover action buttons */}
                      <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button 
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={(e) => { e.stopPropagation(); alert('View details') }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          onClick={(e) => { e.stopPropagation(); alert('Buy') }}
                          title="Buy"
                        >
                          <ShoppingCart className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={(e) => { e.stopPropagation(); alert('Analyze') }}
                          title="Analyze"
                        >
                          <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile view */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {fund.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{fund.category}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 mt-1" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₹{fund.currentValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Returns</p>
                      <p className={`font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fund.returnsPercentage > 0 ? '+' : ''}{fund.returnsPercentage.toFixed(2)}%
                      </p>
                      <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(fund.returnsPercentage), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NAV</p>
                      <p className="font-semibold text-gray-900 dark:text-white">₹{fund.nav}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">1Y Return</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">+{fund.oneYearReturn}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Today's change</span>
                    <span className={`text-sm font-semibold ${isGainToday ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isGainToday ? '+' : ''}{fund.oneDayChange}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable Details Section */}
              {isExpanded && (
                <div className="px-4 lg:px-6 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-top">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">3M Returns</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +{fund.threeMonthReturn}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">1Y Returns</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +{fund.oneYearReturn}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">3Y Returns</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +{fund.threeYearReturn}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AUM</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fund.aum}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expense Ratio</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fund.expenseRatio}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Units Held</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fund.units}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons in expanded view */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Invest More
                    </button>
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Analyze Performance
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Add to Watchlist
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
