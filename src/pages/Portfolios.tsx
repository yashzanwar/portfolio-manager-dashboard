import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Plus, CheckSquare, Square, Layers } from 'lucide-react'
import {
  usePortfolios,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  useSetPrimaryPortfolio,
} from '../hooks/usePortfolios'
import { useCombinedPortfolio } from '../hooks/useCombinedPortfolio'
import { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '../types/portfolio'
import { PortfolioCard } from '../components/portfolio/PortfolioCard'
import { PortfolioFormModal } from '../components/portfolio/PortfolioFormModal'
import { DeletePortfolioModal } from '../components/portfolio/DeletePortfolioModal'
import { CombinedSummaryCard } from '../components/portfolio/CombinedSummaryCard'
import { PortfolioBreakdownTable } from '../components/portfolio/PortfolioBreakdownTable'
import { CombinedHoldingsTable } from '../components/portfolio/CombinedHoldingsTable'
import { CombinedPortfolioChart } from '../components/portfolio/CombinedPortfolioChart'
import { Button, PortfolioCardSkeleton, EmptyState, Card } from '../components/common'

export default function Portfolios() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<number[]>([])

  const { data: portfolios = [], isLoading, error } = usePortfolios()
  const { data: combinedData, isLoading: isCombinedLoading } = useCombinedPortfolio(selectedPortfolioIds)
  const createMutation = useCreatePortfolio()
  const updateMutation = useUpdatePortfolio()
  const deleteMutation = useDeletePortfolio()
  const setPrimaryMutation = useSetPrimaryPortfolio()

  const handleCreate = async (data: CreatePortfolioRequest) => {
    await createMutation.mutateAsync(data)
  }

  const handleEdit = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (data: UpdatePortfolioRequest) => {
    if (selectedPortfolio) {
      await updateMutation.mutateAsync({ id: selectedPortfolio.id, data })
    }
  }

  const handleDelete = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedPortfolio) {
      await deleteMutation.mutateAsync(selectedPortfolio.id)
    }
  }

  const handleSetPrimary = async (portfolio: Portfolio) => {
    await setPrimaryMutation.mutateAsync(portfolio.id)
  }

  const handleView = (portfolio: Portfolio) => {
    navigate('/dashboard', { state: { portfolioId: portfolio.id } })
  }

  const togglePortfolioSelection = (portfolioId: number) => {
    setSelectedPortfolioIds(prev =>
      prev.includes(portfolioId)
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    )
  }

  const selectAll = () => {
    setSelectedPortfolioIds(filteredPortfolios.map(p => p.id))
  }

  const deselectAll = () => {
    setSelectedPortfolioIds([])
  }

  const filteredPortfolios = portfolios.filter((p) =>
    p.portfolioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <PortfolioCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load portfolios</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Portfolios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your investment portfolios
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          Create Portfolio
        </Button>
      </div>

      {/* Multi-Select Controls */}
      {filteredPortfolios.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedPortfolioIds.length} of {filteredPortfolios.length} selected
                </span>
              </div>
              {selectedPortfolioIds.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click on portfolios to select/deselect
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={selectedPortfolioIds.length === filteredPortfolios.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={selectedPortfolioIds.length === 0}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Combined Summary */}
      {selectedPortfolioIds.length > 0 && combinedData && !isCombinedLoading && (
        <>
          <CombinedSummaryCard
            summary={combinedData.overall}
            portfolioCount={combinedData.portfolio_count}
            mode={combinedData.mode}
          />
          {/* Portfolio Value Chart */}
          <CombinedPortfolioChart
            portfolioIds={selectedPortfolioIds}
            mode={combinedData.mode}
          />
          {/* Portfolio Breakdown Table (only for combined mode) */}
          <PortfolioBreakdownTable
            portfolios={combinedData.portfolios}
            mode={combinedData.mode}
          />

          {/* Combined Holdings Table */}
          <CombinedHoldingsTable
            funds={combinedData.funds}
            mode={combinedData.mode}
          />
        </>
      )}

      {selectedPortfolioIds.length > 0 && isCombinedLoading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading combined summary...</span>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search portfolios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Portfolio Grid */}
      {filteredPortfolios.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8 text-gray-400" />}
          title={searchTerm ? 'No portfolios found' : 'No portfolios yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first portfolio to track your investments'
          }
          action={
            !searchTerm
              ? {
                  label: 'Create Portfolio',
                  onClick: () => setIsCreateModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortfolios.map((portfolio) => {
            const isSelected = selectedPortfolioIds.includes(portfolio.id)
            return (
              <div
                key={portfolio.id}
                className="relative cursor-pointer"
                onClick={() => togglePortfolioSelection(portfolio.id)}
              >
                {/* Selection Indicator */}
                <div className={`absolute -top-2 -right-2 z-10 rounded-full p-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {isSelected ? (
                    <CheckSquare className="w-6 h-6" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                </div>
                
                {/* Portfolio Card with selection border */}
                <div className={`transition-all ${
                  isSelected
                    ? 'ring-4 ring-blue-500 ring-opacity-50 scale-[1.02]'
                    : ''
                }`}>
                  <PortfolioCard
                    portfolio={portfolio}
                    onEdit={(p, e) => {
                      if (e) e.stopPropagation()
                      handleEdit(p)
                    }}
                    onDelete={(p, e) => {
                      if (e) e.stopPropagation()
                      handleDelete(p)
                    }}
                    onSetPrimary={(p, e) => {
                      if (e) e.stopPropagation()
                      handleSetPrimary(p)
                    }}
                    onView={(p, e) => {
                      if (e) e.stopPropagation()
                      handleView(p)
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <PortfolioFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Create New Portfolio"
      />

      <PortfolioFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPortfolio(null)
        }}
        onSubmit={handleUpdate}
        portfolio={selectedPortfolio}
        title="Edit Portfolio"
      />

      <DeletePortfolioModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPortfolio(null)
        }}
        onConfirm={handleConfirmDelete}
        portfolio={selectedPortfolio}
      />
    </div>
  )
}
