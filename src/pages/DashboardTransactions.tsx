import { useState, useEffect } from 'react'
import { usePortfolioContext } from '../context/PortfolioContext'
import { FileText, Download, Search, Filter, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { EmptyState } from '../components/common'
import { Button } from '../components/common/Button'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import { apiClient } from '../services/api'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  transactionDate: string
  transactionType: string
  description: string
  units: number
  nav: number
  amount: number
  folioNumber: string
  schemeName: string
  isin?: string
}

export default function DashboardTransactions() {
  const { selectedPortfolioIds } = usePortfolioContext()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (selectedPortfolioIds.length > 0) {
      fetchTransactions()
    } else {
      setTransactions([])
    }
  }, [selectedPortfolioIds])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const allTransactions: Transaction[] = []
      
      // Fetch transactions for each selected portfolio
      for (const portfolioId of selectedPortfolioIds) {
        try {
          const response = await apiClient.get(`/transactions?portfolioId=${portfolioId}`)
          allTransactions.push(...response.data)
        } catch (error) {
          console.error(`Error fetching transactions for portfolio ${portfolioId}:`, error)
        }
      }
      
      // Sort by date descending (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      )
      
      setTransactions(allTransactions)
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE':
      case 'PURCHASE_SIP':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'REDEMPTION':
      case 'REDEMPTION_SWP':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'SWITCH_IN':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'SWITCH_OUT':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
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
  const totalPurchase = transactions
    .filter(t => t.transactionType?.toUpperCase().includes('PURCHASE'))
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalRedemption = transactions
    .filter(t => t.transactionType?.toUpperCase().includes('REDEMPTION'))
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Transactions
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                No Portfolios Selected
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredTransactions.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchase</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(totalPurchase)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Redemption</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(totalRedemption)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by scheme, folio, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              {/* Type Filter */}
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12 text-gray-400" />}
                title="No Transactions Found"
                description={searchTerm || typeFilter !== 'all' 
                  ? "No transactions match your filters" 
                  : "No transactions available for the selected portfolios"}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Scheme
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Units
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        NAV
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {transaction.transactionType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate" title={transaction.schemeName}>
                          {transaction.schemeName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {transaction.folioNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono">
                          {formatNumber(transaction.units, 3)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono">
                          {formatCurrency(transaction.nav)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                          <span className={transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
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
    </div>
  )
}
