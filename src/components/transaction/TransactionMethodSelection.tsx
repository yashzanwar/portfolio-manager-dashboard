import { Edit3, Upload, ArrowLeft } from 'lucide-react'
import { AssetClass } from './AssetClassSelection'

export type TransactionMethod = 'manual' | 'import-cas'

interface TransactionMethodOption {
  id: TransactionMethod
  label: string
  icon: React.ReactNode
  description: string
}

interface TransactionMethodSelectionProps {
  assetClass: AssetClass
  onSelect: (method: TransactionMethod) => void
  onBack: () => void
}

const methodsByAssetClass: Record<AssetClass, TransactionMethodOption[]> = {
  'mutual-funds': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add individual transactions manually',
    },
    {
      id: 'import-cas',
      label: 'Import CAS Statement',
      icon: <Upload className="w-6 h-6" />,
      description: 'Bulk import from CAMS/Karvy CAS file',
    },
  ],
  'stocks': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add individual stock transactions',
    },
  ],
  'crypto': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add individual crypto transactions',
    },
  ],
  'gold': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add gold purchase/sale transactions',
    },
  ],
  'property': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add property transactions',
    },
  ],
  'fixed-income': [
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <Edit3 className="w-6 h-6" />,
      description: 'Add fixed income transactions',
    },
  ],
}

const assetClassLabels: Record<AssetClass, string> = {
  'mutual-funds': 'Mutual Funds',
  'stocks': 'Stocks',
  'crypto': 'Cryptocurrency',
  'gold': 'Gold',
  'property': 'Property',
  'fixed-income': 'Fixed Income',
}

export function TransactionMethodSelection({
  assetClass,
  onSelect,
  onBack,
}: TransactionMethodSelectionProps) {
  const methods = methodsByAssetClass[assetClass] || []

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to asset classes
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Add {assetClassLabels[assetClass]} Transaction
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how you want to add the transaction
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {method.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {method.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {method.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
