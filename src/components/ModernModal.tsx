import { type ReactNode } from 'react'

interface ModernModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function ModernModal({ isOpen, onClose, children, className = '' }: ModernModalProps) {
  if (!isOpen) return null

  return (
    <dialog
      className={`modal-dialog ${className}`}
      open
      onClose={onClose}
    >
      <div className="modal-content">
        {children}
      </div>
    </dialog>
  )
} 