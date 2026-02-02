import { useState, useEffect } from 'react'
import { usePortfolios } from '../../hooks/usePortfolios'
import { usePortfolioContext } from '../../context/PortfolioContext'
import { AddTransactionModal } from '../portfolio/AddTransactionModal'
import { AddMetalTransactionModal } from '../portfolio/AddMetalTransactionModal'
import { AddFDModal } from '../portfolio/AddFDModal'
import { AssetClassSelection, AssetClass } from './AssetClassSelection'
import { TransactionMethodSelection, TransactionMethod } from './TransactionMethodSelection'
import { ImportCASForm } from './ImportCASForm'
import { ImportStockBulkForm } from './ImportStockBulkForm'

interface TransactionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

type FlowStep = 'portfolio-selection' | 'asset-class' | 'transaction-method' | 'transaction-form' | 'import-cas' | 'import-bulk'

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const { data: portfolios = [] } = usePortfolios()
  const { selectedPortfolioIds } = usePortfolioContext()
  const [currentStep, setCurrentStep] = useState<FlowStep>(() => {
    // Start with portfolio selection if multiple portfolios are selected
    return selectedPortfolioIds.length === 1 ? 'asset-class' : 'portfolio-selection'
  })
  const [selectedAssetClass, setSelectedAssetClass] = useState<AssetClass | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<TransactionMethod | null>(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null)

  // Auto-select portfolio if only one is selected in context
  useEffect(() => {
    if (selectedPortfolioIds.length === 1) {
      setSelectedPortfolioId(selectedPortfolioIds[0])
    }
  }, [selectedPortfolioIds])

  const handlePortfolioSelect = (portfolioId: number) => {
    setSelectedPortfolioId(portfolioId)
    setCurrentStep('asset-class')
  }

  const handleAssetClassSelect = (assetClass: AssetClass) => {
    setSelectedAssetClass(assetClass)
    setCurrentStep('transaction-method')
  }

  const handleMethodSelect = (method: TransactionMethod) => {
    setSelectedMethod(method)
    if (method === 'import-cas') {
      setCurrentStep('import-cas')
    } else if (method === 'import-bulk') {
      setCurrentStep('import-bulk')
    } else {
      setCurrentStep('transaction-form')
    }
  }

  const handleSuccess = () => {
    // Reset all state
    const initialStep = selectedPortfolioIds.length === 1 ? 'asset-class' : 'portfolio-selection'
    setCurrentStep(initialStep)
    setSelectedAssetClass(null)
    setSelectedMethod(null)
    setSelectedPortfolioId(selectedPortfolioIds.length === 1 ? selectedPortfolioIds[0] : null)
    onSuccess?.()
  }

  const handleCancel = () => {
    // Reset all state
    const initialStep = selectedPortfolioIds.length === 1 ? 'asset-class' : 'portfolio-selection'
    setCurrentStep(initialStep)
    setSelectedAssetClass(null)
    setSelectedMethod(null)
    setSelectedPortfolioId(selectedPortfolioIds.length === 1 ? selectedPortfolioIds[0] : null)
    onCancel?.()
  }

  const handleBackToPortfolio = () => {
    setSelectedAssetClass(null)
    setSelectedMethod(null)
    setCurrentStep('portfolio-selection')
  }

  const handleBackToAssetClass = () => {
    setSelectedMethod(null)
    setCurrentStep('asset-class')
  }

  const handleBackToMethod = () => {
    setCurrentStep('transaction-method')
  }

  // Filter portfolios to show based on context selection
  const portfoliosToShow = selectedPortfolioIds.length > 1
    ? portfolios.filter(p => selectedPortfolioIds.includes(p.id))
    : portfolios

  // Step 1: Portfolio Selection (if multiple portfolios or none selected)
  if (currentStep === 'portfolio-selection') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Select Portfolio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedPortfolioIds.length > 1 
              ? 'Choose from your current selection to add the transaction'
              : 'Choose which portfolio to add the transaction to'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
          {portfoliosToShow.map((portfolio) => {
            const initials = portfolio.portfolioName
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <button
                key={portfolio.id}
                onClick={() => handlePortfolioSelect(portfolio.id)}
                className="group relative flex items-center gap-4 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-white dark:bg-gray-800 text-left"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                    ${portfolio.isPrimary 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200'}
                  `}>
                    {initials}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                      {portfolio.portfolioName}
                    </h3>
                    {portfolio.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Primary
                      </span>
                    )}
                  </div>
                  
                  {portfolio.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                      {portfolio.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      PAN: {portfolio.pan}
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0">
                  <svg 
                    className="w-6 h-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        {portfoliosToShow.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No Portfolios Found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please create a portfolio first to add transactions
            </p>
          </div>
        )}

        {onCancel && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  // Step 2: Asset Class Selection
  if (currentStep === 'asset-class') {
    return (
      <AssetClassSelection
        onSelect={handleAssetClassSelect}
        onCancel={selectedPortfolioIds.length === 1 ? onCancel : handleBackToPortfolio}
      />
    )
  }

  // Step 3: Transaction Method Selection
  if (currentStep === 'transaction-method' && selectedAssetClass) {
    return (
      <TransactionMethodSelection
        assetClass={selectedAssetClass}
        onSelect={handleMethodSelect}
        onBack={handleBackToAssetClass}
      />
    )
  }

  // Step 4a: Import CAS Form
  if (currentStep === 'import-cas' && selectedPortfolioId) {
    return (
      <ImportCASForm
        portfolioId={selectedPortfolioId}
        onSuccess={handleSuccess}
        onBack={handleBackToMethod}
      />
    )
  }

  // Step 4b: Import Stock Bulk Form
  if (currentStep === 'import-bulk' && selectedPortfolioId) {
    return (
      <ImportStockBulkForm
        portfolioId={selectedPortfolioId}
        onSuccess={handleSuccess}
        onBack={handleBackToMethod}
      />
    )
  }

  // Step 4c: Manual Transaction Form
  if (currentStep === 'transaction-form' && selectedPortfolioId) {
    // Show metal transaction modal for gold
    if (selectedAssetClass === 'gold') {
      return (
        <AddMetalTransactionModal
          isOpen={true}
          onClose={handleCancel}
          portfolioId={selectedPortfolioId}
          onSuccess={handleSuccess}
        />
      )
    }
    
    // Show FD modal for fixed-income
    if (selectedAssetClass === 'fixed-income') {
      return (
        <AddFDModal
          isOpen={true}
          onClose={handleCancel}
          portfolioId={selectedPortfolioId}
          onSuccess={handleSuccess}
        />
      )
    }
    
    // Show regular transaction modal for MF and stocks
    return (
      <AddTransactionModal
        isOpen={true}
        onClose={handleCancel}
        portfolioId={selectedPortfolioId}
        onSuccess={handleSuccess}
        initialAssetType={selectedAssetClass === 'stocks' ? 'STOCK' : 'MUTUAL_FUND'}
        hideAssetTypeSelector={true} // Hide since user already selected asset class
      />
    )
  }

  return null
}
