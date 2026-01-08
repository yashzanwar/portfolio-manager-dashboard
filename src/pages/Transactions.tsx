import { useState, useEffect, useMemo } from 'react'
import { Download, Search, Filter, Calendar } from 'lucide-react'
import { Card } from '../components/common/Card'
import { Button, TableSkeleton, EmptyState } from '../components/common'
import { PortfolioSelector } from '../components/portfolio/PortfolioSelector'
import { usePortfolios } from '../hooks/usePortfolios'
import { Portfolio } from '../types/portfolio'
import { PortfolioAPI } from '../services/portfolioApi'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  transactionDate: string
  transactionType: string
  description: string
  units: number
  nav: number
  amount: number
  schemeName: string
  folioNumber: string
  uniqueTransactionId: string
}

export default function Transactions() {
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Select default portfolio
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const primary = portfolios.find(p => p.isPrimary) || portfolios[0]
      setSelectedPortfolio(primary)
    }
  }, [portfolios, selectedPortfolio])

  // Fetch all transactions
  useEffect(() => {
    if (!selectedPortfolio) return

    const fetchAllTransactions = async () => {
      setLoading(true)
      try {
        const summary = await PortfolioAPI.getPortfolioSummary(selectedPortfolio.id)
        const allTransactions: Transaction[] = []

        // Fetch transactions for each folio
        for (const fund of summary.funds || []) {
          for (const folio of fund.folios || []) {
            try {
              const folioTransactions = await PortfolioAPI.getFolioTransactions(
                selectedPortfolio.id,
                folio.folio_number || folio.folioNumber,
                fund.isin // Pass ISIN to filter by scheme
              )
              
              // Add scheme and folio info to each transaction
              const enrichedTransactions = folioTransactions.map((t: any) => ({
                ...t,
                schemeName: fund.scheme_name || fund.schemeName,
                folioNumber: folio.folio_number || folio.folioNumber,
              }))
              
              allTransactions.push(...enrichedTransactions)
            } catch (error) {
              console.error('Error fetching transactions for folio:', folio.folio_number, error)
            }
          }
        }

        // Sort by date descending
        allTransactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
        setTransactions(allTransactions)
      } catch (error: any) {
        console.error('Error fetching transactions:', error)
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchAllTransactions()
  }, [selectedPortfolio])

  // Get unique transaction types for filter
  const transactionTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.transactionType))
    return ['All', ...Array.from(types)]
  }, [transactions])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        t.schemeName?.toLowerCase().includes(searchLower) ||
        t.folioNumber?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.transactionType?.toLowerCase().includes(searchLower)

      // Type filter
      const matchesType = typeFilter === 'All' || t.transactionType === typeFilter

      // Date filters
      const txDate = new Date(t.transactionDate)
      const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || txDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo
    })
  }, [transactions, searchTerm, typeFilter, dateFrom, dateTo])

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export')
      return
    }

    const headers = ['Date', 'Scheme', 'Folio', 'Type', 'Description', 'Units', 'NAV', 'Amount']
    const rows = filteredTransactions.map(t => [
      t.transactionDate,
      t.schemeName,
      t.folioNumber,
      t.transactionType,
      t.description || '',
      t.units?.toFixed(3) || '0',
      t.nav?.toFixed(4) || '0',
      t.amount?.toFixed(2) || '0'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `all_transactions_${selectedPortfolio?.name}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Transactions exported successfully')
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE':
      case 'PURCHASE_SIP':
        return 'text-green-600 dark:text-green-400'
      case 'REDEMPTION':
      case 'REDEMPTION_SWP':
        return 'text-red-600 dark:text-red-400'
      case 'SWITCH_IN':
        return 'text-blue-600 dark:text-blue-400'
      case 'SWITCH_OUT':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Calculate summary
  const summary = useMemo(() => {
    const totalPurchases = filteredTransactions
      .filter(t => t.transactionType?.toUpperCase().includes('PURCHASE'))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalRedemptions = filteredTransactions
      .filter(t => t.transactionType?.toUpperCase().includes('REDEMPTION'))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    
    const totalUnits = filteredTransactions
      .reduce((sum, t) => sum + (t.units || 0), 0)

    return { totalPurchases, totalRedemptions, totalUnits, count: filteredTransactions.length }
  }, [filteredTransactions])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and filter all your portfolio transactions</p>
      </div>

      {/* Portfolio Selector */}
      <div className="mb-6">
        <PortfolioSelector
          portfolios={portfolios}
          selectedPortfolio={selectedPortfolio}
          onSelectPortfolio={setSelectedPortfolio}
          isLoading={loadingPortfolios}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by scheme, folio, or description..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : formatTransactionType(type)}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || typeFilter !== 'All' || dateFrom || dateTo) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('All')
                setDateFrom('')
                setDateTo('')
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.count}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Purchases</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(summary.totalPurchases)}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Redemptions</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(summary.totalRedemptions)}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500 dark:text-gray-400">Net Units</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(summary.totalUnits)}</div>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Transactions {filteredTransactions.length > 0 && `(${filteredTransactions.length})`}
          </h2>
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <TableSkeleton rows={10} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title="No Transactions Found"
            description={searchTerm || typeFilter !== 'All' || dateFrom || dateTo 
              ? "Try adjusting your filters" 
              : "No transactions available for this portfolio"}
          />
        ) : (
          <div className="overflow-x-auto" key={`${typeFilter}-${searchTerm}-${dateFrom}-${dateTo}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scheme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NAV</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.uniqueTransactionId || `${transaction.folioNumber}-${transaction.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={transaction.schemeName}>
                        {transaction.schemeName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                      {transaction.folioNumber}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={`font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                        {formatTransactionType(transaction.transactionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="max-w-md truncate" title={transaction.description}>
                        {transaction.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {formatNumber(transaction.units)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {formatCurrency(transaction.nav)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-mono whitespace-nowrap">
                      <span className={transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
