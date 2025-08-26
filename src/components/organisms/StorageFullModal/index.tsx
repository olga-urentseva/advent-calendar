import { Button } from '../../atoms/Button'
import { Modal } from '../../atoms/Modal'
import './styles.css'

interface StorageFullModalProps {
  isOpen: boolean
  onClose: () => void
  onClearStorage: () => void
  requiredMB: number
  availableMB: number
}

export function StorageFullModal({ 
  isOpen, 
  onClose, 
  onClearStorage, 
  requiredMB, 
  availableMB 
}: StorageFullModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} header="Storage Full">
      <div className="storage-full-modal">
        <div className="storage-icon">
          🚫
        </div>
        
        <div className="storage-message">
          <h3>Cannot Import Calendar</h3>
          <p>
            Since we care about privacy and do not store any data on our side, 
            we use your browser's local storage. Your storage is currently full 
            and cannot accommodate this calendar file.
          </p>
          
          <div className="storage-details">
            <div className="storage-requirement">
              <strong>Required:</strong> {requiredMB} MB
            </div>
            <div className="storage-available">
              <strong>Available:</strong> {availableMB} MB
            </div>
          </div>
          
          <p className="storage-solution">
            To import this calendar, you need to clear your current storage first. 
            <strong>This will permanently delete all previously uploaded data.</strong>
          </p>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onClearStorage}>
            Clear Storage & Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}