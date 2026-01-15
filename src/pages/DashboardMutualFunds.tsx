import { useState, useEffect, useMemo } from 'react'
import { Download, Search, Filter, ChevronDown, ChevronUp, MoreVertical, Eye, Plus, Trash2, Tag, TrendingUp, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Button, TableSkeleton, EmptyState } from '../components/common'
import { AddTransactionModal } from '../components/portfolio/AddTransactionModal'
import { FolioTransactionsModal } from '../components/portfolio/FolioTransactionsModal'
import { usePortfolios } from '../hooks/usePortfolios'
import { usePortfolioContext } from '../context/PortfolioContext'
import { useCombinedPortfolio } from '../hooks/useCombinedPortfolio'
import { useCombinedHistory } from '../hooks/useCombinedHistory'
import { CombinedSummaryCard } from '../components/portfolio/CombinedSummaryCard'
import { CombinedPortfolioChart } from '../components/portfolio/CombinedPortfolioChart'
import { PortfolioBreakdownTable } from '../components/portfolio/PortfolioBreakdownTable'
import { PortfolioAPI } from '../services/portfolioApi'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'
import toast from 'react-hot-toast'

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
  averageBuyPrice: number
  currentNav: number
  portfolioId?: number
  portfolioName?: string
}

interface Fund {
  isin: string
  schemeName: string
  amc: string
  schemeType: string
  folios: Folio[]
}

export default function DashboardMutualFunds() {
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  const { selectedPortfolioIds } = usePortfolioContext()
  const navigate = useNavigate()
  const [combinedSummary, setCombinedSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Fetch combined portfolio data for summary cards
  const { data: summaryData, isLoading: isSummaryLoading } = useCombinedPortfolio(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )
  
  const { data: historyData, isLoading: isHistoryLoading } = useCombinedHistory(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )

  // Check if user has selected portfolios
  const hasSelectedPortfolios = selectedPortfolioIds.length > 0
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [schemeTypeFilter, setSchemeTypeFilter] = useState<string>('All')
  const [amcFilter, setAmcFilter] = useState<string>('All')
  const [expandedFolio, setExpandedFolio] = useState<string | null>(null)
  
  // Actions menu
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Add Transaction Modal
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [prefilledTransactionData, setPrefilledTransactionData] = useState<{
    scheme?: { isin: string; schemeName: string; amc: string; schemeType: string }
    folioNumber?: string
  }>({})
  
  // Transactions Modal
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedFolioForTransactions, setSelectedFolioForTransactions] = useState<{
    portfolioId: number
    folioNumber: string
    schemeName: string
  } | null>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionsMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('.actions-menu-container')) {
          setOpenActionsMenu(null)
          setMenuPosition(null)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openActionsMenu])
  
  // Sorting
  const [sortBy, setSortBy] = useState<'scheme' | 'invested' | 'current' | 'pl' | 'returns'>('current')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch combined summary for selected portfolios
  const fetchCombinedSummary = async () => {
    if (!portfolios.length || selectedPortfolioIds.length === 0) {
      setCombinedSummary(null)
      return
    }

    setLoading(true)
    try {
      // Fetch summaries for all selected portfolios
      const summaries = await Promise.all(
        selectedPortfolioIds.map(async (id) => {
          const portfolio = portfolios.find(p => p.id === id)
          const data = await PortfolioAPI.getPortfolioSummary(id)
          return { ...data, portfolioId: id, portfolioName: portfolio?.portfolioName || `Portfolio ${id}` }
        })
      )

      // Combine all funds across portfolios
      const allFunds: any[] = []
      const portfolioOverview = {
        totalInvested: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0
      }

      summaries.forEach((summary) => {
        // Update portfolio overview totals
        portfolioOverview.totalInvested += summary.portfolio_overview?.total_invested ?? summary.portfolioOverview?.totalInvested ?? 0
        portfolioOverview.currentValue += summary.portfolio_overview?.current_value ?? summary.portfolioOverview?.currentValue ?? 0
        portfolioOverview.totalProfitLoss += summary.portfolio_overview?.total_profit_loss ?? summary.portfolioOverview?.totalProfitLoss ?? 0

        // Process funds
        ;(summary.funds || []).forEach((fund: any) => {
          const fundKey = fund.isin
          const existingFund = allFunds.find(f => f.isin === fundKey)

          // Transform folio data with portfolio info
          const transformedFolios = (fund.folios || []).map((folio: any) => {
            const currentUnits = Number(folio.current_units ?? folio.currentUnits ?? 0)
            const totalInvested = Number(folio.total_invested ?? folio.totalInvested ?? 0)
            const currentValue = Number(folio.current_value ?? folio.currentValue ?? 0)
            
            return {
              folioNumber: folio.folio_number || folio.folioNumber,
              totalInvested: totalInvested,
              currentValue: currentValue,
              realizedProfitLoss: Number(folio.realized_profit_loss ?? folio.realizedProfitLoss ?? 0),
              unrealizedProfitLoss: Number(folio.unrealized_profit_loss ?? folio.unrealizedProfitLoss ?? 0),
              totalProfitLoss: Number(folio.total_profit_loss ?? folio.totalProfitLoss ?? 0),
              unrealizedProfitLossPercentage: Number(folio.unrealized_profit_loss_percentage ?? folio.unrealizedProfitLossPercentage ?? 0),
              totalUnitsPurchased: Number(folio.total_units_purchased ?? folio.totalUnitsPurchased ?? 0),
              totalUnitsSold: Number(folio.total_units_sold ?? folio.totalUnitsSold ?? 0),
              currentUnits: currentUnits,
              averageBuyPrice: currentUnits > 0 ? totalInvested / currentUnits : 0,
              currentNav: currentUnits > 0 ? currentValue / currentUnits : 0,
              portfolioId: summary.portfolioId,
              portfolioName: summary.portfolioName
            }
          })

          if (existingFund) {
            // Merge folios from same fund across portfolios
            existingFund.folios.push(...transformedFolios)
          } else {
            // Add new fund
            allFunds.push({
              isin: fund.isin,
              schemeName: fund.scheme_name || fund.schemeName,
              amc: fund.amc,
              schemeType: fund.scheme_type || fund.schemeType,
              folios: transformedFolios
            })
          }
        })
      })

      // Calculate overall percentage
      portfolioOverview.totalProfitLossPercentage = 
        portfolioOverview.totalInvested > 0 
          ? (portfolioOverview.totalProfitLoss / portfolioOverview.totalInvested) * 100 
          : 0

      const data = {
        portfolioOverview,
        funds: allFunds
      }
      
      setCombinedSummary(data)
    } catch (err: any) {
      console.error('Error fetching holdings:', err)
      toast.error('Failed to load holdings data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCombinedSummary()
  }, [selectedPortfolioIds, portfolios])

  // Get unique AMCs and scheme types
  const { uniqueAmcs, uniqueSchemeTypes } = useMemo(() => {
    if (!combinedSummary) return { uniqueAmcs: [], uniqueSchemeTypes: [] }
    
    const amcs = new Set<string>()
    const types = new Set<string>()
    
    combinedSummary.funds.forEach((fund: any) => {
      if (fund.amc) amcs.add(fund.amc)
      if (fund.schemeType) types.add(fund.schemeType)
    })
    
    return {
      uniqueAmcs: Array.from(amcs).sort(),
      uniqueSchemeTypes: Array.from(types).sort()
    }
  }, [combinedSummary])

  // Filter and sort holdings
  const filteredAndSortedHoldings = useMemo(() => {
    if (!combinedSummary) return []
    
    let filtered = combinedSummary.funds.filter((fund: any) => {
      const matchesSearch = fund.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.isin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.folios.some((f: any) => f.folioNumber.includes(searchTerm) || f.portfolioName?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesSchemeType = schemeTypeFilter === 'All' || fund.schemeType === schemeTypeFilter
      const matchesAmc = amcFilter === 'All' || fund.amc === amcFilter
      
      return matchesSearch && matchesSchemeType && matchesAmc
    })
    
    // Calculate totals for each fund
    const withTotals = filtered.map((fund: any) => {
      const totals = fund.folios.reduce((acc: any, folio: any) => ({
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
    
    // Sort
    return withTotals.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortBy) {
        case 'scheme':
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
        case 'returns':
          aVal = a.plPercentage
          bVal = b.plPercentage
          break
        default:
          return 0
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [combinedSummary, searchTerm, schemeTypeFilter, amcFilter, sortBy, sortOrder])

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const handleTransactionAdded = () => {
    fetchCombinedSummary() // Refresh holdings data
  }

  const exportToCSV = () => {
    if (!combinedSummary || filteredAndSortedHoldings.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const headers = ['Scheme Name', 'AMC', 'ISIN', 'Scheme Type', 'Portfolio', 'Folio Number', 'Units', 'Avg Buy Price', 'Current NAV', 'Invested', 'Current Value', 'Realized P&L', 'Unrealized P&L', 'Total P&L', 'Returns %']
    
    const rows = filteredAndSortedHoldings.flatMap((fund: any) =>
      fund.folios.map((folio: any) => [
        fund.schemeName,
        fund.amc,
        fund.isin,
        fund.schemeType,
        folio.portfolioName || '',
        folio.folioNumber,
        folio.currentUnits.toFixed(3),
        folio.averageBuyPrice.toFixed(2),
        folio.currentNav.toFixed(4),
        folio.totalInvested.toFixed(2),
        folio.currentValue.toFixed(2),
        folio.realizedProfitLoss.toFixed(2),
        folio.unrealizedProfitLoss.toFixed(2),
        folio.totalProfitLoss.toFixed(2),
        folio.unrealizedProfitLossPercentage.toFixed(2)
      ])
    )
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const portfolioNames = selectedPortfolioIds.length === 1 
      ? portfolios.find(p => p.id === selectedPortfolioIds[0])?.portfolioName || 'Portfolio'
      : 'Combined'
    link.download = `mutual_funds_${portfolioNames}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('Mutual funds data exported successfully')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mutual Funds
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete overview of your mutual fund investments
                {selectedPortfolioIds.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    ({selectedPortfolioIds.length} {selectedPortfolioIds.length === 1 ? 'portfolio' : 'portfolios'} selected)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={!combinedSummary || filteredAndSortedHoldings.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Show message if no portfolios selected */}
      {!hasSelectedPortfolios && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                No Portfolios Selected
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Please select one or more portfolios from the dropdown in the navbar to view your mutual fund data.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedPortfolios && (
        <>
          {/* Summary Cards */}
          {summaryData && (
            <CombinedSummaryCard 
              summary={summaryData.overall}
              portfolioCount={summaryData.portfolio_count}
              mode={summaryData.mode}
            />
          )}

          {/* Portfolio Value Chart */}
          <CombinedPortfolioChart 
            portfolioIds={selectedPortfolioIds}
            mode={selectedPortfolioIds.length === 1 ? 'single' : 'combined'}
          />

          {/* Portfolio Breakdown Table */}
          {summaryData && (
            <PortfolioBreakdownTable 
              portfolios={summaryData.portfolios || []}
              mode={summaryData.mode}
            />
          )}
        </>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by scheme, ISIN, or folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Scheme Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheme Type
              </label>
              <select
                value={schemeTypeFilter}
                onChange={(e) => setSchemeTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Types</option>
                {uniqueSchemeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* AMC Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AMC
              </label>
              <select
                value={amcFilter}
                onChange={(e) => setAmcFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All AMCs</option>
                {uniqueAmcs.map(amc => (
                  <option key={amc} value={amc}>{amc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Holdings Table */}
      {loading ? (
        <TableSkeleton rows={10} />
      ) : !combinedSummary || filteredAndSortedHoldings.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-gray-400" />}
          title={searchTerm || schemeTypeFilter !== 'All' || amcFilter !== 'All' ? 'No holdings match your filters' : selectedPortfolioIds.length === 0 ? 'No Portfolios Selected' : 'No Holdings Found'}
          description={searchTerm || schemeTypeFilter !== 'All' || amcFilter !== 'All' ? 'Try adjusting your search or filter criteria' : selectedPortfolioIds.length === 0 ? 'Select portfolios from the navbar to view holdings' : 'Import your CAS statement to see holdings'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('scheme')}>
                    <div className="flex items-center gap-2">
                      Scheme Name
                      {sortBy === 'scheme' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ISIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folios</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('invested')}>
                    <div className="flex items-center justify-end gap-2">
                      Invested
                      {sortBy === 'invested' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('current')}>
                    <div className="flex items-center justify-end gap-2">
                      Current Value
                      {sortBy === 'current' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('pl')}>
                    <div className="flex items-center justify-end gap-2">
                      Total P&L
                      {sortBy === 'pl' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('returns')}>
                    <div className="flex items-center justify-end gap-2">
                      Returns
                      {sortBy === 'returns' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedHoldings.map((fund: any) => (
                  <>
                    <tr key={fund.isin} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{fund.schemeName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{fund.amc}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fund.isin}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{fund.folios.length}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono">{formatNumber(fund.currentUnits)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(fund.totalInvested)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(fund.currentValue)}</td>
                      <td className={`px-6 py-4 text-sm text-right font-mono font-medium ${fund.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(fund.totalProfitLoss)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-mono font-medium ${fund.plPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercentage(fund.plPercentage)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setExpandedFolio(expandedFolio === fund.isin ? null : fund.isin)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          {expandedFolio === fund.isin ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Folio Details */}
                    {expandedFolio === fund.isin && (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Folio Details</h4>
                            <div className="overflow-x-auto overflow-y-visible">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Portfolio</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Folio Number</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Units</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Avg Buy Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Current NAV</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">1 Day Return</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Invested</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Current Value</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Realized P&L</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Unrealized P&L</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total P&L</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Returns %</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                  {fund.folios.map((folio: Folio) => (
                                    <tr key={`${folio.portfolioId}-${folio.folioNumber}`} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <td className="px-4 py-2 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                          <Tag className="w-3 h-3 mr-1" />
                                          {folio.portfolioName}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">{folio.folioNumber}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatNumber(folio.currentUnits)}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.averageBuyPrice)}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.currentNav)}</td>
                                      <td className="px-4 py-2 text-sm text-right font-mono text-gray-500 dark:text-gray-400">-</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.totalInvested)}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.currentValue)}</td>
                                      <td className={`px-4 py-2 text-sm text-right font-mono ${folio.realizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(folio.realizedProfitLoss)}
                                      </td>
                                      <td className={`px-4 py-2 text-sm text-right font-mono ${folio.unrealizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(folio.unrealizedProfitLoss)}
                                      </td>
                                      <td className={`px-4 py-2 text-sm text-right font-mono font-medium ${folio.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(folio.totalProfitLoss)}
                                      </td>
                                      <td className={`px-4 py-2 text-sm text-right font-mono font-medium ${folio.unrealizedProfitLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatPercentage(folio.unrealizedProfitLossPercentage)}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <div className="relative inline-block text-left actions-menu-container">
                                          <button
                                            onClick={(e) => {
                                              const rect = e.currentTarget.getBoundingClientRect()
                                              setMenuPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.right - 192 + window.scrollX
                                              })
                                              setOpenActionsMenu(openActionsMenu === `${folio.portfolioId}-${folio.folioNumber}` ? null : `${folio.portfolioId}-${folio.folioNumber}`)
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                          >
                                            <MoreVertical className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedHoldings.length} {filteredAndSortedHoldings.length === 1 ? 'scheme' : 'schemes'}
              </span>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Invested</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(combinedSummary.portfolioOverview.totalInvested)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Value</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(combinedSummary.portfolioOverview.currentValue)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total P&L</div>
                  <div className={`font-semibold ${combinedSummary.portfolioOverview.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(combinedSummary.portfolioOverview.totalProfitLoss)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">1 Day Return</div>
                  <div className="font-semibold text-gray-500 dark:text-gray-400">
                    -
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Actions Menu */}
      {openActionsMenu && menuPosition && (
        <div
          className="fixed z-50 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 actions-menu-container"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                const [portfolioId, folioNum] = openActionsMenu.split('-')
                const fund = filteredAndSortedHoldings.find((f: any) =>
                  f.folios.some((fol: any) => `${fol.portfolioId}-${fol.folioNumber}` === openActionsMenu)
                )
                if (fund) {
                  setSelectedFolioForTransactions({
                    portfolioId: parseInt(portfolioId),
                    folioNumber: folioNum,
                    schemeName: fund.schemeName
                  })
                  setShowTransactionsModal(true)
                }
                setOpenActionsMenu(null)
                setMenuPosition(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-3" />
              View Transactions
            </button>
            <button
              type="button"
              onClick={() => {
                const [portfolioId, folioNum] = openActionsMenu.split('-')
                const folio = filteredAndSortedHoldings
                  .flatMap((f: any) => f.folios)
                  .find((fol: any) => `${fol.portfolioId}-${fol.folioNumber}` === openActionsMenu)
                const fund = filteredAndSortedHoldings.find((f: any) =>
                  f.folios.some((fol: any) => `${fol.portfolioId}-${fol.folioNumber}` === openActionsMenu)
                )
                
                if (folio && fund) {
                  setPrefilledTransactionData({
                    scheme: {
                      isin: fund.isin,
                      schemeName: fund.schemeName,
                      amc: fund.amc,
                      schemeType: fund.schemeType
                    },
                    folioNumber: folio.folioNumber
                  })
                }
                
                setShowAddTransactionModal(true)
                setOpenActionsMenu(null)
                setMenuPosition(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-3" />
              Add Transaction
            </button>
            <button
              type="button"
              onClick={() => {
                toast.info('Delete transaction feature coming soon')
                setOpenActionsMenu(null)
                setMenuPosition(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Delete Transaction
            </button>
          </div>
        </div>
      )}
      
      {/* Add Transaction Modal */}
      {selectedPortfolioIds.length > 0 && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => {
            setShowAddTransactionModal(false)
            setPrefilledTransactionData({})
          }}
          portfolioId={selectedPortfolioIds.length === 1 ? selectedPortfolioIds[0] : (prefilledTransactionData.scheme ? 
            filteredAndSortedHoldings
              .flatMap((f: any) => f.folios)
              .find((fol: any) => fol.folioNumber === prefilledTransactionData.folioNumber)?.portfolioId || selectedPortfolioIds[0]
            : selectedPortfolioIds[0])}
          onSuccess={handleTransactionAdded}
          prefilledScheme={prefilledTransactionData.scheme as any}
          prefilledFolioNumber={prefilledTransactionData.folioNumber}
        />
      )}
      
      {/* Folio Transactions Modal */}
      {selectedFolioForTransactions && (
        <FolioTransactionsModal
          isOpen={showTransactionsModal}
          onClose={() => {
            setShowTransactionsModal(false)
            setSelectedFolioForTransactions(null)
          }}
          portfolioId={selectedFolioForTransactions.portfolioId}
          folioNumber={selectedFolioForTransactions.folioNumber}
          schemeName={selectedFolioForTransactions.schemeName}
        />
      )}
    </div>
  )
}
