import { TrendingUp, Coins, Bitcoin, Home, Landmark, Briefcase } from 'lucide-react'

export type AssetClass = 'mutual-funds' | 'stocks' | 'crypto' | 'gold' | 'property' | 'fixed-income'

interface AssetClassOption {
  id: AssetClass
  label: string
  icon: React.ReactNode
  description: string
  enabled: boolean
}

interface AssetClassSelectionProps {
  onSelect: (assetClass: AssetClass) => void
  onCancel?: () => void
}

const assetClasses: AssetClassOption[] = [
  {
    id: 'mutual-funds',
    label: 'Mutual Funds',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Add MF transactions or import CAS statement',
    enabled: true,
  },
  {
    id: 'stocks',
    label: 'Stocks',
    icon: <Coins className="w-6 h-6" />,
    description: 'Add equity stock transactions',
    enabled: true,
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    icon: <Bitcoin className="w-6 h-6" />,
    description: 'Add crypto transactions',
    enabled: false,
  },
  {
    id: 'gold',
    label: 'Gold',
    icon: <Coins className="w-6 h-6" />,
    description: 'Add gold/precious metals transactions',
    enabled: false,
  },
  {
    id: 'property',
    label: 'Property',
    icon: <Home className="w-6 h-6" />,
    description: 'Add real estate transactions',
    enabled: false,
  },
  {
    id: 'fixed-income',
    label: 'Fixed Income',
    icon: <Landmark className="w-6 h-6" />,
    description: 'Add bonds, FDs, and other fixed income',
    enabled: false,
  },
]

export function AssetClassSelection({ onSelect, onCancel }: AssetClassSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">
          Select Asset Class
        </h2>
        <p className="text-sm text-gray-400">
          Choose the type of asset for which you want to add a transaction
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {assetClasses.map((assetClass) => (
          <button
            key={assetClass.id}
            onClick={() => assetClass.enabled && onSelect(assetClass.id)}
            disabled={!assetClass.enabled}
            className={`
              relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left
              ${assetClass.enabled 
                ? 'border-gray-900 hover:border-gray-800 hover:bg-black cursor-pointer bg-black' 
                : 'border-gray-900 opacity-50 cursor-not-allowed bg-black'}
            `}
          >
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
              ${assetClass.enabled 
                ? 'bg-gray-900 text-gray-400' 
                : 'bg-gray-900 text-gray-600'}
            `}>
              {assetClass.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-300">
                  {assetClass.label}
                </h3>
                {!assetClass.enabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-gray-500">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {assetClass.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {onCancel && (
        <div className="flex justify-end pt-4 border-t border-gray-900">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
