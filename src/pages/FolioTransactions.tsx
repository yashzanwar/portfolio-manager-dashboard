import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { Button, TableSkeleton, EmptyState } from '../components/common'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import { PortfolioAPI } from '../services/portfolioApi'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  transactionDate: string
  transactionType: string
  description: string
  units: number
  nav: number
  amount: number
  uniqueTransactionId: string
}

export default function FolioTransactions() {
  const { portfolioId, folioNumber } = useParams<{ portfolioId: string; folioNumber: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const schemeName = searchParams.get('scheme') || 'Unknown Scheme'

  useEffect(() => {
    if (portfolioId && folioNumber) {
      fetchTransactions()
    }
  }, [portfolioId, folioNumber])

  const fetchTransactions = async () => {
    if (!portfolioId || !folioNumber) return
    
    setLoading(true)
    try {
      const data = await PortfolioAPI.getFolioTransactions(Number(portfolioId), folioNumber)
      setTransactions(data)
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export')
      return
    }

    const headers = ['Date', 'Type', 'Description', 'Units', 'NAV', 'Amount']
    const rows = transactions.map(t => [
      t.transactionDate,
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
    link.download = `transactions_${folioNumber}_${new Date().toISOString().split('T')[0]}.csv`
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

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/holdings')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Holdings
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{schemeName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Folio: {folioNumber}</p>
          </div>
          
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

          {/* Content */}
          {loading ? (
            <TableSkeleton rows={10} />
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No Transactions Found"
              description="There are no transactions for this folio"
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Units
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        NAV
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono">
                          {formatNumber(transaction.units, 3)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono">
                          {formatCurrency(transaction.nav)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-mono font-medium">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-6 py-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Transactions: {transactions.length}
                  </span>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Purchase</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(
                          transactions
                            .filter(t => t.transactionType?.toUpperCase().includes('PURCHASE'))
                            .reduce((sum, t) => sum + (t.amount || 0), 0)
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Redemption</div>
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(
                          transactions
                            .filter(t => t.transactionType?.toUpperCase().includes('REDEMPTION'))
                            .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}
