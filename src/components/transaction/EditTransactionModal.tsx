import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Transaction, TransactionRequest } from '../../services/transactionApi'
import { useUpdateTransaction } from '../../hooks/useTransactions'
import { Button } from '../common/Button'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  portfolioId: number
}

const TRANSACTION_TYPES = [
  { value: 'PURCHASE', label: 'Purchase', assetTypes: ['MUTUAL_FUND'] },
  { value: 'PURCHASE_SIP', label: 'SIP Purchase', assetTypes: ['MUTUAL_FUND'] },
  { value: 'REDEMPTION', label: 'Redemption', assetTypes: ['MUTUAL_FUND'] },
  { value: 'REDEMPTION_SWP', label: 'SWP Redemption', assetTypes: ['MUTUAL_FUND'] },
  { value: 'SWITCH_IN', label: 'Switch In', assetTypes: ['MUTUAL_FUND'] },
  { value: 'SWITCH_OUT', label: 'Switch Out', assetTypes: ['MUTUAL_FUND'] },
  { value: 'DIVIDEND_REINVEST', label: 'Dividend Reinvest', assetTypes: ['MUTUAL_FUND'] },
  { value: 'STOCK_BUY', label: 'Buy', assetTypes: ['EQUITY_STOCK'] },
  { value: 'STOCK_SELL', label: 'Sell', assetTypes: ['EQUITY_STOCK'] },
  { value: 'BONUS', label: 'Bonus', assetTypes: ['EQUITY_STOCK'] },
  { value: 'STOCK_SPLIT', label: 'Stock Split', assetTypes: ['EQUITY_STOCK'] },
]

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  portfolioId
}: EditTransactionModalProps) {
  const { mutate: updateTransaction, isPending } = useUpdateTransaction()
  
  // Helper to format date to YYYY-MM-DD for HTML input
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return ''
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof dateValue === 'string') {
      // If it contains 'T', it's an ISO datetime, extract just the date part
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0]
      }
      return dateValue
    }
    
    // If it's an array [year, month, day] from Java LocalDate
    if (Array.isArray(dateValue) && dateValue.length >= 3) {
      const [year, month, day] = dateValue
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]
    }
    
    return String(dateValue)
  }
  
  const [formData, setFormData] = useState<TransactionRequest>({
    isin: transaction.isin || '',
    folioNumber: transaction.folioNumber,
    transactionDate: formatDateForInput(transaction.transactionDate),
    transactionType: transaction.transactionType,
    units: transaction.units,
    amount: transaction.amount,
    pricePerShare: transaction.assetType === 'EQUITY_STOCK' ? transaction.nav : transaction.nav,
    brokerage: transaction.brokerage || 0,
    description: transaction.description || ''
  })

  const isStockTransaction = transaction.assetType === 'EQUITY_STOCK'
  
  // Update form data when transaction changes
  useEffect(() => {
    setFormData({
      isin: transaction.isin || '',
      folioNumber: transaction.folioNumber,
      transactionDate: formatDateForInput(transaction.transactionDate),
      transactionType: transaction.transactionType,
      units: transaction.units,
      amount: transaction.amount,
      pricePerShare: transaction.nav,
      brokerage: transaction.brokerage || 0,
      description: transaction.description || ''
    })
  }, [transaction])
  
  // Filter transaction types based on current asset type
  const availableTypes = TRANSACTION_TYPES.filter(t => 
    t.assetTypes.includes(transaction.assetType || 'MUTUAL_FUND')
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateTransaction({
      transactionId: transaction.id,
      portfolioId,
      data: formData
    }, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  const handleChange = (field: keyof TransactionRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {transaction.schemeName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Edit Transaction
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.transactionType}
              onChange={(e) => handleChange('transactionType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {availableTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Date
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => handleChange('transactionDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isStockTransaction ? 'Quantity' : 'Units'} {isStockTransaction && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.units || ''}
                onChange={(e) => handleChange('units', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required={isStockTransaction}
                placeholder={isStockTransaction ? 'Number of shares' : 'Number of units'}
              />
            </div>

            {/* Stock Price or NAV */}
            {isStockTransaction ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerShare || ''}
                  onChange={(e) => handleChange('pricePerShare', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Price per share"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NAV
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.pricePerShare || ''}
                  onChange={(e) => handleChange('pricePerShare', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Net Asset Value"
                />
              </div>
            )}
          </div>

          {/* Brokerage (for stocks) */}
          {isStockTransaction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brokerage (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.brokerage || ''}
                onChange={(e) => handleChange('brokerage', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Brokerage charges"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Add a note about this transaction..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
