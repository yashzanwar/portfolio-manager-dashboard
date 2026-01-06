import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileJson, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '../components/common/Button'
import { usePortfolios } from '../hooks/usePortfolios'
import { Portfolio } from '../types/portfolio'
import { PortfolioAPI } from '../services/portfolioApi'
import toast from 'react-hot-toast'

type Step = 'select-portfolio' | 'upload-data' | 'preview' | 'result'

interface CASData {
  investorInfo: {
    name: string
    email?: string
    mobile?: string
  }
  folios: any[]
}

interface ImportResult {
  success: boolean
  investorId?: number
  newTransactions?: number
  duplicateTransactions?: number
  processedTransactions?: number
  recalculatedFolios?: number
  errorMessage?: string
}

export default function ImportCAS() {
  const navigate = useNavigate()
  const { data: portfolios = [], isLoading: loadingPortfolios } = usePortfolios()
  
  const [step, setStep] = useState<Step>('select-portfolio')
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file')
  const [casData, setCasData] = useState<CASData | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Auto-select primary or first portfolio
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      const primary = portfolios.find(p => p.isPrimary) || portfolios[0]
      setSelectedPortfolio(primary)
    }
  }, [portfolios, selectedPortfolio])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setCasData(data)
        setStep('preview')
      } catch (err) {
        toast.error('Invalid JSON file format')
      }
    }
    reader.readAsText(file)
  }

  const handlePasteJson = () => {
    try {
      const data = JSON.parse(jsonText)
      setCasData(data)
      setStep('preview')
    } catch (err) {
      toast.error('Invalid JSON format. Please check your input.')
    }
  }

  const handleImport = async () => {
    if (!selectedPortfolio || !casData) return

    setIsUploading(true)
    try {
      console.log('Importing CAS data for portfolio:', selectedPortfolio.id)
      console.log('CAS data structure:', {
        hasInvestor: !!casData.investor,
        hasMutualFunds: !!casData.mutual_funds,
        mutualFundsCount: casData.mutual_funds?.length || 0
      })
      
      const response = await PortfolioAPI.importCAS(selectedPortfolio.id, casData)
      console.log('Import response:', response)
      
      setImportResult(response)
      setStep('result')
      toast.success('CAS data imported successfully!')
    } catch (err: any) {
      console.error('Import error:', err)
      console.error('Error response:', err.response)
      console.error('Error data:', err.response?.data)
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to import CAS data'
      setImportResult({
        success: false,
        errorMessage
      })
      setStep('result')
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setCasData(null)
    setJsonText('')
    setImportResult(null)
    setStep('select-portfolio')
  }

  const handleViewPortfolio = () => {
    if (selectedPortfolio) {
      navigate('/dashboard', { state: { portfolioId: selectedPortfolio.id } })
    }
  }

  // Loading state
  if (loadingPortfolios) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // No portfolios state
  if (portfolios.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Portfolios Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create a portfolio first before importing CAS data
          </p>
          <Button variant="primary" onClick={() => navigate('/portfolios')}>
            Create Portfolio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Import CAS Statement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your Consolidated Account Statement (CAS) in JSON format
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'select-portfolio', label: 'Select Portfolio' },
              { key: 'upload-data', label: 'Upload Data' },
              { key: 'preview', label: 'Preview' },
              { key: 'result', label: 'Result' },
            ].map((s, idx, arr) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === s.key
                        ? 'bg-blue-600 text-white'
                        : arr.findIndex(x => x.key === step) > idx
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {arr.findIndex(x => x.key === step) > idx ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 hidden md:block">
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      arr.findIndex(x => x.key === step) > idx
                        ? 'bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          {/* Step 1: Select Portfolio */}
          {step === 'select-portfolio' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Select Portfolio
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose which portfolio to import the CAS data into
              </p>
              
              <div className="space-y-3 mb-8">
                {portfolios.map((portfolio) => (
                  <button
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolio(portfolio)}
                    className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedPortfolio?.id === portfolio.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {portfolio.portfolioName}
                          </h3>
                          {portfolio.isPrimary && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          PAN: {portfolio.pan}
                        </p>
                        {portfolio.description && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                      {selectedPortfolio?.id === portfolio.id && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setStep('upload-data')}
                  disabled={!selectedPortfolio}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload Data */}
          {step === 'upload-data' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Upload CAS Data
              </h2>
              
              {/* Method Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    uploadMethod === 'file'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMethod('paste')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    uploadMethod === 'paste'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Paste JSON
                </button>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div className="mb-8">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        JSON files only
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}

              {/* JSON Paste */}
              {uploadMethod === 'paste' && (
                <div className="mb-8">
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="Paste your CAS JSON data here..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Paste the complete JSON content from your CAS file
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={() => setStep('select-portfolio')}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                {uploadMethod === 'paste' && (
                  <Button
                    variant="primary"
                    onClick={handlePasteJson}
                    disabled={!jsonText.trim()}
                  >
                    Validate & Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && casData && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Review & Confirm
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Import Summary
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Investor Name</dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white mt-1">
                        {casData.investorInfo?.name || 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Number of Folios</dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white mt-1">
                        {casData.folios?.length || 0}
                      </dd>
                    </div>
                    {casData.investorInfo?.email && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Email</dt>
                        <dd className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {casData.investorInfo.email}
                        </dd>
                      </div>
                    )}
                    {casData.investorInfo?.mobile && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Mobile</dt>
                        <dd className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {casData.investorInfo.mobile}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex">
                    <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Importing to: {selectedPortfolio?.portfolioName}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        PAN: {selectedPortfolio?.pan}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={() => setStep('upload-data')}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      Import Data
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && importResult && (
            <div>
              <div className="text-center mb-8">
                {importResult.success ? (
                  <>
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Import Successful!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your CAS data has been imported successfully
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Import Failed
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {importResult.errorMessage || 'An error occurred during import'}
                    </p>
                  </>
                )}
              </div>

              {importResult.success && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Import Details
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">New Transactions</dt>
                      <dd className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {importResult.newTransactions || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Duplicate Transactions</dt>
                      <dd className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                        {importResult.duplicateTransactions || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Total Processed</dt>
                      <dd className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {importResult.processedTransactions || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Folios Updated</dt>
                      <dd className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {importResult.recalculatedFolios || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                {importResult.success && (
                  <Button variant="primary" onClick={handleViewPortfolio}>
                    View Portfolio
                  </Button>
                )}
                <Button
                  variant={importResult.success ? 'secondary' : 'primary'}
                  onClick={handleReset}
                >
                  {importResult.success ? 'Import Another' : 'Try Again'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
