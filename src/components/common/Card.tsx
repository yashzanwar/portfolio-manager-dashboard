import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

export const Card = ({ variant = 'default', className = '', children, ...props }: CardProps) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg'
  }
  
  return (
    <div 
      className={`rounded-xl p-6 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export const CardHeader = ({ title, subtitle, action, className = '', children, ...props }: CardHeaderProps) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          {children}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export const CardFooter = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  )
}
