import { useNavigate } from 'react-router-dom'
import { TrendingUp, Bitcoin, Landmark, Home, Coins, ArrowRight, TrendingDown } from 'lucide-react'
import { AssetType } from '../../context/AssetFilterContext'

interface AssetCardData {
  type: AssetType
  label: string
  value: number
  invested: number
  gain: number
  gainPercent: number
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
}

interface AssetCardProps {
  asset: AssetCardData
}

interface AssetCardsGridProps {
  assets?: AssetCardData[]
  isLoading?: boolean
}

function AssetCard({ asset }: AssetCardProps) {
  const navigate = useNavigate()

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}k`
    return `₹${amount.toFixed(2)}`
  }

  return (
    <div
      onClick={() => navigate(asset.route)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="p-6">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${asset.bgColor}`}>
            <div className={asset.color}>
              {asset.icon}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Asset Type Label */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {asset.label}
        </h3>

        {/* Current Value */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(asset.value)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Invested: {formatCurrency(asset.invested)}
          </div>
        </div>

        {/* Gain/Loss */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {asset.gain >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              asset.gain >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {asset.gain >= 0 ? '+' : ''}{formatCurrency(asset.gain)}
            </span>
          </div>
          <span className={`text-sm font-semibold ${
            asset.gainPercent >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {asset.gainPercent >= 0 ? '+' : ''}{asset.gainPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_ASSETS: AssetCardData[] = [
  {
    type: 'mutual-funds',
    label: 'Mutual Funds',
    value: 4500000,
    invested: 3800000,
    gain: 700000,
    gainPercent: 18.42,
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    route: '/dash/mutual-funds'
  },
  {
    type: 'stocks',
    label: 'Stocks',
    value: 2500000,
    invested: 2200000,
    gain: 300000,
    gainPercent: 13.64,
    icon: <Coins className="w-6 h-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    route: '/dash/stocks'
  },
  {
    type: 'crypto',
    label: 'Crypto',
    value: 1000000,
    invested: 900000,
    gain: 100000,
    gainPercent: 11.11,
    icon: <Bitcoin className="w-6 h-6" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    route: '/dash/crypto'
  },
  {
    type: 'gold',
    label: 'Gold',
    value: 800000,
    invested: 750000,
    gain: 50000,
    gainPercent: 6.67,
    icon: <Coins className="w-6 h-6" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    route: '/dash/gold'
  },
  {
    type: 'property',
    label: 'Property',
    value: 700000,
    invested: 650000,
    gain: 50000,
    gainPercent: 7.69,
    icon: <Home className="w-6 h-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    route: '/dash/property'
  },
  {
    type: 'fixed-income',
    label: 'Fixed Income',
    value: 500000,
    invested: 480000,
    gain: 20000,
    gainPercent: 4.17,
    icon: <Landmark className="w-6 h-6" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    route: '/dash/fixed-income'
  }
]

export function AssetCardsGrid({ assets = DEFAULT_ASSETS, isLoading = false }: AssetCardsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset) => (
        <AssetCard key={asset.type} asset={asset} />
      ))}
    </div>
  )
}
