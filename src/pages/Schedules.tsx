import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Repeat, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { EmptyState } from '../components/common'
import { ScheduleCard } from '../components/schedule/ScheduleCard'
import { PortfolioSelector } from '../components/portfolio/PortfolioSelector'
import { usePortfolios } from '../hooks/usePortfolios'
import { Portfolio } from '../types/portfolio'
import { Schedule, ScheduleType, ScheduleStatus, CashFlow } from '../types/schedule'
import { ScheduleAPI } from '../services/scheduleApi'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/formatters'

export default function Schedules() {
  const navigate = useNavigate()
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null)
  const [loadingCashFlow, setLoadingCashFlow] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | ScheduleType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ScheduleStatus>('ALL')

  // Select default portfolio
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const primary = portfolios.find(p => p.isPrimary) || portfolios[0]
      setSelectedPortfolio(primary)
    }
  }, [portfolios, selectedPortfolio])

  // Fetch schedules
  useEffect(() => {
    if (!selectedPortfolio) return

    const fetchSchedules = async () => {
      setLoading(true)
      try {
        const data = await ScheduleAPI.getSchedulesByPortfolio(selectedPortfolio.id)
        setSchedules(data)
      } catch (error: any) {
        console.error('Error fetching schedules:', error)
        toast.error('Failed to load schedules')
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [selectedPortfolio])

  // Fetch cash flow
  useEffect(() => {
    if (!selectedPortfolio) return

    const fetchCashFlow = async () => {
      setLoadingCashFlow(true)
      try {
        const data = await ScheduleAPI.getCashFlow(selectedPortfolio.id)
        setCashFlow(data)
      } catch (error: any) {
        console.error('Error fetching cash flow:', error)
        setCashFlow(null)
      } finally {
        setLoadingCashFlow(false)
      }
    }

    fetchCashFlow()
  }, [selectedPortfolio])

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchesType = typeFilter === 'ALL' || s.scheduleType === typeFilter
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
      return matchesType && matchesStatus
    })
  }, [schedules, typeFilter, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const active = schedules.filter(s => s.status === 'ACTIVE').length
    const sips = schedules.filter(s => s.scheduleType === 'SIP').length
    const swps = schedules.filter(s => s.scheduleType === 'SWP').length
    return { active, sips, swps, total: schedules.length }
  }, [schedules])

  const handleScheduleUpdated = async () => {
    // Refresh schedules list and cash flow
    if (selectedPortfolio) {
      const data = await ScheduleAPI.getSchedulesByPortfolio(selectedPortfolio.id)
      setSchedules(data)
      const cashFlowData = await ScheduleAPI.getCashFlow(selectedPortfolio.id)
      setCashFlow(cashFlowData)
    }
  }

  if (loadingPortfolios) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SIP/SWP Schedules</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your systematic investment and withdrawal plans
        </p>
      </div>

      {/* Portfolio Selector */}
      <div className="mb-6">
        <PortfolioSelector
          portfolios={portfolios}
          selectedPortfolio={selectedPortfolio}
          onSelectPortfolio={setSelectedPortfolio}
          isLoading={loadingPortfolios}
        />
      </div>

      {/* Cash Flow Summary */}
      {selectedPortfolio && (
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Cash Flow</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your recurring investment commitment</p>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          {loadingCashFlow ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-white/50 dark:bg-gray-800/50 rounded-lg h-20"></div>
              ))}
            </div>
          ) : cashFlow ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inflow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Inflow (SIP)</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(cashFlow.monthlyInflow)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {cashFlow.totalSipSchedules} active {cashFlow.totalSipSchedules === 1 ? 'SIP' : 'SIPs'}
                </p>
              </div>

              {/* Outflow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Outflow (SWP)</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(cashFlow.monthlyOutflow)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {cashFlow.totalSwpSchedules} active {cashFlow.totalSwpSchedules === 1 ? 'SWP' : 'SWPs'}
                </p>
              </div>

              {/* Net Flow */}
              <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 ${
                cashFlow.monthlyNetFlow >= 0
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-red-500 dark:border-red-400'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className={`w-4 h-4 ${
                    cashFlow.monthlyNetFlow >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Monthly</span>
                </div>
                <p className={`text-2xl font-bold ${
                  cashFlow.monthlyNetFlow >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {cashFlow.monthlyNetFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow.monthlyNetFlow)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Quarterly: {cashFlow.quarterlyNetFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow.quarterlyNetFlow)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Schedules</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h3>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">Active</p>
          <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.active}</h3>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-400">SIPs</p>
          <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.sips}</h3>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-700 dark:text-orange-400">SWPs</p>
          <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">{stats.swps}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="SIP">SIP Only</option>
          <option value="SWP">SWP Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Schedules Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
            </div>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-12 h-12 text-gray-400" />}
          title="No schedules found"
          description={
            schedules.length === 0
              ? "Create your first SIP or SWP schedule to get started"
              : "No schedules match the selected filters"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onUpdate={handleScheduleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
