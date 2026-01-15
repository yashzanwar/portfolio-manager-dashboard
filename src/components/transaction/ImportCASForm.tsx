import { useState } from 'react'
import { Upload, FileJson, ArrowLeft } from 'lucide-react'
import { Button } from '../common/Button'
import { PortfolioAPI } from '../../services/portfolioApi'
import toast from 'react-hot-toast'

interface CASData {
  investorInfo?: {
    name: string
    email?: string
    mobile?: string
  }
  investor?: any
  mutual_funds?: any[]
  folios?: any[]
}

interface ImportCASFormProps {
  portfolioId: number
  onSuccess: () => void
  onBack?: () => void
}

export function ImportCASForm({ portfolioId, onSuccess, onBack }: ImportCASFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [pdfPassword, setPdfPassword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [casData, setCasData] = useState<CASData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
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

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return
    }

    setSelectedFile(file)
    setUploadedFileName(file.name)
  }

  const handleParseFile = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      toast.loading('Parsing CAS PDF...', { id: 'pdf-parse' })
      const data = await PortfolioAPI.parsePDF(selectedFile, pdfPassword || undefined)
      toast.success('PDF parsed successfully', { id: 'pdf-parse' })
      setCasData(data)
      setShowPreview(true)
    } catch (err: any) {
      console.error('File upload error:', err)
      const errorMessage = 
        err.response?.data?.error ||
        err.response?.data?.message || 
        err.response?.data?.detail ||
        err.message || 
        'Failed to parse PDF'
      toast.error(errorMessage, { id: 'pdf-parse' })
      setSelectedFile(null)
      setUploadedFileName('')
      const fileInput = document.getElementById('cas-file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (!casData) return

    setIsUploading(true)
    try {
      const response = await PortfolioAPI.importCAS(portfolioId, casData)
      toast.success(`Imported ${response.newTransactions || 0} new transactions!`)
      onSuccess()
    } catch (err: any) {
      console.error('Import error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to import CAS data'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadedFileName('')
    setPdfPassword('')
    setCasData(null)
    setShowPreview(false)
  }

  if (showPreview && casData) {
    const folioCount = casData.mutual_funds?.length || casData.folios?.length || 0
    const investorName = casData.investor?.name || casData.investorInfo?.name || 'Unknown'

    return (
      <div className="space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Preview CAS Data
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review the parsed data before importing
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Investor Information</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">Name: {investorName}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-medium text-green-900 dark:text-green-200 mb-2">Mutual Funds</h3>
          <p className="text-sm text-green-800 dark:text-green-300">
            Found {folioCount} folio(s) with transactions
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Import CAS Statement
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload your CAMS or Karvy CAS PDF file to import all mutual fund transactions
        </p>
      </div>

      {/* File Upload */}
      <div>
        <label
          htmlFor="cas-file-upload"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer 
            transition-colors
            ${selectedFile 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
            {selectedFile ? (
              <>
                <FileJson className="w-12 h-12 mb-3 text-blue-500" />
                <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                  {uploadedFileName}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Click to change file or drag and drop
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  CAS PDF file (password-protected supported)
                </p>
              </>
            )}
          </div>
          <input
            id="cas-file-upload"
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Password Input - Always visible */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          PDF Password (if protected)
        </label>
        <input
          type="password"
          value={pdfPassword}
          onChange={(e) => setPdfPassword(e.target.value)}
          placeholder="Leave empty if not password-protected"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onBack && (
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={isUploading}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleParseFile}
          disabled={!selectedFile || isUploading}
          className="flex-1"
        >
          {isUploading ? 'Parsing...' : 'Parse & Preview'}
        </Button>
      </div>
    </div>
  )
}
