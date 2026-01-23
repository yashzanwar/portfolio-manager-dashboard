import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePortfolioContext } from '../context/PortfolioContext'
import { FileText, Download, Search, Filter, Info, TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react'
import { EmptyState } from '../components/common'
import { Button } from '../components/common/Button'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import { PortfolioAPI } from '../services/portfolioApi'
import { EditTransactionModal } from '../components/transaction/EditTransactionModal'
import { useDeleteTransaction } from '../hooks/useTransactions'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  transactionDate: string
  transactionType: string
  description: string
  units: number
  nav: number
  amount: number
  brokerage?: number
  folioNumber: string
  schemeName: string
  isin?: string
  assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK'
}

export default function DashboardTransactions() {
  const { selectedPortfolioIds } = usePortfolioContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'MUTUAL_FUND' | 'EQUITY_STOCK'>('all')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [currentPortfolioId, setCurrentPortfolioId] = useState<number | null>(null)
  const { mutate: deleteTransaction } = useDeleteTransaction()

  // Get URL parameters for filtering
  const urlIsin = searchParams.get('isin')
  const urlSymbol = searchParams.get('symbol')
  const urlScheme = searchParams.get('scheme')

  useEffect(() => {
    // Set search term from URL parameters if present
    if (urlScheme) {
      setSearchTerm(urlScheme)
    } else if (urlSymbol) {
      setSearchTerm(urlSymbol)
    }
  }, [urlIsin, urlSymbol, urlScheme])

  useEffect(() => {
    if (selectedPortfolioIds.length > 0) {
      fetchTransactions()
    } else {
      setTransactions([])
    }
  }, [selectedPortfolioIds, assetTypeFilter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Use V2 API for unified transaction fetching
      const data = await PortfolioAPI.getTransactionsV2(
        selectedPortfolioIds,
        { 
          assetType: assetTypeFilter === 'all' ? undefined : assetTypeFilter 
        }
      )
      
      setTransactions(data)
      // Set current portfolio ID for edit/delete operations
      if (selectedPortfolioIds.length > 0) {
        setCurrentPortfolioId(selectedPortfolioIds[0])
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleDelete = (transaction: Transaction) => {
    if (!currentPortfolioId) {
      toast.error('No portfolio selected')
      return
    }

    if (window.confirm(`Are you sure you want to delete this transaction?\n\nScheme: ${transaction.schemeName}\nDate: ${formatDate(transaction.transactionDate)}\nAmount: ${formatCurrency(transaction.amount)}`)) {
      deleteTransaction({
        transactionId: transaction.id,
        portfolioId: currentPortfolioId
      }, {
        onSuccess: () => {
          // Refresh transactions list
          fetchTransactions()
        }
      })
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE':
      case 'PURCHASE_SIP':
      case 'STOCK_BUY':
        return 'text-green-400 bg-green-900/30 border border-green-900'
      case 'REDEMPTION':
      case 'REDEMPTION_SWP':
      case 'STOCK_SELL':
        return 'text-red-400 bg-red-900/30 border border-red-900'
      case 'SWITCH_IN':
        return 'text-blue-400 bg-blue-900/30 border border-blue-900'
      case 'SWITCH_OUT':
        return 'text-orange-400 bg-orange-900/30 border border-orange-900'
      case 'DIVIDEND_REINVEST':
      case 'DIVIDEND_PAYOUT':
        return 'text-purple-400 bg-purple-900/30 border border-purple-900'
      case 'BONUS':
      case 'STOCK_SPLIT':
        return 'text-cyan-400 bg-cyan-900/30 border border-cyan-900'
      default:
        return 'text-gray-400 bg-gray-900/30 border border-gray-900'
    }
  }

  const isRedemptionType = (type: string) => {
    const upperType = type?.toUpperCase() || ''
    return upperType.includes('REDEMPTION') || 
           upperType === 'STOCK_SELL' || 
           upperType === 'SWITCH_OUT'
  }

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export')
      return
    }

    const headers = ['Date', 'Type', 'Scheme', 'Folio', 'Description', 'Units', 'NAV', 'Amount']
    const rows = filteredTransactions.map(t => [
      t.transactionDate,
      t.transactionType,
      t.schemeName || '',
      t.folioNumber || '',
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
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Transactions exported successfully')
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.folioNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || 
      t.transactionType?.toUpperCase() === typeFilter.toUpperCase()
    
    return matchesSearch && matchesType
  })

  // Get unique transaction types
  const transactionTypes = ['all', ...Array.from(new Set(transactions.map(t => t.transactionType)))]

  // Calculate summary stats
  // Include both mutual fund types (PURCHASE, PURCHASE_SIP) and stock types (STOCK_BUY)
  const totalPurchase = transactions
    .filter(t => {
      const type = t.transactionType?.toUpperCase() || ''
      return type.includes('PURCHASE') || type === 'STOCK_BUY' || type === 'SWITCH_IN'
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  // Include both mutual fund types (REDEMPTION, REDEMPTION_SWP) and stock types (STOCK_SELL)
  const totalRedemption = transactions
    .filter(t => {
      const type = t.transactionType?.toUpperCase() || ''
      return type.includes('REDEMPTION') || type === 'STOCK_SELL' || type === 'SWITCH_OUT'
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-300">
                Transactions
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                View and manage all your portfolio transactions
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={exportToCSV}
          variant="secondary"
          disabled={filteredTransactions.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Show message if no portfolios selected */}
      {selectedPortfolioIds.length === 0 && (
        <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-300">
                No Portfolios Selected
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Please select one or more portfolios from the dropdown in the navbar to view transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPortfolioIds.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-200 mt-1">
                    {filteredTransactions.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Purchase</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {formatCurrency(totalPurchase)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Redemption</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {formatCurrency(totalRedemption)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by scheme, folio, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-0 rounded-lg bg-gray-900 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Asset Type Filter */}
              <div className="md:w-48">
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={assetTypeFilter}
                    onChange={(e) => setAssetTypeFilter(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-2 border-0 rounded-lg bg-gray-900 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">All Assets</option>
                    <option value="MUTUAL_FUND">Mutual Funds</option>
                    <option value="EQUITY_STOCK">Stocks</option>
                  </select>
                </div>
              </div>
              
              {/* Type Filter */}
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-0 rounded-lg bg-gray-900 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-black border border-gray-900 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12 text-gray-600" />}
                title="No Transactions Found"
                description={searchTerm || typeFilter !== 'all' 
                  ? "No transactions match your filters" 
                  : "No transactions available for the selected portfolios"}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black border-b border-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheme
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        NAV
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black divide-y divide-gray-900">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-950 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {transaction.transactionType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate" title={transaction.schemeName}>
                          {transaction.schemeName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {transaction.folioNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                          {formatNumber(transaction.units, 3)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">
                          {formatCurrency(transaction.nav)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                          <span className={isRedemptionType(transaction.transactionType) 
                            ? 'text-red-400' 
                            : 'text-green-400'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-900 rounded transition-colors"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-900 rounded transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && currentPortfolioId && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => {
            setEditingTransaction(null)
            fetchTransactions() // Refresh after edit
          }}
          transaction={editingTransaction}
          portfolioId={currentPortfolioId}
        />
      )}
    </div>
  )
}
