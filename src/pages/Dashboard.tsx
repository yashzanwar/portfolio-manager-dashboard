import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { TrendingUp, Wallet, TrendingDown, Target, Plus, Upload } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { PortfolioSelector } from '../components/portfolio/PortfolioSelector'
import { HoldingsTable } from '../components/dashboard/HoldingsTable'
import { AllocationChart } from '../components/dashboard/AllocationChart'
import { Button, StatCardSkeleton, TableSkeleton, ChartSkeleton, EmptyState } from '../components/common'
import { usePortfolios } from '../hooks/usePortfolios'
import { PortfolioAPI } from '../services/portfolioApi'
import { Portfolio } from '../types/portfolio'
import { formatCurrency, formatPercentage } from '../utils/formatters'

interface PortfolioSummary {
  investorName: string
  portfolioOverview: {
    totalInvested: number
    currentValue: number
    realizedProfitLoss: number
    unrealizedProfitLoss: number
    totalProfitLoss: number
    totalProfitLossPercentage: number
    totalFolios: number
    totalSchemes: number
    totalFunds: number
  }
  funds: any[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: portfolios = [], isLoading: loadingPortfolios, error: portfoliosError } = usePortfolios()
  
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('Dashboard render - loadingPortfolios:', loadingPortfolios)
    console.log('Dashboard render - portfolios:', portfolios)
    console.log('Dashboard render - portfoliosError:', portfoliosError)
    console.log('Dashboard render - selectedPortfolio:', selectedPortfolio)
  }, [loadingPortfolios, portfolios, portfoliosError, selectedPortfolio])

  // Select portfolio from route state or default to primary/first (only on initial load)
  useEffect(() => {
    if (portfolios.length === 0 || selectedPortfolio) return

    const portfolioIdFromState = location.state?.portfolioId
    let portfolio: Portfolio | null = null

    if (portfolioIdFromState) {
      portfolio = portfolios.find(p => p.id === portfolioIdFromState) || null
    }
    
    if (!portfolio) {
      // Default to primary or first portfolio
      portfolio = portfolios.find(p => p.isPrimary) || portfolios[0]
    }

    if (portfolio) {
      setSelectedPortfolio(portfolio)
    }
  }, [portfolios, location.state])

  // Fetch summary when portfolio changes
  useEffect(() => {
    if (!selectedPortfolio) return

    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await PortfolioAPI.getComprehensiveSummary(selectedPortfolio.id)
        
        // Transform snake_case to camelCase
        const transformedData = {
          investorName: data.investor_name || data.investorName || 'No Data',
          portfolioOverview: {
            totalInvested: data.portfolio_overview?.total_invested ?? data.portfolioOverview?.totalInvested ?? 0,
            currentValue: data.portfolio_overview?.current_value ?? data.portfolioOverview?.currentValue ?? 0,
            realizedProfitLoss: data.portfolio_overview?.realized_profit_loss ?? data.portfolioOverview?.realizedProfitLoss ?? 0,
            unrealizedProfitLoss: data.portfolio_overview?.unrealized_profit_loss ?? data.portfolioOverview?.unrealizedProfitLoss ?? 0,
            totalProfitLoss: data.portfolio_overview?.total_profit_loss ?? data.portfolioOverview?.totalProfitLoss ?? 0,
            totalProfitLossPercentage: data.portfolio_overview?.unrealized_profit_loss_percentage ?? data.portfolioOverview?.totalProfitLossPercentage ?? 0,
            totalFolios: data.portfolio_overview?.total_folios ?? data.portfolioOverview?.totalFolios ?? 0,
            totalSchemes: data.portfolio_overview?.total_schemes ?? data.portfolioOverview?.totalSchemes ?? 0,
            totalFunds: data.portfolio_overview?.total_funds ?? data.portfolioOverview?.totalFunds ?? 0,
          },
          funds: data.funds || []
        }
        
        setSummary(transformedData)
      } catch (err: any) {
        console.error('Error fetching summary:', err)
        setError(err.response?.data?.message || 'Failed to load portfolio summary')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [selectedPortfolio])

  const handlePortfolioSelect = (portfolio: Portfolio) => {
    console.log('Dashboard - handlePortfolioSelect called with:', portfolio)
    setSelectedPortfolio(portfolio)
  }

  // Prepare chart data
  const allocationData = summary?.funds.map((fund: any) => {
    const total = fund.folios.reduce((acc: number, folio: any) => acc + folio.currentValue, 0)
    const grandTotal = summary.portfolioOverview.currentValue
    return {
      name: fund.schemeName,
      value: total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }
  }) || []

  // Error state for portfolios API
  if (portfoliosError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
              Error Loading Portfolios
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {(portfoliosError as any)?.response?.data?.message || 'Failed to load portfolios. Please try logging in again.'}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loadingPortfolios) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={5} />
          </div>
          <div>
            <ChartSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // No portfolios state
  if (portfolios.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Welcome to Portfolio Manager"
          description="Get started by creating your first portfolio to track your investments"
          action={{
            label: 'Create Your First Portfolio',
            onClick: () => navigate('/portfolios'),
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header with Portfolio Selector */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your investment performance
            </p>
          </div>
          <PortfolioSelector
            portfolios={portfolios}
            selectedPortfolio={selectedPortfolio}
            onSelect={handlePortfolioSelect}
            isLoading={loadingPortfolios}
          />
        </div>
      </div>

      {/* Loading Summary */}
      {loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TableSkeleton rows={5} />
            </div>
            <div>
              <ChartSkeleton />
            </div>
          </div>
        </>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
            Error Loading Portfolio
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Summary Content */}
      {summary && !loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Total Invested"
              value={formatCurrency(summary.portfolioOverview.totalInvested)}
              icon={<Wallet className="w-6 h-6" />}
              iconBgColor="bg-blue-100 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Current Value"
              value={formatCurrency(summary.portfolioOverview.currentValue)}
              icon={<TrendingUp className="w-6 h-6" />}
              iconBgColor="bg-green-100 dark:bg-green-900/20"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Total P&L"
              value={formatCurrency(summary.portfolioOverview.totalProfitLoss)}
              change={summary.portfolioOverview.totalProfitLossPercentage}
              icon={summary.portfolioOverview.totalProfitLoss >= 0 ? 
                <TrendingUp className="w-6 h-6" /> : 
                <TrendingDown className="w-6 h-6" />
              }
              iconBgColor={summary.portfolioOverview.totalProfitLoss >= 0 ? 
                "bg-green-100 dark:bg-green-900/20" : 
                "bg-red-100 dark:bg-red-900/20"
              }
              iconColor={summary.portfolioOverview.totalProfitLoss >= 0 ? 
                "text-green-600 dark:text-green-400" : 
                "text-red-600 dark:text-red-400"
              }
            />
            <StatCard
              title="Total Returns"
              value={formatPercentage(summary.portfolioOverview.totalProfitLossPercentage)}
              icon={<Target className="w-6 h-6" />}
              iconBgColor={summary.portfolioOverview.totalProfitLossPercentage >= 0 ? 
                "bg-green-100 dark:bg-green-900/20" : 
                "bg-red-100 dark:bg-red-900/20"
              }
              iconColor={summary.portfolioOverview.totalProfitLossPercentage >= 0 ? 
                "text-green-600 dark:text-green-400" : 
                "text-red-600 dark:text-red-400"
              }
            />
          </div>

          {/* Empty Portfolio State */}
          {summary.funds.length === 0 ? (
            <EmptyState
              icon={<Upload className="w-8 h-8 text-gray-400" />}
              title="No Holdings in This Portfolio"
              description="Import your CAS statement to see your holdings and track performance"
              action={{
                label: 'Import CAS Statement',
                onClick: () => navigate('/import'),
              }}
            />
          ) : (
            <>
              {/* Chart and Holdings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1">
                  <AllocationChart data={allocationData} />
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Portfolio Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Schemes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {summary.portfolioOverview.totalSchemes}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Folios</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {summary.portfolioOverview.totalFolios}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Realized P&L</p>
                        <p className={`text-2xl font-bold ${summary.portfolioOverview.realizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(summary.portfolioOverview.realizedProfitLoss)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Unrealized P&L</p>
                        <p className={`text-2xl font-bold ${summary.portfolioOverview.unrealizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(summary.portfolioOverview.unrealizedProfitLoss)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings Table */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Holdings Breakdown
                  </h2>
                  <Link to="/holdings">
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
                <HoldingsTable funds={summary.funds} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
