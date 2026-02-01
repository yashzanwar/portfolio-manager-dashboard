import { useEffect } from 'react'
import { X, CheckSquare, Square, Briefcase } from 'lucide-react'
import { usePortfolios } from '../../hooks/usePortfolios'
import { usePortfolioContext } from '../../context/PortfolioContext'

interface PortfolioSelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PortfolioSelectorModal({ isOpen, onClose }: PortfolioSelectorModalProps) {
  const { data: portfolios = [], isLoading } = usePortfolios()
  const { selectedPortfolioIds, togglePortfolio, selectAll, clearAll, setSelectedPortfolios } = usePortfolioContext()

  // Clean up selected IDs
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioIds.length > 0) {
      const validIds = portfolios.map(p => p.id)
      const cleanedIds = selectedPortfolioIds.filter(id => validIds.includes(id))
      
      if (cleanedIds.length !== selectedPortfolioIds.length) {
        setSelectedPortfolios(cleanedIds)
      }
    }
  }, [portfolios, selectedPortfolioIds, setSelectedPortfolios])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const validSelectedIds = selectedPortfolioIds.filter(id => 
    portfolios.some(p => p.id === id)
  )
  const selectedCount = validSelectedIds.length
  const totalCount = portfolios.length
  const allSelected = selectedCount === totalCount && totalCount > 0

  const handleSelectAll = () => {
    if (allSelected) {
      clearAll()
    } else {
      selectAll(portfolios.map(p => p.id))
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-950 rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Select Portfolios</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Select All */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-3 w-full p-3 hover:bg-gray-900 rounded-lg transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-6 h-6 text-blue-500" />
            ) : (
              <Square className="w-6 h-6 text-gray-500" />
            )}
            <span className="text-base font-medium text-gray-200">
              Select All ({totalCount})
            </span>
          </button>
        </div>

        {/* Portfolio List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Briefcase className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 text-center">
                No portfolios available
              </p>
            </div>
          ) : (
            <div className="py-2">
              {portfolios.map((portfolio) => {
                const isSelected = selectedPortfolioIds.includes(portfolio.id)
                return (
                  <button
                    key={portfolio.id}
                    onClick={() => togglePortfolio(portfolio.id)}
                    className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-900 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-base font-medium text-gray-200 truncate">
                        {portfolio.portfolioName}
                      </div>
                      {portfolio.description && (
                        <div className="text-sm text-gray-400 truncate mt-0.5">
                          {portfolio.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-400">
              {selectedCount > 0 ? (
                <span className="text-white font-medium">
                  {selectedCount} of {totalCount} selected
                </span>
              ) : (
                <span>Select portfolios to view</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
