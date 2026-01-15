import { usePortfolioContext } from '../context/PortfolioContext'
import { useAssetFilter } from '../context/AssetFilterContext'
import { useCombinedPortfolio } from '../hooks/useCombinedPortfolio'
import { AssetTypeFilter } from '../components/dashboard/AssetTypeFilter'
import { TotalValueSummary } from '../components/dashboard/TotalValueSummary'
import { AssetAllocationChart } from '../components/dashboard/AssetAllocationChart'
import { AssetCardsGrid } from '../components/dashboard/AssetCardsGrid'
import { Info } from 'lucide-react'

export default function DashboardOverview() {
  const { selectedPortfolioIds } = usePortfolioContext()
  const { selectedAssets } = useAssetFilter()
  
  // Fetch combined portfolio data
  const { data: summaryData, isLoading } = useCombinedPortfolio(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )

  // Check if user has selected portfolios
  const hasSelectedPortfolios = selectedPortfolioIds.length > 0

  // Extract summary values
  const totalValue = summaryData?.overall.current_value || 0
  const totalInvested = summaryData?.overall.total_invested || 0
  const totalGain = summaryData?.overall.unrealized_profit_loss || 0
  const totalGainPercent = summaryData?.overall.unrealized_profit_loss_percentage || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your investment portfolio
          </p>
        </div>
      </div>

      {/* Asset Type Filter */}
      <AssetTypeFilter />

      {/* Show message if no portfolios selected */}
      {!hasSelectedPortfolios && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                No Portfolios Selected
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Please select one or more portfolios from the dropdown in the navbar to view your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <TotalValueSummary
        totalValue={totalValue}
        totalInvested={totalInvested}
        totalGain={totalGain}
        totalGainPercent={totalGainPercent}
        isLoading={isLoading && hasSelectedPortfolios}
      />

      {/* Charts and Asset Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Chart - Takes 1 column */}
        <div className="lg:col-span-1">
          <AssetAllocationChart isLoading={isLoading && hasSelectedPortfolios} />
        </div>

        {/* Placeholder for future chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Portfolio Performance
            </h3>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  📈 Performance chart coming soon
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Will show portfolio value over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Type Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Asset Types
        </h2>
        <AssetCardsGrid isLoading={isLoading && hasSelectedPortfolios} />
      </div>

      {/* Development Note */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Phase 3 Complete:</strong> Dashboard overview with asset filters, summary cards, 
          allocation chart, and asset type cards. Currently showing mock data for demonstration.
          Real data integration will be added in Phase 4.
        </p>
      </div>
    </div>
  )
}
