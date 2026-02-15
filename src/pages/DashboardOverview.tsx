import { usePortfolioContext } from '../context/PortfolioContext'
import { usePortfolioSummaryV2 } from '../hooks/usePortfolioV2'
import { usePortfolioXIRR } from '../hooks/useXIRR'
import { AssetTypeFilter } from '../components/dashboard/AssetTypeFilter'
import { TotalValueSummary } from '../components/dashboard/TotalValueSummary'
import { AssetAllocationChart } from '../components/dashboard/AssetAllocationChart'
import { AssetCardsGrid } from '../components/dashboard/AssetCardsGrid'
import { Info, TrendingUp, Coins, Landmark } from 'lucide-react'
import { isSinglePortfolio, AssetTypeBreakdownV2 } from '../types/portfolioV2'
import { useMemo } from 'react'
import { AssetType, useAssetFilter } from '../context/AssetFilterContext'

interface AssetCardData {
  type: AssetType
  label: string
  value: number
  invested: number
  gain: number
  gainPercent: number
  dayProfitLoss: number
  dayProfitLossPercent: number
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
}

export default function DashboardOverview() {
  const { selectedPortfolioIds } = usePortfolioContext()
  const { selectedAssets } = useAssetFilter()
  
  // Fetch V2 portfolio summary data
  const { data: summaryV2, isLoading } = usePortfolioSummaryV2(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )

  // Fetch XIRR data
  const { data: xirrData } = usePortfolioXIRR(
    selectedPortfolioIds.length > 0 ? selectedPortfolioIds : undefined
  )

  // Check if user has selected portfolios
  const hasSelectedPortfolios = selectedPortfolioIds.length > 0

  // Map frontend asset types to backend asset types
  const assetTypeMapping: Record<AssetType, string[]> = {
    'mutual-funds': ['MUTUAL_FUND'],
    'stocks': ['EQUITY_STOCK', 'STOCK'],
    'crypto': ['CRYPTOCURRENCY'],
    'metals': ['PRECIOUS_METAL', 'GOLD_PHYSICAL', 'SILVER_PHYSICAL'],
    'property': ['REAL_ESTATE'],
    'fixed-income': ['FIXED_DEPOSIT', 'BOND']
  }

  // Get backend asset types that should be included based on selected filters
  const includedBackendAssetTypes = useMemo(() => {
    const types = new Set<string>()
    selectedAssets.forEach(frontendType => {
      const backendTypes = assetTypeMapping[frontendType] || []
      backendTypes.forEach(t => types.add(t))
    })
    return types
  }, [selectedAssets])

  // Filter breakdown by selected asset types
  const filteredBreakdown = useMemo(() => {
    if (!summaryV2?.breakdown_by_asset_type) return undefined
    
    const filtered: Record<string, AssetTypeBreakdownV2> = {}
    Object.entries(summaryV2.breakdown_by_asset_type).forEach(([assetType, data]) => {
      if (includedBackendAssetTypes.has(assetType)) {
        filtered[assetType] = data
      }
    })
    return Object.keys(filtered).length > 0 ? filtered : undefined
  }, [summaryV2?.breakdown_by_asset_type, includedBackendAssetTypes])

  // Calculate filtered totals from the filtered breakdown
  const filteredTotals = useMemo(() => {
    if (!filteredBreakdown) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayProfitLoss: 0,
        dayProfitLossPercent: 0
      }
    }

    const totals = Object.values(filteredBreakdown).reduce(
      (acc, data) => ({
        totalValue: acc.totalValue + data.current_value,
        totalInvested: acc.totalInvested + data.total_invested,
        totalGain: acc.totalGain + data.total_gains,
        dayProfitLoss: acc.dayProfitLoss + (data.one_day_profit_loss || 0),
        previousValueTotal: acc.previousValueTotal + (data.current_value - (data.one_day_profit_loss || 0))
      }),
      { totalValue: 0, totalInvested: 0, totalGain: 0, dayProfitLoss: 0, previousValueTotal: 0 }
    )

    const totalGainPercent = totals.totalInvested > 0 
      ? (totals.totalGain / totals.totalInvested) * 100 
      : 0

    const dayProfitLossPercent = totals.previousValueTotal > 0
      ? (totals.dayProfitLoss / totals.previousValueTotal) * 100
      : 0

    return {
      ...totals,
      totalGainPercent,
      dayProfitLossPercent
    }
  }, [filteredBreakdown])

  // Use filtered totals instead of overview totals
  const totalValue = filteredTotals.totalValue
  const totalInvested = filteredTotals.totalInvested
  const totalGain = filteredTotals.totalGain
  const totalGainPercent = filteredTotals.totalGainPercent
  const dayProfitLoss = filteredTotals.dayProfitLoss
  const dayProfitLossPercent = filteredTotals.dayProfitLossPercent
  const xirr = xirrData?.xirr

  // Transform V2 asset breakdown into asset cards
  const assetCards = useMemo(() => {
    if (!filteredBreakdown) return undefined

    const cards: AssetCardData[] = []

    // Map for asset type configurations
    const assetConfig: Record<string, { 
      type: AssetType
      label: string
      icon: React.ReactNode
      color: string
      bgColor: string
      route: string
    }> = {
      'MUTUAL_FUND': {
        type: 'mutual-funds' as AssetType,
        label: 'Mutual Funds',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        route: '/dash/mutual-funds'
      },
      'EQUITY_STOCK': {
        type: 'stocks' as AssetType,
        label: 'Stocks',
        icon: <Coins className="w-6 h-6" />,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        route: '/dash/stocks'
      },
      'STOCK': {
        type: 'stocks' as AssetType,
        label: 'Stocks',
        icon: <Coins className="w-6 h-6" />,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        route: '/dash/stocks'
      },
      'PRECIOUS_METAL': {
        type: 'metals' as AssetType,
        label: 'Metals',
        icon: <Coins className="w-6 h-6" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        route: '/dash/metals'
      },
      'GOLD_PHYSICAL': {
        type: 'metals' as AssetType,
        label: 'Gold',
        icon: <Coins className="w-6 h-6" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        route: '/dash/metals'
      },
      'SILVER_PHYSICAL': {
        type: 'metals' as AssetType,
        label: 'Silver',
        icon: <Coins className="w-6 h-6" />,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        route: '/dash/metals'
      },
      'FIXED_DEPOSIT': {
        type: 'fixed-income' as AssetType,
        label: 'Fixed Deposits',
        icon: <Landmark className="w-6 h-6" />,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        route: '/dash/fixed-deposits'
      },
      'BOND': {
        type: 'fixed-income' as AssetType,
        label: 'Bonds',
        icon: <Landmark className="w-6 h-6" />,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        route: '/dash/fixed-deposits'
      }
    }

    // Convert each asset type in the breakdown
    Object.entries(filteredBreakdown).forEach(([assetType, data]: [string, AssetTypeBreakdownV2]) => {
      const config = assetConfig[assetType]
      if (config) {
        cards.push({
          type: config.type,
          label: config.label,
          value: data.current_value,
          invested: data.total_invested,
          gain: data.total_gains,
          gainPercent: data.returns_percentage,
          dayProfitLoss: data.one_day_profit_loss || 0,
          dayProfitLossPercent: data.one_day_profit_loss_percentage || 0,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
          route: config.route
        })
      }
    })

    return cards
  }, [filteredBreakdown])

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden md:block">
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
        dayProfitLoss={dayProfitLoss}
        dayProfitLossPercent={dayProfitLossPercent}
        xirr={xirr}
        isLoading={isLoading && hasSelectedPortfolios}
      />

      {/* Charts and Asset Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Chart - Takes 1 column */}
        <div className="lg:col-span-1">
          <AssetAllocationChart 
            breakdown={filteredBreakdown}
            isLoading={isLoading && hasSelectedPortfolios} 
          />
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
        <AssetCardsGrid 
          assets={assetCards} 
          isLoading={isLoading && hasSelectedPortfolios} 
        />
      </div>

      {/* Development Note */}
      <div className="bg-gray-950 border border-gray-900 rounded-lg p-4">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">V2 API Integration:</strong> Dashboard now uses the V2 summary API 
          (/portfolios/summary/v2) with asset type breakdown support for both mutual funds and stocks.
          {summaryV2 && (
            <span className="ml-2">
              {isSinglePortfolio(summaryV2) 
                ? `Viewing: ${summaryV2.portfolio_name}` 
                : `Viewing ${summaryV2.total_portfolios} portfolios`}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}