import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Plus } from 'lucide-react'
import {
  usePortfolios,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  useSetPrimaryPortfolio,
} from '../hooks/usePortfolios'
import { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '../types/portfolio'
import { PortfolioCard } from '../components/portfolio/PortfolioCard'
import { PortfolioFormModal } from '../components/portfolio/PortfolioFormModal'
import { DeletePortfolioModal } from '../components/portfolio/DeletePortfolioModal'
import { Button, PortfolioCardSkeleton, EmptyState } from '../components/common'

export default function Portfolios() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)

  const { data: portfolios = [], isLoading, error } = usePortfolios()
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
          {filteredPortfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              onView={handleView}
            />
          ))}
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
