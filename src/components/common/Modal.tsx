import { useEffect, HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({ isOpen, onClose, title, size = 'md', className = '', children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-black rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-900 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  onCancel?: () => void
  onConfirm?: () => void
  cancelText?: string
  confirmText?: string
  isLoading?: boolean
}

export const ModalFooter = ({ 
  onCancel, 
  onConfirm, 
  cancelText = 'Cancel', 
  confirmText = 'Confirm',
  isLoading,
  className = '',
  children 
}: ModalFooterProps) => {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-900 ${className}`}>
      {children || (
        <>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button variant="primary" onClick={onConfirm} isLoading={isLoading}>
              {confirmText}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
