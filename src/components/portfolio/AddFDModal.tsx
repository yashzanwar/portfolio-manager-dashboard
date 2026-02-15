import { useState, useEffect } from 'react'
import { Landmark, Calendar, DollarSign, Percent, Clock } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import toast from 'react-hot-toast'
import { apiClient } from '../../services/api'

interface AddFDModalProps {
  isOpen: boolean
  onClose: () => void
  portfolioId: number
  onSuccess: () => void
}

type CompoundingFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
type InterestPayoutType = 'REINVEST' | 'PAYOUT'

export function AddFDModal({
  isOpen,
  onClose,
  portfolioId,
  onSuccess,
}: AddFDModalProps) {
  const [bankName, setBankName] = useState('')
  const [principal, setPrincipal] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('QUARTERLY')
  const [interestPayoutType, setInterestPayoutType] = useState<InterestPayoutType>('REINVEST')
  const [investmentDate, setInvestmentDate] = useState('')
  const [maturityDate, setMaturityDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Set default date to today
  useEffect(() => {
    if (isOpen && !investmentDate) {
      const today = new Date().toISOString().split('T')[0]
      setInvestmentDate(today)
    }
  }, [isOpen, investmentDate])

  const calculateMaturityValue = () => {
    const p = parseFloat(principal) || 0
    const r = parseFloat(interestRate) || 0
    
    if (p <= 0 || r <= 0 || !investmentDate || !maturityDate) return 0
    
    // Calculate tenure in months from dates
    const startDate = new Date(investmentDate)
    const endDate = new Date(maturityDate)
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
    
    if (monthsDiff <= 0) return 0
    
    // Get compounding frequency per year
    const n = compoundingFrequency === 'MONTHLY' ? 12 
              : compoundingFrequency === 'QUARTERLY' ? 4 
              : compoundingFrequency === 'HALF_YEARLY' ? 2 
              : 1
    
    // A = P(1 + r/n)^(n*t) where t is in years
    const maturityValue = p * Math.pow(1 + (r / 100) / n, n * (monthsDiff / 12))
    
    return maturityValue
  }

  const expectedMaturityValue = calculateMaturityValue()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const principalAmount = parseFloat(principal)
    const rate = parseFloat(interestRate)

    // Validation
    if (!bankName || bankName.trim() === '') {
      toast.error('Please enter bank name')
      return
    }
    if (!principalAmount || principalAmount <= 0) {
      toast.error('Please enter a valid principal amount')
      return
    }
    if (rate === null || rate === undefined || rate < 0 || rate > 100) {
      toast.error('Please enter a valid interest rate (0-100%)')
      return
    }
    if (!investmentDate) {
      toast.error('Please select investment date')
      return
    }

    // Calculate tenure from dates if maturity date is provided
    let tenureMonths = null
    if (maturityDate && investmentDate) {
      const startDate = new Date(investmentDate)
      const endDate = new Date(maturityDate)
      tenureMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
    }

    setSubmitting(true)

    try {
      const payload = {
        bankName: bankName.trim(),
        principal: principalAmount,
        interestRate: rate,
        compoundingFrequency: compoundingFrequency,
        interestPayoutType: interestPayoutType,
        tenureMonths: tenureMonths,
        investmentDate: investmentDate,
        maturityDate: maturityDate || undefined,
        notes: notes.trim() || undefined,
      }

      await apiClient.post(`/portfolios/${portfolioId}/fixed-deposits`, payload)
      
      toast.success(`Fixed Deposit created successfully! ₹${principalAmount.toLocaleString('en-IN')}`)

      // Reset form
      setBankName('')
      setPrincipal('')
      setInterestRate('')
      setCompoundingFrequency('QUARTERLY')
      setInterestPayoutType('REINVEST')
      setNotes('')
      const today = new Date().toISOString().split('T')[0]
      setInvestmentDate(today)
      setMaturityDate('')

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating FD:', error)
      toast.error(error.response?.data?.message || 'Failed to create fixed deposit')
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
      title="Create Fixed Deposit"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bank Name */}
        <Input
          label="Bank Name"
          icon={<Landmark className="w-4 h-4" />}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g., HDFC Bank, SBI, ICICI Bank"
          required
        />

        {/* Principal Amount */}
        <Input
          label="Principal Amount"
          icon={<DollarSign className="w-4 h-4" />}
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="e.g., 500000"
          min="1000"
          step="1000"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Interest Rate */}
          <Input
            label="Interest Rate (%)"
            icon={<Percent className="w-4 h-4" />}
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g., 7.5"
            min="0"
            max="20"
            step="0.01"
            required
          />
        </div>

        {/* Compounding Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Compounding Frequency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'] as CompoundingFrequency[]).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setCompoundingFrequency(freq)}
                className={`
                  px-3 py-2 rounded-lg border font-medium text-sm transition-all
                  ${compoundingFrequency === freq
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'}
                `}
              >
                {freq.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Interest Payout Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Interest Payout
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setInterestPayoutType('REINVEST')}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${interestPayoutType === 'REINVEST'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'}
              `}
            >
              Cumulative (Reinvest)
            </button>
            <button
              type="button"
              onClick={() => setInterestPayoutType('PAYOUT')}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${interestPayoutType === 'PAYOUT'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'}
              `}
            >
              Regular Payout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Investment Date */}
          <Input
            label="Investment Date"
            icon={<Calendar className="w-4 h-4" />}
            type="date"
            value={investmentDate}
            onChange={(e) => setInvestmentDate(e.target.value)}
            required
          />

          {/* Maturity Date */}
          <Input
            label="Maturity Date (Optional)"
            icon={<Calendar className="w-4 h-4" />}
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={2}
            className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Expected Maturity Value */}
        {expectedMaturityValue > 0 && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Expected Maturity Value</span>
              <span className="text-xl font-bold text-blue-400">
                ₹{expectedMaturityValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-400">Interest Earned</span>
              <span className="text-green-400">
                ₹{(expectedMaturityValue - parseFloat(principal || '0')).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
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
            disabled={submitting}
            loading={submitting}
            className="flex-1"
          >
            {submitting ? 'Creating...' : 'Create FD'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
