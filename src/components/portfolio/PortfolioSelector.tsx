import { Fragment, useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Briefcase } from 'lucide-react'
import { Portfolio } from '../../types/portfolio'
import { maskPAN } from '../../utils/formatters'

interface PortfolioSelectorProps {
  portfolios: Portfolio[]
  selectedPortfolio: Portfolio | null
  onSelect: (portfolio: Portfolio) => void
  isLoading?: boolean
}

export function PortfolioSelector({ 
  portfolios, 
  selectedPortfolio, 
  onSelect,
  isLoading 
}: PortfolioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleSelect = (portfolio: Portfolio) => {
    onSelect(portfolio)
    setIsOpen(false)
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded-lg w-64"></div>
    )
  }

  if (portfolios.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-300 text-sm">
          No portfolios found. Create a portfolio to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full md:w-auto px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <div className="flex-1 text-left min-w-0">
          {selectedPortfolio ? (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedPortfolio.portfolioName}
                </p>
                {selectedPortfolio.isPrimary && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {maskPAN(selectedPortfolio.pan)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a portfolio
            </p>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1 max-h-96 overflow-auto">
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                onClick={() => handleSelect(portfolio)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {selectedPortfolio?.id === portfolio.id ? (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {portfolio.portfolioName}
                    </p>
                    {portfolio.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {maskPAN(portfolio.pan)}
                  </p>
                  {portfolio.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {portfolio.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
