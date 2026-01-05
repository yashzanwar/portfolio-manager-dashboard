import { useState, useEffect } from 'react'
import { TrendingUp, Wallet, DollarSign, Package } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { MutualFundList } from '../components/MutualFundList'
import { PortfolioAPI } from '../services/portfolioApi'
import { PortfolioTransformer } from '../services/portfolioTransformer'
import { PortfolioStats, MutualFund } from '../types/portfolio'
import { mockPortfolioStats, mockMutualFunds } from '../data/mockData'

export default function Dashboard() {
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [funds, setFunds] = useState<MutualFund[]>([])
  const [investorName, setInvestorName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  const fetchPortfolioData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Get PAN from user input or configuration
      const pan = 'ABHPZ9146J' // Default PAN, should be configurable
      const response = await PortfolioAPI.getComprehensiveSummary(pan)
      
      // Transform API response to UI-friendly format
      const portfolioStats = PortfolioTransformer.toPortfolioStats(response)
      const mutualFunds = PortfolioTransformer.toMutualFunds(response)
      
      setStats(portfolioStats)
      setFunds(mutualFunds)
      setInvestorName('Investor') // investor_name no longer in API response
      setUseMockData(false)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      // Fallback to mock data if API fails
      setStats(mockPortfolioStats)
      setFunds(mockMutualFunds)
      setInvestorName('Demo User')
      setUseMockData(true)
      setError(null) // Clear error since we're using mock data
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Portfolio</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={fetchPortfolioData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            {investorName && (
              <p className="text-gray-600 dark:text-gray-400">
                Welcome, {investorName}
              </p>
            )}
          </div>
          {useMockData && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg text-sm">
              Demo Mode
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Investment"
          value={`₹${stats.totalInvested.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Current Value"
          value={`₹${stats.currentValue.toLocaleString('en-IN')}`}
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatCard
          title="Total Returns"
          value={`₹${stats.totalReturns.toLocaleString('en-IN')}`}
          change={stats.returnsPercentage}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Total Funds"
          value={funds.length.toString()}
          icon={<Package className="w-6 h-6" />}
        />
      </div>

      {/* Mutual Funds List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Mutual Funds
        </h2>
        <MutualFundList funds={funds} />
      </div>
    </div>
  )
}
