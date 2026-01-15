import { useAssetFilter, AssetType } from '../../context/AssetFilterContext'
import { TrendingUp, Bitcoin, Landmark, Home, Coins, DollarSign } from 'lucide-react'

interface AssetTypeConfig {
  type: AssetType
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const assetTypes: AssetTypeConfig[] = [
  {
    type: 'mutual-funds',
    label: 'Mutual Funds',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  {
    type: 'stocks',
    label: 'Stocks',
    icon: <Coins className="w-4 h-4" />,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  {
    type: 'crypto',
    label: 'Crypto',
    icon: <Bitcoin className="w-4 h-4" />,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  {
    type: 'gold',
    label: 'Gold',
    icon: <Coins className="w-4 h-4" />,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  {
    type: 'property',
    label: 'Property',
    icon: <Home className="w-4 h-4" />,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  {
    type: 'fixed-income',
    label: 'Fixed Income',
    icon: <Landmark className="w-4 h-4" />,
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  }
]

export function AssetTypeFilter() {
  const { selectedAssets, toggleAsset, selectAllAssets, isAllSelected } = useAssetFilter()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Asset Types
        </h3>
        <button
          onClick={selectAllAssets}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {isAllSelected ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {assetTypes.map((asset) => {
          const isSelected = selectedAssets.has(asset.type)
          
          return (
            <button
              key={asset.type}
              onClick={() => toggleAsset(asset.type)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? `${asset.bgColor} ${asset.color} border-2 border-current`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {asset.icon}
              <span>{asset.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {selectedAssets.size === assetTypes.length ? (
            <span>Showing all asset types</span>
          ) : (
            <span>{selectedAssets.size} of {assetTypes.length} asset types selected</span>
          )}
        </div>
      </div>
    </div>
  )
}
