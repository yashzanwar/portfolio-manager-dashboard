import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import { PortfolioAPI } from '../../services/portfolioApi'
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

interface FolioTransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioId: number
  folioNumber: string
  schemeName: string
}

export function FolioTransactionsModal({
  isOpen,
  onClose,
  portfolioId,
  folioNumber,
  schemeName
}: FolioTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && portfolioId && folioNumber) {
      fetchTransactions()
    }
  }, [isOpen, portfolioId, folioNumber])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const data = await PortfolioAPI.getFolioTransactions(portfolioId, folioNumber)
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {schemeName}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Folio: {folioNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToCSV}
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
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
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${getTransactionTypeColor(transaction.transactionType)}`}>
                    {transaction.transactionType?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono">
                    {formatNumber(transaction.units, 3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono">
                    {formatCurrency(transaction.nav)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total Transactions: {transactions.length}
              </span>
              <div className="flex gap-6">
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
    </Modal>
  )
}
