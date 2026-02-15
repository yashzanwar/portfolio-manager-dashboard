import { useAssetFilter, AssetType } from '../../context/AssetFilterContext'
import { TrendingUp, Coins, Landmark } from 'lucide-react'

interface AssetTypeConfig {
  type: AssetType
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

// Only show currently supported asset types
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
    type: 'metals',
    label: 'Metals',
    icon: <Coins className="w-4 h-4" />,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
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

  const handleSelectAllClick = () => {
    if (isAllSelected) {
      // Don't allow clearing all - instead do nothing or show a message
      return
    }
    selectAllAssets()
  }

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">
          Asset Types
        </h3>
        <button
          onClick={handleSelectAllClick}
          disabled={isAllSelected}
          className={`text-xs font-medium transition-colors ${
            isAllSelected 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Select All
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
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isSelected
                  ? 'bg-gray-900 text-gray-300 border border-gray-800'
                  : 'bg-black text-gray-500 border border-gray-900 hover:bg-gray-950 hover:text-gray-400'
                }
              `}
            >
              {asset.icon}
              <span>{asset.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-900">
        <div className="text-xs text-gray-500">
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
