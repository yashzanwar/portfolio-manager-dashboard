import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MoreVertical, Eye, EyeOff, ChevronDown, ChevronRight, Tag, ChevronUp, TrendingUp, Wallet, DollarSign, BarChart3 } from 'lucide-react'
import { Card } from '../components/common/Card'
import { TableSkeleton, EmptyState } from '../components/common'
import { StatCard } from '../components/StatCard'
import { AddTransactionModal } from '../components/portfolio/AddTransactionModal'
import { AddMetalTransactionModal } from '../components/portfolio/AddMetalTransactionModal'
import { AddFDModal } from '../components/portfolio/AddFDModal'
import { CombinedPortfolioChart } from '../components/portfolio/CombinedPortfolioChart'
import { usePortfolioContext } from '../context/PortfolioContext'
import { usePortfolios } from '../hooks/usePortfolios'
import { usePortfolioSummaryV2 } from '../hooks/usePortfolioV2'
import { usePortfolioXIRR, useMultipleSchemeXIRR } from '../hooks/useXIRR'
import { formatCurrency, formatPercentage } from '../utils/formatters'

type AssetType = 'EQUITY_STOCK' | 'MUTUAL_FUND' | 'PRECIOUS_METAL' | 'FIXED_DEPOSIT'

interface ColumnConfig {
  header: string
  key: string
  align?: 'left' | 'right' | 'center'
  format?: (value: any, holding: any) => string | JSX.Element
  showBorderRight?: boolean
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
  const [hideSmallHoldings, setHideSmallHoldings] = useState(true)
  const [mobileReturnView, setMobileReturnView] = useState<'returns' | 'xirr'>('returns')
  const [showMobileSortMenu, setShowMobileSortMenu] = useState(false)
  
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
          // Helper to get value from holding (handles both snake_case and camelCase)
          const getHoldingValue = (key: string) => {
            if (holding[key] !== undefined) return holding[key]
            // Try camelCase version
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
            return holding[camelKey]
          }
          
          const value = getHoldingValue(col.key)
          
          if (col.key !== 'actions' && typeof value === 'number') {
            // For quantity/units, sum them
            if (col.key.includes('quantity') || col.key.includes('units') || col.key === 'current_units') {
              existing[col.key] = (existing[col.key] || 0) + (value || 0)
            }
            // For average buy price/NAV, calculate weighted average using totalInvested
            else if (col.key === 'average_price' || col.key === 'average_nav') {
              const totalQuantity = existing.current_units || existing.current_quantity || existing.quantity || 1
              existing[col.key] = existing.totalInvested / totalQuantity
            }
            // For current price, calculate using currentValue
            else if (col.key === 'current_price' || col.key === 'current_nav') {
              const totalQuantity = existing.current_units || existing.current_quantity || existing.quantity || 1
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
          if (col.key !== 'actions') {
            // Try snake_case first
            if (holding[col.key] !== undefined) {
              newHolding[col.key] = holding[col.key]
            } else {
              // Try camelCase version
              const camelKey = col.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
              if (holding[camelKey] !== undefined) {
                newHolding[col.key] = holding[camelKey]
              }
            }
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
    : assetType === 'PRECIOUS_METAL'
    ? (summaryV2?.holdings?.metals || [])
    : assetType === 'FIXED_DEPOSIT'
    ? (summaryV2?.holdings?.fixed_deposits || [])
    : (summaryV2?.holdings?.mutual_funds || [])

  // Extract scheme IDs for XIRR fetching
  const schemeIds = holdings.map((h: any) => h.scheme_id).filter((id: any) => id != null)

  // Fetch XIRR data for all schemes
  const { data: schemeXIRRData } = useMultipleSchemeXIRR(
    schemeIds,
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )

  // Create XIRR lookup map
  const xirrMap = new Map<number, number>()
  if (schemeXIRRData) {
    schemeXIRRData.forEach(xirr => {
      if (xirr.schemeId && xirr.xirr != null) {
        xirrMap.set(xirr.schemeId, xirr.xirr)
      }
    })
  }

  // Aggregate and filter holdings
  const aggregatedHoldings = aggregateHoldings(holdings).map(holding => ({
    ...holding,
    xirr: holding.holdings[0]?.scheme_id ? xirrMap.get(holding.holdings[0].scheme_id) : undefined
  }))
  
  const filteredHoldings = aggregatedHoldings.filter(holding =>
    holding.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holding.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter out holdings with zero quantity if toggle is enabled
  const filteredByValueHoldings = hideSmallHoldings
    ? filteredHoldings.filter(holding => {
        const qty = holding.quantity || holding.current_quantity || holding.current_units || 0
        return qty > 0
      })
    : filteredHoldings

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    if (!sortBy) return filteredByValueHoldings

    return [...filteredByValueHoldings].sort((a, b) => {
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
  }, [filteredByValueHoldings, sortBy, sortOrder])

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
    <div className="md:p-6 p-4 md:space-y-6 space-y-4">
      {/* Title - Hidden on mobile */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white hidden md:block">{title}</h1>

      {/* Mobile Summary Card - Groww Style */}
      <div className="md:hidden -mx-4">
        {/* Current Value - Top Center */}
        <div className="bg-gray-950 px-4 py-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Current value</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(currentValue)}
          </div>
        </div>
        
        {/* Three Column Layout: Invested, P&L, XIRR */}
        <div className="bg-gray-950 px-4 py-4 grid grid-cols-3 gap-2">
          {/* Invested */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Invested</div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(totalInvested)}
            </div>
          </div>
          
          {/* Total P&L */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Total P&L</div>
            <div className={`text-sm font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfitLoss)}
            </div>
            <div className={`text-xs ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({formatPercentage(totalProfitLossPercentage)})
            </div>
          </div>
          
          {/* XIRR */}
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">XIRR</div>
            <div className={`text-sm font-bold ${(xirrData?.xirr ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {xirrData?.xirr != null ? `${xirrData.xirr.toFixed(2)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Summary Statistics - 4 Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gray-950 border-gray-900">
          <div className="text-sm text-gray-400 mb-2">Total investment</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(totalInvested)}
          </div>
        </Card>
        <Card className="p-6 bg-gray-950 border-gray-900">
          <div className="text-sm text-gray-400 mb-2">Current value</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(currentValue)}
          </div>
        </Card>
        <Card className="p-6 bg-gray-950 border-gray-900">
          <div className="text-sm text-gray-400 mb-2">Total P&L</div>
          <div className={`text-3xl font-bold flex items-center gap-2 ${
            totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(totalProfitLoss)}
            <span className="text-lg">
              {formatPercentage(totalProfitLossPercentage)}
            </span>
          </div>
        </Card>
        <Card className="p-6 bg-gray-950 border-gray-900">
          <div className="text-sm text-gray-400 mb-2">XIRR (Annualized)</div>
          <div className={`text-3xl font-bold ${
            (xirrData?.xirr ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {xirrData?.xirr != null ? `${xirrData.xirr >= 0 ? '+' : ''}${xirrData.xirr.toFixed(2)}%` : 'N/A'}
          </div>
        </Card>
      </div>

      {/* Chart - Optional */}
      {showChart && selectedPortfolioIds.length > 0 && (
        <CombinedPortfolioChart
          portfolioIds={selectedPortfolioIds}
          mode={selectedPortfolioIds.length === 1 ? 'single' : 'combined'}
          assetType={assetType}
        />
      )}

      {/* Search Bar */}
      <Card className="p-4 bg-gray-950 border-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${assetType === 'EQUITY_STOCK' ? 'stocks' : 'mutual funds'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border-0 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setHideSmallHoldings(!hideSmallHoldings)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-900 rounded-lg transition-colors"
          >
            {hideSmallHoldings ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Show All</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Hide Zero Qty</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Holdings Table */}
      <div className="md:mx-0 -mx-4 md:rounded-xl rounded-none">
        <Card className="overflow-hidden bg-black border-0 !p-0 rounded-none md:rounded-xl">
        {/* Mobile List View */}
        <div className="md:hidden bg-black">
          {/* Toggle Button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-950">
            <span className="text-sm text-gray-400">{sortedHoldings.length} holdings</span>
            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => setShowMobileSortMenu(!showMobileSortMenu)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700 flex items-center gap-1"
              >
                Sort
                {sortBy && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => setMobileReturnView(mobileReturnView === 'returns' ? 'xirr' : 'returns')}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700"
              >
                {mobileReturnView === 'returns' ? 'Returns %' : 'XIRR'}
              </button>
              
              {/* Sort Menu Dropdown */}
              {showMobileSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMobileSortMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1">
                    <button
                      onClick={() => {
                        setSortBy('displayName')
                        setSortOrder(sortBy === 'displayName' && sortOrder === 'asc' ? 'desc' : 'asc')
                        setShowMobileSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                    >
                      Name
                      {sortBy === 'displayName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('currentValue')
                        setSortOrder(sortBy === 'currentValue' && sortOrder === 'asc' ? 'desc' : 'asc')
                        setShowMobileSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                    >
                      Current Value
                      {sortBy === 'currentValue' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('totalInvested')
                        setSortOrder(sortBy === 'totalInvested' && sortOrder === 'asc' ? 'desc' : 'asc')
                        setShowMobileSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                    >
                      Invested Value
                      {sortBy === 'totalInvested' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('totalProfitLoss')
                        setSortOrder(sortBy === 'totalProfitLoss' && sortOrder === 'asc' ? 'desc' : 'asc')
                        setShowMobileSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                    >
                      Overall Return
                      {sortBy === 'totalProfitLoss' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('xirr')
                        setSortOrder(sortBy === 'xirr' && sortOrder === 'asc' ? 'desc' : 'asc')
                        setShowMobileSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                    >
                      XIRR
                      {sortBy === 'xirr' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {sortedHoldings.map((holding) => (
            <div 
              key={holding.identifier}
              className="px-3 py-3 border-b-2 border-gray-800"
            >
              {/* Title */}
              <div className="text-base font-medium text-gray-200 mb-3 truncate">
                {assetType === 'MUTUAL_FUND' 
                  ? holding.displayName 
                  : (holding.holdings[0]?.symbol || holding.holdings[0]?.isin || holding.identifier)
                }
              </div>
              
              {/* Three Column Layout */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Invested</div>
                  <div className="text-sm font-medium text-gray-200">
                    {formatCurrency(holding.totalInvested)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Current</div>
                  <div className="text-sm font-medium text-gray-200">
                    {formatCurrency(holding.currentValue)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    {mobileReturnView === 'returns' ? 'Overall Return' : 'XIRR'}
                  </div>
                  <div className={`text-sm font-semibold ${
                    mobileReturnView === 'returns'
                      ? (holding.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400')
                      : (holding.xirr != null && holding.xirr >= 0 ? 'text-green-400' : 'text-red-400')
                  }`}>
                    {mobileReturnView === 'returns' 
                      ? `${formatCurrency(holding.totalProfitLoss)} (${formatPercentage(holding.totalProfitLossPercentage)})`
                      : (holding.xirr != null && Math.abs(holding.xirr) <= 1000 
                          ? formatPercentage(holding.xirr) 
                          : '—')
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <thead className="bg-black border-b border-gray-900">
              <tr>
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-8"></th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-2 text-${col.align || 'left'} text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${
                      col.showBorderRight ? 'border-r border-gray-900' : ''
                    } ${
                      col.key === 'displayName' ? 'w-[20%]' : 
                      col.key === 'actions' ? 'w-14' : 
                      ''
                    } ${col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-950 transition-colors' : ''}`}
                  >
                    <div className={`flex items-center gap-1 ${
                      col.align === 'right' ? 'justify-end' : 
                      col.align === 'center' ? 'justify-center' : 
                      'justify-start'
                    }`}>
                      <span className="whitespace-nowrap">{col.header}</span>
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
            <tbody className="bg-black divide-y divide-gray-900">
              {sortedHoldings.map((holding) => {
                const isExpanded = expandedHoldings.has(holding.identifier)
                const hasMultiplePortfolios = holding.holdings.length > 1

                return (
                  <>
                    {/* Aggregated Row */}
                    <tr
                      key={holding.identifier}
                      className="hover:bg-gray-950 cursor-pointer transition-colors"
                      onClick={() => hasMultiplePortfolios && toggleExpansion(holding.identifier)}
                    >
                      <td className="px-2 py-2.5">
                        {hasMultiplePortfolios && (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                          )
                        )}
                      </td>
                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          className={`px-3 py-2.5 ${
                            col.showBorderRight ? 'border-r border-gray-900' : ''
                          } ${
                            col.align === 'right' ? 'text-right' : 
                            col.align === 'center' ? 'text-center' : 
                            'text-left'
                          } ${col.key === 'displayName' ? '' : 'whitespace-nowrap'}`}
                          onClick={(e) => col.key === 'actions' && e.stopPropagation()}
                        >
                          {col.key === 'displayName' ? (
                            <div title={holding.displayName} className="min-w-0">
                              <div className="font-medium text-gray-200 truncate text-xs leading-tight">
                                {holding.displayName.split('-')[0].trim()}
                              </div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 truncate mt-0.5">
                                <span className="truncate">{holding.subtitle}</span>
                                {hasMultiplePortfolios && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-blue-900 text-blue-300 whitespace-nowrap">
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
                            <span className="text-xs text-gray-300 font-mono">
                              {col.format(holding[col.key], holding)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 font-mono">
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
                        className="bg-black hover:bg-gray-950"
                      >
                        <td className="px-2 py-2"></td>
                        {columns.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className={`px-3 py-2 ${
                              col.showBorderRight ? 'border-r border-gray-900' : ''
                            } ${
                              col.align === 'right' ? 'text-right' : 
                              col.align === 'center' ? 'text-center' : 
                              'text-left'
                            } ${col.key === 'displayName' ? '' : 'whitespace-nowrap'}`}
                          >
                            {col.key === 'displayName' ? (
                              <div className="flex items-center gap-1.5 pl-4">
                                <Tag className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-medium text-blue-400 truncate">
                                    {getPortfolioName(portfolioHolding.portfolio_id)}
                                  </span>
                                  {portfolioHolding.folio_number && (
                                    <span className="text-[9px] text-gray-500 italic truncate">
                                      {portfolioHolding.folio_number}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : col.key === 'actions' ? (
                              <div className="relative">
                                <button
                                  onClick={(e) => handleActionsClick(e, `${holding.identifier}-${portfolioHolding.portfolio_id}-${idx}`)}
                                  className="actions-button p-1 hover:bg-gray-700 rounded transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
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
                              <span className="text-[10px] text-gray-400 font-mono">
                                {col.format(getPortfolioHoldingValue(portfolioHolding, col.key), portfolioHolding)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-mono">
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
      </div>

      {/* Add Transaction Modal for Metals */}
      {showAddTransactionModal && selectedPortfolioForTransaction && assetType === 'PRECIOUS_METAL' && (
        <AddMetalTransactionModal
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
          prefilledSchemeCode={selectedHoldingForTransaction?.scheme_code}
          prefilledFolioNumber={selectedHoldingForTransaction?.folio_number}
        />
      )}

      {/* Add FD Modal */}
      {showAddTransactionModal && selectedPortfolioForTransaction && assetType === 'FIXED_DEPOSIT' && (
        <AddFDModal
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
        />
      )}

      {/* Add Transaction Modal for MF and Stocks */}
      {showAddTransactionModal && selectedPortfolioForTransaction && assetType !== 'PRECIOUS_METAL' && assetType !== 'FIXED_DEPOSIT' && (
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

      {/* Add Transaction Modal for Fixed Deposits */}
      {showAddTransactionModal && selectedPortfolioForTransaction && assetType === 'FIXED_DEPOSIT' && (
        <AddFDModal
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
