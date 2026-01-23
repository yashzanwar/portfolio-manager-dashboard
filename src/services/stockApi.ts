import { apiClient } from './api'

export interface BulkUploadOptions {
  validateOnly?: boolean
  skipDuplicates?: boolean
  uploadSource?: string
  description?: string
}

export interface UploadSummary {
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

export const StockAPI = {
  /**
   * Bulk upload stock transactions from CSV/Excel file
   */
  bulkUploadTransactions: async (
    portfolioId: number,
    file: File,
    options: BulkUploadOptions = {}
  ): Promise<UploadSummary> => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options.validateOnly !== undefined) {
      formData.append('validateOnly', String(options.validateOnly))
    }
    if (options.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', String(options.skipDuplicates))
    }
    if (options.uploadSource) {
      formData.append('uploadSource', options.uploadSource)
    }
    if (options.description) {
      formData.append('description', options.description)
    }

    const response = await apiClient.post(
      `/portfolios/${portfolioId}/stocks/transactions/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    
    return response.data
  },
}
