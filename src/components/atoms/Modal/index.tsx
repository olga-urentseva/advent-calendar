import { useEffect, useRef, type ReactNode } from 'react'
import './styles.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  header?: string
  className?: string
}

export function Modal({ isOpen, onClose, children, header, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isOpen) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
    } 
  }, [isOpen])

  return (
    <dialog
      ref={ref}
      className={`modal-dialog ${className || ''}`}
      onCancel={onClose}
    >
      <div className="modal-content">
        {header && (
          <div className="modal-header">
            <h2 className="modal-title">{header}</h2>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </dialog>
  )
}
