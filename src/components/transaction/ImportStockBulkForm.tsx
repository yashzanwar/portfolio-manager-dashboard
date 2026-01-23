import { useState } from 'react'
import { Upload, FileSpreadsheet, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '../common/Button'
import { StockAPI } from '../../services/stockApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface UploadSummary {
  uploadBatchId: string
  fileName: string
  uploadedAt: string
  totalRows: number
  successCount: number
  failureCount: number
  duplicateCount: number
  validateOnly: boolean
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'VALIDATED' | 'VALIDATION_FAILED'
  errors: Array<{
    rowNumber: number
    transactionDate?: string
    companyName?: string
    isin?: string
    errors: string[]
  }>
  message: string
}

interface ImportStockBulkFormProps {
  portfolioId: number
  onSuccess: () => void
  onBack?: () => void
}

export function ImportStockBulkForm({ portfolioId, onSuccess, onBack }: ImportStockBulkFormProps) {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validExtensions = ['.csv', '.xlsx', '.xls']
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValid) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setUploadedFileName(file.name)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const file = event.dataTransfer.files?.[0]
    if (!file) return

    const validExtensions = ['.csv', '.xlsx', '.xls']
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValid) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    setSelectedFile(file)
    setUploadedFileName(file.name)
  }

  const handleUpload = async (validateOnly: boolean = false) => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      const actionText = validateOnly ? 'Validating' : 'Uploading'
      toast.loading(`${actionText} transactions...`, { id: 'bulk-upload' })
      
      const summary = await StockAPI.bulkUploadTransactions(
        portfolioId,
        selectedFile,
        {
          validateOnly,
          skipDuplicates: true,
          uploadSource: 'manual',
        }
      )
      
      setUploadSummary(summary)
      setShowSummary(true)
      
      if (validateOnly) {
        if (summary.status === 'VALIDATED') {
          toast.success(`Validation successful: ${summary.totalRows} rows valid`, { id: 'bulk-upload' })
        } else {
          toast.error(`Validation failed: ${summary.failureCount} errors found`, { id: 'bulk-upload' })
        }
      } else {
        if (summary.status === 'SUCCESS') {
          toast.success(`Successfully imported ${summary.successCount} transactions!`, { id: 'bulk-upload' })
        } else if (summary.status === 'PARTIAL_SUCCESS') {
          toast.success(`Imported ${summary.successCount} transactions (${summary.failureCount} failed)`, { id: 'bulk-upload' })
        } else {
          toast.error('Upload failed. Please check errors below.', { id: 'bulk-upload' })
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = 
        err.response?.data?.message ||
        err.message || 
        'Failed to upload file'
      toast.error(errorMessage, { id: 'bulk-upload' })
      setSelectedFile(null)
      setUploadedFileName('')
      const fileInput = document.getElementById('stock-bulk-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadedFileName('')
    setUploadSummary(null)
    setShowSummary(false)
    const fileInput = document.getElementById('stock-bulk-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleComplete = () => {
    // Redirect to stock holdings page
    navigate(`/holdings?tab=stocks&portfolio=${portfolioId}`)
    onSuccess()
  }

  if (showSummary && uploadSummary) {
    const statusConfig = {
      SUCCESS: { color: 'green', icon: CheckCircle, text: 'Upload Successful' },
      PARTIAL_SUCCESS: { color: 'yellow', icon: AlertCircle, text: 'Partially Successful' },
      FAILED: { color: 'red', icon: XCircle, text: 'Upload Failed' },
      VALIDATED: { color: 'green', icon: CheckCircle, text: 'Validation Successful' },
      VALIDATION_FAILED: { color: 'red', icon: XCircle, text: 'Validation Failed' },
    }

    const config = statusConfig[uploadSummary.status]
    const StatusIcon = config.icon

    return (
      <div className="space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Upload Summary
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {uploadSummary.fileName}
          </p>
        </div>

        {/* Status Card */}
        <div className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 border border-${config.color}-200 dark:border-${config.color}-800 rounded-lg p-6`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400 flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h3 className={`font-semibold text-${config.color}-900 dark:text-${config.color}-200 mb-1`}>
                {config.text}
              </h3>
              <p className={`text-sm text-${config.color}-800 dark:text-${config.color}-300`}>
                {uploadSummary.message}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadSummary.totalRows}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">Successful</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">{uploadSummary.successCount}</p>
          </div>
          {uploadSummary.failureCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">{uploadSummary.failureCount}</p>
            </div>
          )}
          {uploadSummary.duplicateCount > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">Duplicates Skipped</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadSummary.duplicateCount}</p>
            </div>
          )}
        </div>

        {/* Error Details */}
        {uploadSummary.errors && uploadSummary.errors.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Errors</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {uploadSummary.errors.map((error, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-900 dark:text-red-200">
                        Row {error.rowNumber}
                        {error.companyName && ` - ${error.companyName}`}
                      </p>
                      {error.transactionDate && (
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Date: {error.transactionDate}
                        </p>
                      )}
                      {error.isin && (
                        <p className="text-sm text-red-700 dark:text-red-300">
                          ISIN: {error.isin}
                        </p>
                      )}
                      <ul className="mt-2 space-y-1">
                        {error.errors.map((err, errIdx) => (
                          <li key={errIdx} className="text-sm text-red-800 dark:text-red-300">
                            • {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {uploadSummary.validateOnly ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Upload Different File
              </Button>
              {uploadSummary.status === 'VALIDATED' && (
                <Button onClick={() => handleUpload(false)}>
                  Proceed with Upload
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset}>
                Upload More Transactions
              </Button>
              {uploadSummary.successCount > 0 && (
                <Button onClick={handleComplete}>
                  View Stock Holdings
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Bulk Import Stock Transactions
        </h2>
        <p className="text-sm text-gray-400">
          Upload CSV or Excel file with your stock buy/sell transactions
        </p>
      </div>

      {/* File Format Info */}
      <div className="bg-black border border-gray-900 rounded-lg p-4">
        <h3 className="font-medium text-blue-400 mb-2">File Format</h3>
        <p className="text-sm text-gray-300 mb-2">
          Your file should include these columns:
        </p>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Transaction Date</strong> - Format: YYYY-MM-DD or DD/MM/YYYY</li>
          <li>• <strong>Company Name</strong> - Company name</li>
          <li>• <strong>ISIN</strong> - 12-character ISIN code</li>
          <li>• <strong>Transaction Type</strong> - Buy or Sell</li>
          <li>• <strong>Price</strong> - Price per share</li>
          <li>• <strong>Shares</strong> - Number of shares (always positive)</li>
          <li>• <strong>Brokerage</strong> (Optional) - Brokerage charges</li>
          <li>• <strong>Description</strong> (Optional) - Transaction notes</li>
        </ul>
      </div>

      {/* Upload Area */}
      <div>
        <label
          htmlFor="stock-bulk-upload"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-black border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploadedFileName ? (
              <>
                <FileSpreadsheet className="w-12 h-12 mb-3 text-green-400" />
                <p className="mb-2 text-sm font-medium text-gray-200">
                  {uploadedFileName}
                </p>
                <p className="text-xs text-gray-400">
                  Click to change file or drag and drop
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-3 text-gray-500" />
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  CSV, XLSX or XLS (MAX. 5MB, 1000 rows)
                </p>
              </>
            )}
          </div>
          <input
            id="stock-bulk-upload"
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleUpload(true)}
            disabled={isUploading}
          >
            Validate Only
          </Button>
          <Button
            onClick={() => handleUpload(false)}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : 'Upload Transactions'}
          </Button>
        </div>
      )}

      {/* Download Template */}
      <div className="pt-4 border-t border-gray-900">
        <a
          href="/sample-stock-upload.csv"
          download
          className="text-sm text-blue-400 hover:underline"
        >
          Download sample template
        </a>
      </div>
    </div>
  )
}
