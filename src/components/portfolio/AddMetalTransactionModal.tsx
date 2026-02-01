import { useState, useEffect } from 'react'
import { Gem, Calendar, DollarSign, Hash, Scale } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { metalApi } from '../../services/metalApi'
import toast from 'react-hot-toast'

interface AddMetalTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioId: number
  onSuccess: () => void
}

type MetalType = 'GOLD' | 'SILVER'
type Purity = '24K' | '22K' | '18K' | '.999' | '.925'
type TransactionType = 'BUY' | 'SELL'

interface MetalScheme {
  metalType: MetalType
  purity: Purity
  label: string
  schemeCode: string
}

const metalSchemes: MetalScheme[] = [
  { metalType: 'GOLD', purity: '24K', label: 'Gold 24K (99.9% pure)', schemeCode: 'GOLD_24K' },
  { metalType: 'GOLD', purity: '22K', label: 'Gold 22K (91.67% pure)', schemeCode: 'GOLD_22K' },
  { metalType: 'GOLD', purity: '18K', label: 'Gold 18K (75% pure)', schemeCode: 'GOLD_18K' },
  { metalType: 'SILVER', purity: '.999', label: 'Silver .999 (99.9% pure)', schemeCode: 'SILVER_999' },
  { metalType: 'SILVER', purity: '.925', label: 'Silver .925 (Sterling)', schemeCode: 'SILVER_925' },
]

export function AddMetalTransactionModal({
  isOpen,
  onClose,
  portfolioId,
  onSuccess,
}: AddMetalTransactionModalProps) {
  const [selectedMetal, setSelectedMetal] = useState<MetalScheme>(metalSchemes[0])
  const [transactionType, setTransactionType] = useState<TransactionType>('BUY')
  const [transactionDate, setTransactionDate] = useState('')
  const [itemName, setItemName] = useState('') // Item name for tracking individual pieces
  const [weightGrams, setWeightGrams] = useState('')
  const [pricePerGram, setPricePerGram] = useState('')
  const [makingCharges, setMakingCharges] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Set default date to today
  useEffect(() => {
    if (isOpen && !transactionDate) {
      const today = new Date().toISOString().split('T')[0]
      setTransactionDate(today)
    }
  }, [isOpen, transactionDate])

  const calculateTotalAmount = () => {
    const weight = parseFloat(weightGrams) || 0
    const price = parseFloat(pricePerGram) || 0
    const making = parseFloat(makingCharges) || 0
    
    if (weight <= 0 || price <= 0) return 0
    
    return (weight * price) + making
  }

  const totalAmount = calculateTotalAmount()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const weight = parseFloat(weightGrams)
    const price = parseFloat(pricePerGram)
    const making = parseFloat(makingCharges) || 0

    // Validation
    if (!selectedMetal) {
      toast.error('Please select a metal type and purity')
      return
    }
    if (!transactionDate) {
      toast.error('Please select a transaction date')
      return
    }
    if (transactionType === 'BUY' && (!itemName || itemName.trim() === '')) {
      toast.error('Please enter an item name (e.g., "Wedding Necklace", "Gold Coin")')
      return
    }
    if (!weight || weight <= 0) {
      toast.error('Please enter a valid weight in grams')
      return
    }
    if (!price || price <= 0) {
      toast.error('Please enter a valid price per gram')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        portfolioId,
        schemeCode: selectedMetal.schemeCode,
        transactionDate,
        transactionType,
        units: weight, // Weight in grams
        pricePerUnit: price, // Price per gram
        makingCharges: making,
        itemName: itemName.trim() || undefined, // Item name for folio tracking
        description: description || undefined,
      }

      if (transactionType === 'BUY') {
        await metalApi.addBuyTransaction(payload)
        toast.success(`Metal purchase added successfully! ${weight}g ${selectedMetal.label}`)
      } else {
        await metalApi.addSellTransaction(payload)
        toast.success(`Metal sale added successfully! ${weight}g ${selectedMetal.label}`)
      }

      // Reset form
      setItemName('')
      setWeightGrams('')
      setPricePerGram('')
      setMakingCharges('')
      setDescription('')
      const today = new Date().toISOString().split('T')[0]
      setTransactionDate(today)

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error adding metal transaction:', error)
      toast.error(error.response?.data?.message || 'Failed to add metal transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Precious Metal Transaction"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransactionType('BUY')}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${transactionType === 'BUY'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'}
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                Purchase
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('SELL')}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${transactionType === 'SELL'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'}
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                Sale
              </div>
            </button>
          </div>
        </div>

        {/* Metal Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Gem className="inline w-4 h-4 mr-1" />
            Metal Type & Purity
          </label>
          <select
            value={metalSchemes.findIndex(m => m.schemeCode === selectedMetal.schemeCode)}
            onChange={(e) => setSelectedMetal(metalSchemes[parseInt(e.target.value)])}
            className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {metalSchemes.map((metal, index) => (
              <option key={metal.schemeCode} value={index}>
                {metal.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Transaction Date
          </label>
          <Input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Item Name (required for BUY) */}
        {transactionType === 'BUY' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Gem className="inline w-4 h-4 mr-1" />
              Item Name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Wedding Necklace, Gold Coin, Anniversary Ring"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Give a unique name to track this item separately
            </p>
          </div>
        )}

        {/* Weight in Grams */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Scale className="inline w-4 h-4 mr-1" />
            Weight (grams)
          </label>
          <Input
            type="number"
            step="0.001"
            min="0"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            placeholder="e.g., 10.500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the weight in grams (supports up to 3 decimal places)
          </p>
        </div>

        {/* Price Per Gram */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Price Per Gram (₹)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={pricePerGram}
            onChange={(e) => setPricePerGram(e.target.value)}
            placeholder="e.g., 7050.00"
            required
          />
        </div>

        {/* Making Charges (optional, only for BUY) */}
        {transactionType === 'BUY' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Hash className="inline w-4 h-4 mr-1" />
              Making Charges (₹) <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={makingCharges}
              onChange={(e) => setMakingCharges(e.target.value)}
              placeholder="e.g., 500.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Additional charges for making jewelry (not included in price per gram)
            </p>
          </div>
        )}

        {/* Description (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Gold coin, Wedding ring, etc."
            rows={2}
            className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Total Amount Display */}
        {totalAmount > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Amount:</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {transactionType === 'BUY' && parseFloat(makingCharges) > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    (₹{(parseFloat(weightGrams) * parseFloat(pricePerGram)).toLocaleString('en-IN', { minimumFractionDigits: 2 })} + ₹{parseFloat(makingCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })} making)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !weightGrams || !pricePerGram}
            className="flex-1"
          >
            {submitting ? 'Adding...' : `Add ${transactionType === 'BUY' ? 'Purchase' : 'Sale'}`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
