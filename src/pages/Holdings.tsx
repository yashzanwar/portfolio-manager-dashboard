import { useState, useEffect, useMemo } from 'react'
import { Download, Search, Filter, ChevronDown, ChevronUp, MoreVertical, Eye, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Button, TableSkeleton, EmptyState } from '../components/common'
import { PortfolioSelector } from '../components/portfolio/PortfolioSelector'
import { AddTransactionModal } from '../components/portfolio/AddTransactionModal'
import { usePortfolios } from '../hooks/usePortfolios'
import { Portfolio } from '../types/portfolio'
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
}

interface Fund {
  isin: string
  schemeName: string
  amc: string
  schemeType: string
  folios: Folio[]
}

interface PortfolioSummary {
  investorName: string
  portfolioOverview: {
    totalInvested: number
    currentValue: number
    totalProfitLoss: number
    totalProfitLossPercentage: number
  }
  funds: Fund[]
}

export default function Holdings() {
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  const navigate = useNavigate()
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(false)
  
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

  // Select default portfolio
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const primary = portfolios.find(p => p.isPrimary) || portfolios[0]
      setSelectedPortfolio(primary)
    }
  }, [portfolios, selectedPortfolio])

  // Fetch portfolio summary
  const fetchSummary = async () => {
    if (!selectedPortfolio) return

    setLoading(true)
    try {
      const data = await PortfolioAPI.getPortfolioSummary(selectedPortfolio.id)
      
      // Transform snake_case from backend to camelCase for frontend
      const transformedData = {
        investorName: data.investor_name || data.investorName || 'No Data',
        portfolioOverview: {
          totalInvested: data.portfolio_overview?.total_invested ?? data.portfolioOverview?.totalInvested ?? 0,
          currentValue: data.portfolio_overview?.current_value ?? data.portfolioOverview?.currentValue ?? 0,
          totalProfitLoss: data.portfolio_overview?.total_profit_loss ?? data.portfolioOverview?.totalProfitLoss ?? 0,
          totalProfitLossPercentage: data.portfolio_overview?.unrealized_profit_loss_percentage ?? data.portfolioOverview?.totalProfitLossPercentage ?? 0,
        },
        funds: (data.funds || []).map((fund: any) => ({
          isin: fund.isin,
          schemeName: fund.scheme_name || fund.schemeName,
          amc: fund.amc,
          schemeType: fund.scheme_type || fund.schemeType,
          folios: (fund.folios || []).map((folio: any) => {
            // Handle both snake_case (from backend) and camelCase (from cached data)
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
            }
          })
        }))
      }
      
      setSummary(transformedData)
    } catch (err: any) {
      console.error('Error fetching holdings:', err)
      toast.error('Failed to load holdings data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [selectedPortfolio])

  // Get unique AMCs and scheme types
  const { uniqueAmcs, uniqueSchemeTypes } = useMemo(() => {
    if (!summary) return { uniqueAmcs: [], uniqueSchemeTypes: [] }
    
    const amcs = new Set<string>()
    const types = new Set<string>()
    
    summary.funds.forEach(fund => {
      if (fund.amc) amcs.add(fund.amc)
      if (fund.schemeType) types.add(fund.schemeType)
    })
    
    return {
      uniqueAmcs: Array.from(amcs).sort(),
      uniqueSchemeTypes: Array.from(types).sort()
    }
  }, [summary])

  // Filter and sort holdings
  const filteredAndSortedHoldings = useMemo(() => {
    if (!summary) return []
    
    let filtered = summary.funds.filter(fund => {
      const matchesSearch = fund.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.isin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.folios.some(f => f.folioNumber.includes(searchTerm))
      
      const matchesSchemeType = schemeTypeFilter === 'All' || fund.schemeType === schemeTypeFilter
      const matchesAmc = amcFilter === 'All' || fund.amc === amcFilter
      
      return matchesSearch && matchesSchemeType && matchesAmc
    })
    
    // Calculate totals for each fund
    const withTotals = filtered.map(fund => {
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
  }, [summary, searchTerm, schemeTypeFilter, amcFilter, sortBy, sortOrder])

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const handleTransactionAdded = () => {
    fetchSummary() // Refresh holdings data
  }

  const exportToCSV = () => {
    if (!summary || filteredAndSortedHoldings.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const headers = ['Scheme Name', 'AMC', 'ISIN', 'Scheme Type', 'Folio Number', 'Units', 'Avg Buy Price', 'Current NAV', 'Invested', 'Current Value', 'Realized P&L', 'Unrealized P&L', 'Total P&L', 'Returns %']
    
    const rows = filteredAndSortedHoldings.flatMap(fund =>
      fund.folios.map(folio => [
        fund.schemeName,
        fund.amc,
        fund.isin,
        fund.schemeType,
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
    link.download = `holdings_${selectedPortfolio?.portfolioName}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('Holdings exported successfully')
  }

  if (loadingPortfolios) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <TableSkeleton rows={10} />
      </div>
    )
  }

  if (portfolios.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <EmptyState
          icon={<Filter className="w-8 h-8 text-gray-400" />}
          title="No Portfolios Found"
          description="Create a portfolio and import your CAS statement to view holdings"
          action={{
            label: 'Go to Portfolios',
            onClick: () => window.location.href = '/portfolios'
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Holdings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed view of your investment holdings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <PortfolioSelector
            portfolios={portfolios}
            selectedPortfolio={selectedPortfolio}
            onSelect={setSelectedPortfolio}
            isLoading={loadingPortfolios}
          />
          <Button
            variant="primary"
            onClick={() => setShowAddTransactionModal(true)}
            disabled={!selectedPortfolio}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={!summary || filteredAndSortedHoldings.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

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
      ) : !summary || filteredAndSortedHoldings.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-gray-400" />}
          title={searchTerm || schemeTypeFilter !== 'All' || amcFilter !== 'All' ? 'No holdings match your filters' : 'No Holdings Found'}
          description={searchTerm || schemeTypeFilter !== 'All' || amcFilter !== 'All' ? 'Try adjusting your search or filter criteria' : 'Import your CAS statement to see holdings'}
          action={!(searchTerm || schemeTypeFilter !== 'All' || amcFilter !== 'All') ? {
            label: 'Import CAS',
            onClick: () => window.location.href = '/import'
          } : undefined}
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
                        <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Folio Details</h4>
                            <div className="overflow-x-auto overflow-y-visible">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Folio Number</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Units</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Avg Buy Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Current NAV</th>
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
                                    <tr key={folio.folioNumber} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">{folio.folioNumber}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatNumber(folio.currentUnits)}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.averageBuyPrice)}</td>
                                      <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white font-mono">{formatCurrency(folio.currentNav)}</td>
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
                                                left: rect.right - 192 + window.scrollX // 192px is menu width (w-48)
                                              })
                                              setOpenActionsMenu(openActionsMenu === folio.folioNumber ? null : folio.folioNumber)
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
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.portfolioOverview.totalInvested)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Value</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.portfolioOverview.currentValue)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total P&L</div>
                  <div className={`font-semibold ${summary.portfolioOverview.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(summary.portfolioOverview.totalProfitLoss)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Actions Menu - Rendered with fixed positioning to avoid overflow issues */}
      {openActionsMenu && menuPosition && (
        <div
          className="fixed z-50 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 actions-menu-container"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                const folio = filteredAndSortedHoldings
                  .flatMap((f: any) => f.folios)
                  .find((fol: any) => fol.folioNumber === openActionsMenu)
                const fund = filteredAndSortedHoldings.find((f: any) =>
                  f.folios.some((fol: any) => fol.folioNumber === openActionsMenu)
                )
                if (folio && fund) {
                  navigate(`/holdings/${selectedPortfolio?.id}/folio/${encodeURIComponent(folio.folioNumber)}?scheme=${encodeURIComponent(fund.schemeName)}`)
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
      {selectedPortfolio && (
        <AddTransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => setShowAddTransactionModal(false)}
          portfolioId={selectedPortfolio.id}
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  )
}
