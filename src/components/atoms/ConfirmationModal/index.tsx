import { Modal } from '../Modal'
import { Button } from '../Button'
import './styles.css'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={title}
      className={`confirmation-modal ${variant}`}
    >
      <div className="confirmation-content">
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="btn-cancel"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            className="btn-confirm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
