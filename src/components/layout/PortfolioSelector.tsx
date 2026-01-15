import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Briefcase, CheckSquare, Square } from 'lucide-react'
import { usePortfolios } from '../../hooks/usePortfolios'
import { usePortfolioContext } from '../../context/PortfolioContext'

export function PortfolioSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: portfolios = [], isLoading } = usePortfolios()
  const { selectedPortfolioIds, togglePortfolio, selectAll, clearAll, setSelectedPortfolios } = usePortfolioContext()

  // Clean up selected IDs - remove any IDs that don't exist in current portfolios
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioIds.length > 0) {
      const validIds = portfolios.map(p => p.id)
      const cleanedIds = selectedPortfolioIds.filter(id => validIds.includes(id))
      
      // Only update if there were invalid IDs
      if (cleanedIds.length !== selectedPortfolioIds.length) {
        setSelectedPortfolios(cleanedIds)
      }
    }
  }, [portfolios, selectedPortfolioIds, setSelectedPortfolios])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate counts based on valid portfolios only
  const validSelectedIds = selectedPortfolioIds.filter(id => 
    portfolios.some(p => p.id === id)
  )
  const selectedCount = validSelectedIds.length
  const totalCount = portfolios.length
  const allSelected = selectedCount === totalCount && totalCount > 0

  const getDisplayText = () => {
    if (selectedCount === 0) return 'Select Portfolios'
    if (selectedCount === 1) {
      const portfolio = portfolios.find(p => p.id === validSelectedIds[0])
      return portfolio?.portfolioName || 'Portfolio Selected'
    }
    if (allSelected) return 'All Portfolios'
    return `${selectedCount} Portfolios`
  }

  const handleSelectAll = () => {
    if (allSelected) {
      clearAll()
    } else {
      selectAll(portfolios.map(p => p.id))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
          {getDisplayText()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed md:absolute top-16 md:top-full left-0 right-0 md:left-auto md:right-auto mt-0 md:mt-2 md:w-80 bg-white dark:bg-gray-800 border-t md:border border-gray-200 dark:border-gray-700 md:rounded-lg shadow-lg z-50 max-h-[calc(100vh-4rem)] md:max-h-96 overflow-hidden flex flex-col">
          {/* Header with Select All */}
          <div className="p-3 md:p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-3 w-full px-4 py-3 md:px-3 md:py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-6 h-6 md:w-5 md:h-5 text-blue-600" />
              ) : (
                <Square className="w-6 h-6 md:w-5 md:h-5 text-gray-400" />
              )}
              <span className="text-base md:text-sm font-medium text-gray-900 dark:text-white">
                Select All ({totalCount})
              </span>
            </button>
          </div>

          {/* Portfolio List */}
          <div className="overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
              </div>
            ) : portfolios.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No portfolios available
              </div>
            ) : (
              <div className="py-2">
                {portfolios.map((portfolio) => {
                  const isSelected = selectedPortfolioIds.includes(portfolio.id)
                  return (
                    <button
                      key={portfolio.id}
                      onClick={() => togglePortfolio(portfolio.id)}
                      className="flex items-center gap-3 w-full px-4 py-3.5 md:py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-6 h-6 md:w-5 md:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-base md:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {portfolio.portfolioName}
                        </div>
                        {portfolio.description && (
                          <div className="text-sm md:text-xs text-gray-500 dark:text-gray-400 truncate">
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

          {/* Footer with selection count */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {selectedCount > 0 ? (
                <span>
                  {selectedCount} of {totalCount} selected
                </span>
              ) : (
                <span>Select portfolios to view combined data</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
