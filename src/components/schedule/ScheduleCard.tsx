import { useState } from 'react'
import { Calendar, TrendingUp, TrendingDown, Pause, Play, X, ChevronRight } from 'lucide-react'
import { Schedule } from '../../types/schedule'
import { ScheduleAPI } from '../../services/scheduleApi'
import { Button } from '../common'
import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface ScheduleCardProps {
  schedule: Schedule
  onUpdate: () => void
}

export function ScheduleCard({ schedule, onUpdate }: ScheduleCardProps) {
  const [loading, setLoading] = useState(false)

  const isSIP = schedule.scheduleType === 'SIP'
  const isActive = schedule.status === 'ACTIVE'
  const isPaused = schedule.status === 'PAUSED'

  const handlePause = async () => {
    setLoading(true)
    try {
      await ScheduleAPI.pauseSchedule(schedule.id)
      toast.success('Schedule paused')
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to pause schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    setLoading(true)
    try {
      await ScheduleAPI.resumeSchedule(schedule.id)
      toast.success('Schedule resumed')
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resume schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this schedule?')) return
    
    setLoading(true)
    try {
      await ScheduleAPI.cancelSchedule(schedule.id)
      toast.success('Schedule cancelled')
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel schedule')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (schedule.status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTypeColor = () => {
    return isSIP 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  }

  const progress = schedule.totalInstallments
    ? (schedule.executedInstallments / schedule.totalInstallments) * 100
    : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isSIP ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              {isSIP ? (
                <TrendingUp className={`w-5 h-5 ${isSIP ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
              ) : (
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor()}`}>
                {schedule.scheduleType}
              </span>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor()}`}>
            {schedule.status}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
          {schedule.schemeName || 'Unknown Scheme'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          Folio: {schedule.folioNumber}
        </p>
      </div>

      {/* Details */}
      <div className="px-6 pb-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(schedule.amount)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Frequency</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {schedule.frequency}
          </span>
        </div>

        {schedule.nextExecutionDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Next Date</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(schedule.nextExecutionDate)}
            </span>
          </div>
        )}

        {/* Progress */}
        {schedule.totalInstallments && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {schedule.executedInstallments} / {schedule.totalInstallments}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isSIP ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePause}
              disabled={loading}
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResume}
              disabled={loading}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}
          {(isActive || isPaused) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast('Schedule details coming soon!')}
            className="ml-auto"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
