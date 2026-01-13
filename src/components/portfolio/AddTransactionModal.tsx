import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Calendar, DollarSign, Hash } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

interface Scheme {
  id: number
  isin: string
  schemeName: string
  amc: string
  schemeType: string
  schemeCode: string
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioId: number
  onSuccess: () => void
  prefilledScheme?: Scheme
  prefilledFolioNumber?: string
}

type TransactionType = 'PURCHASE' | 'REDEMPTION' | 'PURCHASE_SIP' | 'REDEMPTION_SWP'
type InputMode = 'amount' | 'units'

export function AddTransactionModal({
  isOpen,
  onClose,
  portfolioId,
  onSuccess,
  prefilledScheme,
  prefilledFolioNumber
}: AddTransactionModalProps) {
  // Form state
  const [searchQuery, setSearchQuery] = useState('')
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [folioNumber, setFolioNumber] = useState('')
  const [transactionDate, setTransactionDate] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('PURCHASE')
  const [inputMode, setInputMode] = useState<InputMode>('amount')
  const [amount, setAmount] = useState('')
  const [units, setUnits] = useState('')
  const [description, setDescription] = useState('')

  // Schedule-specific state (for SIP/SWP)
  const [frequency, setFrequency] = useState('MONTHLY')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalInstallments, setTotalInstallments] = useState('')

  // Loading and NAV states
  const [searchingSchemes, setSearchingSchemes] = useState(false)
  const [fetchingNav, setFetchingNav] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [nav, setNav] = useState<number | null>(null)
  const [navDate, setNavDate] = useState<string | null>(null)

  // Calculated value
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null)

  // Set default date to today and handle prefilled data
  useEffect(() => {
    if (isOpen) {
      // Set default date
      if (!transactionDate) {
        const today = new Date().toISOString().split('T')[0]
        setTransactionDate(today)
      }
      
      // Pre-populate scheme if provided
      if (prefilledScheme && !selectedScheme) {
        setSelectedScheme(prefilledScheme)
        setSearchQuery(prefilledScheme.schemeName)
      }
      
      // Pre-populate folio number if provided
      if (prefilledFolioNumber && !folioNumber) {
        setFolioNumber(prefilledFolioNumber)
      }
    }
  }, [isOpen, transactionDate, prefilledScheme, prefilledFolioNumber, selectedScheme, folioNumber])

  // Search schemes with debounce
  const debounceTimeout = useRef<ReturnType<typeof setTimeout>>()
  
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSchemes([])
      setShowDropdown(false)
      return
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(async () => {
      setSearchingSchemes(true)
      try {
        const response = await apiClient.get<Scheme[]>('/schemes', {
          params: { search: searchQuery }
        })
        setSchemes(response.data)
        setShowDropdown(true)
      } catch (error: any) {
        console.error('Error searching schemes:', error)
        toast.error('Failed to search schemes')
      } finally {
        setSearchingSchemes(false)
      }
    }, 300)

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [searchQuery])

  // Fetch NAV when scheme and date are selected
  useEffect(() => {
    if (!selectedScheme || !transactionDate) {
      setNav(null)
      setNavDate(null)
      return
    }

    const fetchNav = async () => {
      setFetchingNav(true)
      try {
        // Convert date from YYYY-MM-DD to DD-MM-YYYY format
        const [year, month, day] = transactionDate.split('-')
        const formattedDate = `${day}-${month}-${year}`
        
        const response = await apiClient.get(`/simple-nav/${selectedScheme.isin}`, {
          params: { date: formattedDate }
        })
        setNav(response.data.navValue)
        setNavDate(response.data.actualDate)
      } catch (error: any) {
        console.error('Error fetching NAV:', error)
        toast.error('Failed to fetch NAV for the selected date')
        setNav(null)
        setNavDate(null)
      } finally {
        setFetchingNav(false)
      }
    }

    fetchNav()
  }, [selectedScheme, transactionDate])

  // Calculate amount/units based on NAV
  useEffect(() => {
    if (!nav) {
      setCalculatedValue(null)
      return
    }

    if (inputMode === 'amount' && amount) {
      const amountValue = Number.parseFloat(amount)
      if (!Number.isNaN(amountValue)) {
        const calculatedUnits = amountValue / nav
        setCalculatedValue(calculatedUnits)
      }
    } else if (inputMode === 'units' && units) {
      const unitsValue = Number.parseFloat(units)
      if (!Number.isNaN(unitsValue)) {
        const calculatedAmount = unitsValue * nav
        setCalculatedValue(calculatedAmount)
      }
    }
  }, [nav, inputMode, amount, units])

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme)
    setSearchQuery(scheme.schemeName)
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Common validation
    if (!selectedScheme) {
      toast.error('Please select a scheme')
      return
    }
    if (!folioNumber.trim()) {
      toast.error('Please enter folio number')
      return
    }

    const isSchedule = transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP'

    // Validation for one-time transactions (Buy/Sell)
    if (!isSchedule) {
      if (!transactionDate) {
        toast.error('Please select transaction date')
        return
      }
      if (inputMode === 'amount' && !amount) {
        toast.error('Please enter amount')
        return
      }
      if (inputMode === 'units' && !units) {
        toast.error('Please enter units')
        return
      }
    }

    // Validation for schedules (SIP/SWP)
    if (isSchedule) {
      if (!amount) {
        toast.error('Please enter amount')
        return
      }
      if (!startDate) {
        toast.error('Please select start date')
        return
      }
    }

    setSubmitting(true)
    try {
      if (isSchedule) {
        // Create schedule for SIP/SWP
        // Extract day from start_date for day_of_execution
        const dayOfMonth = new Date(startDate).getDate()
        
        const payload = {
          portfolio_id: portfolioId,
          folio_number: folioNumber.trim(),
          isin: selectedScheme.isin,
          schedule_type: transactionType === 'PURCHASE_SIP' ? 'SIP' : 'SWP',
          amount: Number.parseFloat(amount),
          start_date: startDate,
          end_date: endDate || null,
          frequency,
          day_of_execution: dayOfMonth,
          total_installments: totalInstallments ? Number.parseInt(totalInstallments) : null
        }

        await apiClient.post('/schedules', payload)
        
        const typeLabel = transactionType === 'PURCHASE_SIP' ? 'SIP' : 'SWP'
        toast.success(`${typeLabel} schedule created successfully`)
      } else {
        // Create one-time transaction for Buy/Sell
        const payload: any = {
          isin: selectedScheme.isin,
          folioNumber: folioNumber.trim(),
          transactionDate,
          transactionType,
          description: description.trim() || undefined
        }

        if (inputMode === 'amount') {
          payload.amount = Number.parseFloat(amount)
        } else {
          payload.units = Number.parseFloat(units)
        }

        await apiClient.post(`/portfolios/${portfolioId}/transactions/manual`, payload)
        
        const typeLabel = transactionType === 'PURCHASE' ? 'Buy' : 'Sell'
        toast.success(`${typeLabel} transaction added successfully`)
      }
      
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error:', error)
      const message = error.response?.data?.message || `Failed to ${isSchedule ? 'create schedule' : 'add transaction'}`
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setSearchQuery('')
    setSchemes([])
    setSelectedScheme(null)
    setShowDropdown(false)
    setFolioNumber('')
    setTransactionDate('')
    setTransactionType('PURCHASE')
    setInputMode('amount')
    setAmount('')
    setUnits('')
    setDescription('')
    setNav(null)
    setNavDate(null)
    setCalculatedValue(null)
    // Reset schedule fields
    setFrequency('MONTHLY')
    setStartDate('')
    setEndDate('')
    setTotalInstallments('')
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const isSchedule = transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP'
  const modalTitle = isSchedule ? 'Create Schedule' : 'Add Transaction'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scheme Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Scheme *
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value) {
                    setSelectedScheme(null)
                  }
                }}
                onFocus={() => {
                  if (schemes.length > 0 && !selectedScheme) {
                    setShowDropdown(true)
                  }
                }}
                onBlur={() => {
                  // Close dropdown after a small delay to allow click events to fire
                  setTimeout(() => setShowDropdown(false), 200)
                }}
                placeholder="Search by scheme name, ISIN, or AMC..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={submitting}
              />
              {searchingSchemes && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && schemes.length > 0 && !selectedScheme && (
              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                {schemes.map((scheme) => (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => handleSchemeSelect(scheme)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {scheme.schemeName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {scheme.amc} • {scheme.isin}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedScheme && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedScheme.schemeName}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {selectedScheme.amc} • {selectedScheme.isin}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Folio Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folio Number *
          </label>
          <Input
            value={folioNumber}
            onChange={(e) => setFolioNumber(e.target.value)}
            placeholder="Enter folio number"
            disabled={submitting}
            required
          />
        </div>

        {/* Transaction Date - Only for Buy/Sell */}
        {(transactionType === 'PURCHASE' || transactionType === 'REDEMPTION') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
              required
            />
          </div>
          </div>
        )}

        {/* NAV Display - Only for Buy/Sell */}
        {selectedScheme && transactionDate && (transactionType === 'PURCHASE' || transactionType === 'REDEMPTION') && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {fetchingNav ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Fetching NAV...</span>
              </div>
            ) : nav ? (
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  NAV on {formatDate(navDate || transactionDate)}: ₹{nav.toFixed(4)}
                </div>
                {navDate !== transactionDate && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠ Using NAV from {formatDate(navDate!)} (latest available)
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-600 dark:text-red-400">
                NAV not available for this date
              </div>
            )}
          </div>
        )}

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="transactionType"
                value="PURCHASE"
                checked={transactionType === 'PURCHASE'}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">Buy</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="transactionType"
                value="REDEMPTION"
                checked={transactionType === 'REDEMPTION'}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">Sell</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="transactionType"
                value="PURCHASE_SIP"
                checked={transactionType === 'PURCHASE_SIP'}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">SIP</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="transactionType"
                value="REDEMPTION_SWP"
                checked={transactionType === 'REDEMPTION_SWP'}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">SWP</span>
            </label>
          </div>
        </div>

        {/* Schedule Fields - Only for SIP/SWP */}
        {(transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP') && (
          <>
            {/* Two-column grid for schedule fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              {/* End Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency *
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                  required
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              {/* Total Installments (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Installments (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank for perpetual"
                  disabled={submitting}
                />
              </div>
            </div>
          </>
        )}

        {/* Amount or Units Input - Only for Buy/Sell */}
        {(transactionType === 'PURCHASE' || transactionType === 'REDEMPTION') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Amount or Units *
          </label>
          
          {/* Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setInputMode('amount')
                setUnits('')
                setCalculatedValue(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                inputMode === 'amount'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              disabled={submitting}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Amount
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('units')
                setAmount('')
                setCalculatedValue(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                inputMode === 'units'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              disabled={submitting}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Units
            </button>
          </div>

          {/* Input Field */}
          {inputMode === 'amount' ? (
            <div>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (₹)"
                disabled={submitting || !nav}
                required
              />
              {calculatedValue !== null && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  ≈ {calculatedValue.toFixed(3)} units
                </div>
              )}
            </div>
          ) : (
            <div>
              <Input
                type="number"
                step="0.001"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="Enter units"
                disabled={submitting || !nav}
                required
              />
              {calculatedValue !== null && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  ≈ ₹{calculatedValue.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Amount Input - Only for SIP/SWP */}
        {(transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
                disabled={submitting}
                required
              />
            </div>
          </div>
        )}

        {/* Description - Only for Buy/Sell */}
        {(transactionType === 'PURCHASE' || transactionType === 'REDEMPTION') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note about this transaction..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting}
          />
        </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !selectedScheme || ((transactionType === 'PURCHASE' || transactionType === 'REDEMPTION') && (!nav || fetchingNav))}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP' ? 'Creating...' : 'Adding...'}
              </>
            ) : (
              transactionType === 'PURCHASE_SIP' || transactionType === 'REDEMPTION_SWP' ? 'Create Schedule' : 'Add Transaction'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
