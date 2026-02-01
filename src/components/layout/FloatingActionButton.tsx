import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
}

export function FloatingActionButton({ onClick, label = 'Add Transaction' }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-6 z-30 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      aria-label={label}
    >
      <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
      <span className="font-medium hidden sm:inline">{label}</span>
    </button>
  )
}
