// Schedule Types

export type ScheduleType = 'SIP' | 'SWP'
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
export type ScheduleFrequency = 'MONTHLY' | 'QUARTERLY' | 'WEEKLY'
export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED'

export interface Schedule {
  id: number
  portfolioId: number
  folioNumber: string
  isin: string
  schemeName?: string
  scheduleType: ScheduleType
  amount: number
  startDate: string // YYYY-MM-DD
  endDate: string | null
  frequency: ScheduleFrequency
  dayOfExecution: number
  status: ScheduleStatus
  executedInstallments: number
  totalInstallments: number | null
  nextExecutionDate: string | null // [YYYY, MM, DD] from API
  lastExecutedAt: string | null
  backfillCompletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutionLog {
  id: number
  scheduleId: number
  scheduledDate: string
  actualExecutionDate: string | null
  status: ExecutionStatus
  amountExecuted: number | null
  unitsAllocated: number | null
  navUsed: number | null
  errorMessage: string | null
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleRequest {
  portfolio_id: number
  folio_number: string
  isin: string
  schedule_type: ScheduleType
  amount: number
  start_date: string
  end_date?: string
  frequency: ScheduleFrequency
  day_of_execution: number
}

export interface UpdateScheduleRequest {
  amount?: number
  end_date?: string
  day_of_execution?: number
}

export interface ScheduleFilters {
  type?: ScheduleType
  status?: ScheduleStatus
  portfolioId?: number
}

export interface CashFlow {
  monthlyInflow: number
  monthlyOutflow: number
  monthlyNetFlow: number
  quarterlyInflow: number
  quarterlyOutflow: number
  quarterlyNetFlow: number
  totalSipSchedules: number
  totalSwpSchedules: number
}
