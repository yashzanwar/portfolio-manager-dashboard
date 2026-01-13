import { apiClient } from './api'
import {
  Schedule,
  ExecutionLog,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  CashFlow,
} from '../types/schedule'

// Transform API response (snake_case) to frontend format (camelCase)
function transformSchedule(data: any): Schedule {
  return {
    id: data.id,
    portfolioId: data.portfolio_id,
    folioNumber: data.folio_number,
    isin: data.isin,
    schemeName: data.scheme_name,
    scheduleType: data.schedule_type,
    amount: data.amount,
    startDate: formatDateArray(data.start_date),
    endDate: data.end_date ? formatDateArray(data.end_date) : null,
    frequency: data.frequency,
    dayOfExecution: data.day_of_execution,
    status: data.status,
    executedInstallments: data.executed_installments || 0,
    totalInstallments: data.total_installments,
    nextExecutionDate: data.next_execution_date ? formatDateArray(data.next_execution_date) : null,
    lastExecutedAt: data.last_executed_at,
    backfillCompletedAt: data.backfill_completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function transformExecutionLog(data: any): ExecutionLog {
  return {
    id: data.id,
    scheduleId: data.schedule_id,
    scheduledDate: formatDateArray(data.scheduled_date),
    actualExecutionDate: data.actual_execution_date ? formatDateArray(data.actual_execution_date) : null,
    status: data.status,
    amountExecuted: data.amount_executed,
    unitsAllocated: data.units_allocated,
    navUsed: data.nav_used,
    errorMessage: data.error_message,
    retryCount: data.retry_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Helper to format date array [YYYY, MM, DD] to YYYY-MM-DD string
function formatDateArray(dateArray: number[] | string): string {
  if (typeof dateArray === 'string') return dateArray
  if (!Array.isArray(dateArray) || dateArray.length !== 3) return ''
  const [year, month, day] = dateArray
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const ScheduleAPI = {
  // Get all schedules for a portfolio
  async getSchedulesByPortfolio(portfolioId: number): Promise<Schedule[]> {
    const response = await apiClient.get(`/schedules?portfolio_id=${portfolioId}`)
    return response.data.map(transformSchedule)
  },

  // Get schedule by ID
  async getScheduleById(scheduleId: number): Promise<Schedule[]> {
    const response = await apiClient.get(`/schedules/${scheduleId}`)
    return transformSchedule(response.data)
  },

  // Get all schedules for the logged-in user
  async getUserSchedules(): Promise<Schedule[]> {
    const response = await apiClient.get('/schedules')
    return response.data.map(transformSchedule)
  },

  // Get execution logs for a schedule
  async getExecutionLogs(scheduleId: number): Promise<ExecutionLog[]> {
    const response = await apiClient.get(`/schedules/${scheduleId}/executions`)
    return response.data.map(transformExecutionLog)
  },

  // Create new schedule
  async createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
    const response = await apiClient.post('/schedules', data)
    return transformSchedule(response.data)
  },

  // Update schedule
  async updateSchedule(scheduleId: number, data: UpdateScheduleRequest): Promise<Schedule> {
    const response = await apiClient.put(`/schedules/${scheduleId}`, data)
    return transformSchedule(response.data)
  },

  // Pause schedule
  async pauseSchedule(scheduleId: number): Promise<Schedule> {
    const response = await apiClient.post(`/schedules/${scheduleId}/pause`)
    return transformSchedule(response.data)
  },

  // Resume schedule
  async resumeSchedule(scheduleId: number): Promise<Schedule> {
    const response = await apiClient.post(`/schedules/${scheduleId}/resume`)
    return transformSchedule(response.data)
  },

  // Cancel schedule
  async cancelSchedule(scheduleId: number): Promise<Schedule> {
    const response = await apiClient.post(`/schedules/${scheduleId}/cancel`)
    return transformSchedule(response.data)
  },

  // Complete schedule (mark as manually completed)
  async completeSchedule(scheduleId: number): Promise<Schedule> {
    const response = await apiClient.post(`/schedules/${scheduleId}/complete`)
    return transformSchedule(response.data)
  },

  // Execute pending schedules manually
  async executePending(): Promise<{ message: string; executed: number }> {
    const response = await apiClient.post('/schedules/execute-pending')
    return response.data
  },

  // Get cash flow analysis for portfolio
  async getCashFlow(portfolioId: number): Promise<CashFlow> {
    const response = await apiClient.get(`/schedules/cashflow?portfolio_id=${portfolioId}`)
    return {
      monthlyInflow: response.data.monthly_inflow,
      monthlyOutflow: response.data.monthly_outflow,
      monthlyNetFlow: response.data.monthly_net_flow,
      quarterlyInflow: response.data.quarterly_inflow,
      quarterlyOutflow: response.data.quarterly_outflow,
      quarterlyNetFlow: response.data.quarterly_net_flow,
      totalSipSchedules: response.data.total_sip_schedules,
      totalSwpSchedules: response.data.total_swp_schedules,
    }
  },
}
