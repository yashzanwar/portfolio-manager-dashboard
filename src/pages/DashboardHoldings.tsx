import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MoreVertical, Eye, ChevronDown, ChevronRight, Tag, ChevronUp, TrendingUp, Wallet, DollarSign, BarChart3 } from 'lucide-react'
import { Card } from '../components/common/Card'
import { TableSkeleton, EmptyState } from '../components/common'
import { StatCard } from '../components/StatCard'
import { AddTransactionModal } from '../components/portfolio/AddTransactionModal'
import { CombinedPortfolioChart } from '../components/portfolio/CombinedPortfolioChart'
import { usePortfolioContext } from '../context/PortfolioContext'
import { usePortfolios } from '../hooks/usePortfolios'
import { usePortfolioSummaryV2 } from '../hooks/usePortfolioV2'
import { usePortfolioXIRR } from '../hooks/useXIRR'
import { formatCurrency, formatPercentage } from '../utils/formatters'

type AssetType = 'EQUITY_STOCK' | 'MUTUAL_FUND'

interface ColumnConfig {
  header: string
  key: string
  align?: 'left' | 'right' | 'center'
  format?: (value: any, holding: any) => string | JSX.Element
}

interface DashboardHoldingsProps {
  assetType: AssetType
  title: string
  emptyMessage: string
  columns: ColumnConfig[]
  getIdentifier: (holding: any) => string
  getDisplayName: (holding: any) => string
  getSubtitle: (holding: any) => string
  showChart?: boolean
}

interface AggregatedHolding {
  identifier: string
  displayName: string
  subtitle: string
  totalInvested: number
  currentValue: number
  realizedProfitLoss: number
  unrealizedProfitLoss: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  holdings: any[]
  // Asset-specific fields will be added dynamically
  [key: string]: any
}

export default function DashboardHoldings({
  assetType,
  title,
  emptyMessage,
  columns,
  getIdentifier,
  getDisplayName,
  getSubtitle,
  showChart = false
}: DashboardHoldingsProps) {
  const { selectedPortfolioIds } = usePortfolioContext()
  const { data: portfoliosData } = usePortfolios()
  
  // Fetch V2 portfolio summary filtered by asset type with holdings
  const { data: summaryV2, isLoading: isSummaryLoading } = usePortfolioSummaryV2(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined,
    assetType,
    true // includeHoldings
  )

  // Fetch XIRR for the selected portfolios with asset type filter
  const { data: xirrData } = usePortfolioXIRR(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined,
    assetType
  )

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set())
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Transaction modals
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [selectedPortfolioForTransaction, setSelectedPortfolioForTransaction] = useState<number | undefined>(undefined)
  const [selectedHoldingForTransaction, setSelectedHoldingForTransaction] = useState<any>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.actions-button') && !target.closest('.actions-menu')) {
        setOpenActionsMenu(null)
        setMenuPosition(null)
      }
    }

    if (openActionsMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openActionsMenu])

  // Aggregate holdings by identifier
  const aggregateHoldings = (holdings: any[]): AggregatedHolding[] => {
    const aggregationMap = new Map<string, AggregatedHolding>()

    holdings.forEach(holding => {
      const identifier = getIdentifier(holding)
      
      if (aggregationMap.has(identifier)) {
        const existing = aggregationMap.get(identifier)!
        existing.totalInvested += holding.total_invested || 0
        existing.currentValue += holding.current_value || 0
        existing.realizedProfitLoss += holding.realized_profit_loss || 0
        existing.unrealizedProfitLoss += holding.unrealized_profit_loss || 0
        existing.totalProfitLoss += holding.total_profit_loss || 0
        existing.holdings.push(holding)
        
        // Recalculate weighted averages for numeric fields
        columns.forEach(col => {
          if (col.key !== 'actions' && typeof holding[col.key] === 'number') {
            // For quantity/units, sum them
            if (col.key.includes('quantity') || col.key.includes('units') || col.key === 'current_units') {
              existing[col.key] = (existing[col.key] || 0) + (holding[col.key] || 0)
            }
            // For prices, calculate weighted average
            else if (col.key.includes('price') || col.key.includes('nav')) {
              const totalQuantity = existing.current_units || existing.quantity || 1
              existing[col.key] = existing.currentValue / totalQuantity
            }
          }
        })
        
        // Recalculate percentage
        if (existing.totalInvested > 0) {
          existing.totalProfitLossPercentage = (existing.totalProfitLoss / existing.totalInvested) * 100
        }
      } else {
        const newHolding: AggregatedHolding = {
          identifier,
          displayName: getDisplayName(holding),
          subtitle: getSubtitle(holding),
          totalInvested: holding.total_invested || 0,
          currentValue: holding.current_value || 0,
          realizedProfitLoss: holding.realized_profit_loss || 0,
          unrealizedProfitLoss: holding.unrealized_profit_loss || 0,
          totalProfitLoss: holding.total_profit_loss || 0,
          totalProfitLossPercentage: holding.total_profit_loss_percentage || 0,
          holdings: [holding]
        }
        
        // Copy over asset-specific fields
        columns.forEach(col => {
          if (col.key !== 'actions' && holding[col.key] !== undefined) {
            newHolding[col.key] = holding[col.key]
          }
        })
        
        aggregationMap.set(identifier, newHolding)
      }
    })

    return Array.from(aggregationMap.values())
  }

  // Get holdings from summary
  const holdings = assetType === 'EQUITY_STOCK' 
    ? (summaryV2?.holdings?.stocks || [])
    : (summaryV2?.holdings?.mutual_funds || [])

  // Aggregate and filter holdings
  const aggregatedHoldings = aggregateHoldings(holdings)
  const filteredHoldings = aggregatedHoldings.filter(holding =>
    holding.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holding.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    if (!sortBy) return filteredHoldings

    return [...filteredHoldings].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Handle displayName separately
      if (sortBy === 'displayName') {
        aValue = a.displayName
        bValue = b.displayName
        const comparison = aValue.localeCompare(bValue)
        return sortOrder === 'asc' ? comparison : -comparison
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      return 0
    })
  }, [filteredHoldings, sortBy, sortOrder])

  // Handle column header click for sorting
  const handleSort = (columnKey: string) => {
    if (columnKey === 'actions') return // Don't sort actions column
    
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnKey)
      setSortOrder('desc')
    }
  }

  // Toggle expansion
  const toggleExpansion = (identifier: string) => {
    setExpandedHoldings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(identifier)) {
        newSet.delete(identifier)
      } else {
        newSet.add(identifier)
      }
      return newSet
    })
  }

  // Handle actions click
  const handleActionsClick = (event: React.MouseEvent, menuId: string) => {
    event.stopPropagation()
    const rect = (event.target as HTMLElement).closest('button')?.getBoundingClientRect()
    if (rect) {
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 160
      })
      setOpenActionsMenu(menuId)
    }
  }

  // Handle view transactions
  const navigate = useNavigate()
  
  const handleViewTransactions = (holding: any) => {
    // Navigate to transactions page with filters
    const params = new URLSearchParams()
    
    if (holding.isin) {
      params.set('isin', holding.isin)
    }
    if (holding.symbol) {
      params.set('symbol', holding.symbol)
    }
    if (holding.scheme_name) {
      params.set('scheme', holding.scheme_name)
    }
    if (holding.company_name) {
      params.set('scheme', holding.company_name)
    }
    
    navigate(`/dash/transactions?${params.toString()}`)
    setOpenActionsMenu(null)
    setMenuPosition(null)
  }

  // Handle add transaction
  const handleAddTransaction = (portfolioId?: number, holding?: any) => {
    setSelectedHoldingForTransaction(holding || null)
    setSelectedPortfolioForTransaction(portfolioId)
    setShowAddTransactionModal(true)
    setOpenActionsMenu(null)
    setMenuPosition(null)
  }

  // Get portfolio name
  const getPortfolioName = (portfolioId: number) => {
    return portfoliosData?.find(p => p.id === portfolioId)?.portfolioName || `Portfolio ${portfolioId}`
  }

  // Helper to get value from portfolio holding (handles camelCase to snake_case mapping)
  const getPortfolioHoldingValue = (portfolioHolding: any, key: string) => {
    // Try camelCase first
    if (portfolioHolding[key] !== undefined) {
      return portfolioHolding[key]
    }
    // Convert camelCase to snake_case and try
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return portfolioHolding[snakeKey]
  }

  // Loading state
  if (isSummaryLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    )
  }

  // Empty state
  if (filteredHoldings.length === 0 && !searchTerm) {
    return (
      <div className="p-6">
        <EmptyState title={emptyMessage} />
      </div>
    )
  }

  // Calculate summary statistics
  const overview = summaryV2 && 'overview' in summaryV2 
    ? summaryV2.overview 
    : summaryV2 && 'aggregate_overview' in summaryV2
      ? summaryV2.aggregate_overview
      : null

  const totalInvested = overview?.total_invested || 0
  const currentValue = overview?.current_value || 0
  const totalProfitLoss = overview?.total_profit_loss || 0
  const totalProfitLossPercentage = overview?.total_profit_loss_percentage || 0
  const xirrValue = xirrData?.xirr || null

  return (
    <div className="p-6 space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Value"
          value={formatCurrency(currentValue)}
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          icon={<Wallet className="w-6 h-6" />}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total P&L"
          value={formatCurrency(totalProfitLoss)}
          change={totalProfitLossPercentage}
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgColor={totalProfitLoss >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
          iconColor={totalProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        />
        <StatCard
          title="XIRR"
          value={xirrValue !== null ? formatPercentage(xirrValue) : 'N/A'}
          icon={<BarChart3 className="w-6 h-6" />}
          iconBgColor={xirrValue === null ? "bg-gray-100 dark:bg-gray-900/30" : xirrValue >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
          iconColor={xirrValue === null ? "text-gray-600 dark:text-gray-400" : xirrValue >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          valueColor={xirrValue === null ? undefined : xirrValue >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        />
      </div>

      {/* Chart - Optional */}
      {showChart && selectedPortfolioIds.length > 0 && (
        <CombinedPortfolioChart
          portfolioIds={selectedPortfolioIds}
          mode={selectedPortfolioIds.length === 1 ? 'single' : 'combined'}
          assetType={assetType}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sortedHoldings.length} holdings
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Holdings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-3 text-${col.align || 'left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      col.key === 'displayName' ? 'w-[30%]' : 
                      col.key === 'actions' ? 'w-16' : 
                      'w-[10%]'
                    } ${col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''}`}
                  >
                    <div className="flex items-center gap-1 justify-${col.align || 'left'}">
                      <span>{col.header}</span>
                      {col.key !== 'actions' && sortBy === col.key && (
                        sortOrder === 'asc' ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedHoldings.map((holding) => {
                const isExpanded = expandedHoldings.has(holding.identifier)
                const hasMultiplePortfolios = holding.holdings.length > 1

                return (
                  <>
                    {/* Aggregated Row */}
                    <tr
                      key={holding.identifier}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => hasMultiplePortfolios && toggleExpansion(holding.identifier)}
                    >
                      <td className="px-2 py-3">
                        {hasMultiplePortfolios && (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )
                        )}
                      </td>
                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          className={`px-3 py-3 text-${col.align || 'left'} ${col.key === 'displayName' ? '' : 'whitespace-nowrap'}`}
                          onClick={(e) => col.key === 'actions' && e.stopPropagation()}
                        >
                          {col.key === 'displayName' ? (
                            <div>
                              <div className="font-medium text-white dark:text-white truncate text-sm">
                                {holding.displayName}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-400 flex items-center gap-1 truncate">
                                <span className="truncate">{holding.subtitle}</span>
                                {hasMultiplePortfolios && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                                    {holding.holdings.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : col.key === 'actions' ? (
                            <div className="relative">
                              <button
                                onClick={(e) => handleActionsClick(e, `${holding.identifier}-agg`)}
                                className="actions-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              </button>

                              {openActionsMenu === `${holding.identifier}-agg` && menuPosition && (
                                <div
                                  className="actions-menu fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    left: `${menuPosition.left}px`
                                  }}
                                >
                                  {!hasMultiplePortfolios ? (
                                    <>
                                      <button
                                        onClick={() => handleViewTransactions(holding.holdings[0])}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        View Transactions
                                      </button>
                                      <button
                                        onClick={() => handleAddTransaction(holding.holdings[0].portfolio_id, holding.holdings[0])}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Transaction
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleAddTransaction(undefined, holding.holdings[0])}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Transaction
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : col.format ? (
                            <span className="text-white dark:text-white">
                              {col.format(holding[col.key], holding)}
                            </span>
                          ) : (
                            <span className="text-sm text-white dark:text-white">
                              {holding[col.key]}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Expanded Portfolio-Level Rows */}
                    {isExpanded && hasMultiplePortfolios && holding.holdings.map((portfolioHolding: any, idx: number) => (
                      <tr
                        key={`${holding.identifier}-${portfolioHolding.portfolio_id}-${idx}`}
                        className="bg-gray-50 dark:bg-gray-800/50"
                      >
                        <td className="px-2 py-2"></td>
                        {columns.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className={`px-3 py-2 text-${col.align || 'left'} ${col.key === 'displayName' ? '' : 'whitespace-nowrap'}`}
                          >
                            {col.key === 'displayName' ? (
                              <div className="flex items-center gap-1 pl-4">
                                <Tag className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                                  {getPortfolioName(portfolioHolding.portfolio_id)}
                                </span>
                              </div>
                            ) : col.key === 'actions' ? (
                              <div className="relative">
                                <button
                                  onClick={(e) => handleActionsClick(e, `${holding.identifier}-${portfolioHolding.portfolio_id}-${idx}`)}
                                  className="actions-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                  <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>

                                {openActionsMenu === `${holding.identifier}-${portfolioHolding.portfolio_id}-${idx}` && menuPosition && (
                                  <div
                                    className="actions-menu fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                                    style={{
                                      top: `${menuPosition.top}px`,
                                      left: `${menuPosition.left}px`
                                    }}
                                  >
                                    <button
                                      onClick={() => handleViewTransactions(portfolioHolding)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Transactions
                                    </button>
                                    <button
                                      onClick={() => handleAddTransaction(portfolioHolding.portfolio_id, portfolioHolding)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Transaction
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : col.format ? (
                              <span className="text-gray-200 dark:text-gray-200">
                                {col.format(getPortfolioHoldingValue(portfolioHolding, col.key), portfolioHolding)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-200 dark:text-gray-200">
                                {getPortfolioHoldingValue(portfolioHolding, col.key)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Transaction Modal */}
      {showAddTransactionModal && selectedPortfolioForTransaction && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => {
            setShowAddTransactionModal(false)
            setSelectedPortfolioForTransaction(undefined)
            setSelectedHoldingForTransaction(null)
          }}
          portfolioId={selectedPortfolioForTransaction}
          onSuccess={() => {
            setShowAddTransactionModal(false)
            setSelectedPortfolioForTransaction(undefined)
            setSelectedHoldingForTransaction(null)
            window.location.reload()
          }}
          initialAssetType={assetType === 'EQUITY_STOCK' ? 'STOCK' : 'MUTUAL_FUND'}
          hideAssetTypeSelector={true}
          prefilledScheme={selectedHoldingForTransaction ? {
            isin: selectedHoldingForTransaction.isin || '',
            schemeName: selectedHoldingForTransaction.scheme_name || selectedHoldingForTransaction.company_name || '',
            amc: selectedHoldingForTransaction.amc || '',
            schemeType: selectedHoldingForTransaction.scheme_type || '',
            ticker: selectedHoldingForTransaction.symbol || selectedHoldingForTransaction.ticker || ''
          } : undefined}
          prefilledFolioNumber={selectedHoldingForTransaction?.folio_number}
        />
      )}
      
      {/* Portfolio Selector Modal */}
      {showAddTransactionModal && !selectedPortfolioForTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Portfolio
              </h3>
              <button
                onClick={() => {
                  setShowAddTransactionModal(false)
                  setSelectedPortfolioForTransaction(undefined)
                  setSelectedHoldingForTransaction(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose from your current selection to add the transaction
            </p>
            <div className="space-y-2">
              {selectedPortfolioIds.map((portfolioId) => {
                const portfolio = portfoliosData?.find(p => p.id === portfolioId)
                if (!portfolio || !portfolio.portfolioName) return null
                
                return (
                  <button
                    key={portfolio.id}
                    onClick={() => {
                      setSelectedPortfolioForTransaction(portfolio.id)
                    }}
                    className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {portfolio.portfolioName?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {portfolio.portfolioName}
                      </div>
                      {portfolio.pan && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          PAN: {portfolio.pan}
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
