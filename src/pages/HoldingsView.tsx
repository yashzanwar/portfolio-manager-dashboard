import { useState } from 'react'
import { usePortfolios } from '../hooks/usePortfolios'
import { usePortfolioSummaryV2 } from '../hooks/usePortfolioV2'
import { HoldingsDisplayV2 } from '../components/portfolio/HoldingsDisplayV2'
import { Loader2, Package } from 'lucide-react'

export default function HoldingsView() {
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<number[]>([])
  const [assetTypeFilter, setAssetTypeFilter] = useState<'MUTUAL_FUND' | 'EQUITY_STOCK' | undefined>(undefined)
  
  // Fetch portfolios list
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  
  // Fetch summary with holdings (includeHoldings=true)
  const { data: summaryV2, isLoading: loadingSummary } = usePortfolioSummaryV2(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : portfolios.map(p => p.id),
    assetTypeFilter,
    true // includeHoldings=true to get detailed holdings data
  )

  const handlePortfolioToggle = (portfolioId: number) => {
    setSelectedPortfolioIds(prev => 
      prev.includes(portfolioId)
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    )
  }

  const handleSelectAll = () => {
    setSelectedPortfolioIds(portfolios.map(p => p.id))
  }

  const handleClearAll = () => {
    setSelectedPortfolioIds([])
  }

  if (loadingPortfolios) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Holdings View
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View detailed holdings across your portfolios
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="space-y-4">
          {/* Portfolio Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Portfolios
              </label>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => handlePortfolioToggle(portfolio.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPortfolioIds.includes(portfolio.id) || selectedPortfolioIds.length === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {portfolio.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Asset Type Filter
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setAssetTypeFilter(undefined)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !assetTypeFilter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Assets
              </button>
              <button
                onClick={() => setAssetTypeFilter('MUTUAL_FUND')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assetTypeFilter === 'MUTUAL_FUND'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Mutual Funds Only
              </button>
              <button
                onClick={() => setAssetTypeFilter('EQUITY_STOCK')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  assetTypeFilter === 'EQUITY_STOCK'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Stocks Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingSummary && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Holdings Display */}
      {!loadingSummary && summaryV2 && summaryV2.holdings && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <HoldingsDisplayV2 
            holdings={summaryV2.holdings}
            showMutualFunds={!assetTypeFilter || assetTypeFilter === 'MUTUAL_FUND'}
            showStocks={!assetTypeFilter || assetTypeFilter === 'EQUITY_STOCK'}
          />
        </div>
      )}

      {/* No Holdings State */}
      {!loadingSummary && summaryV2 && !summaryV2.holdings && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No Holdings Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Holdings data is not included in the response. Make sure includeHoldings is set to true.
          </p>
        </div>
      )}
    </div>
  )
}
