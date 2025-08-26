import { Modal } from '../../atoms/Modal'
import { Button } from '../../atoms/Button'
import './styles.css'

interface FileAccessModalProps {
  isOpen: boolean
  onClose: () => void
  onRequestAccess: () => Promise<void>
  isRequesting: boolean
}

export function FileAccessModal({ 
  isOpen, 
  onClose, 
  onRequestAccess, 
  isRequesting 
}: FileAccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} header="File Access Required">
      <div className="file-access-modal">
        <div className="file-access-icon">
          📁
        </div>
        
        <div className="file-access-message">
          <h3>Calendar File Access</h3>
          <p>
            To view your advent calendar, we need permission to access the calendar file 
            that was previously saved to your device.
          </p>
          
          <p>
            This ensures your calendar data persists between browser sessions and 
            page refreshes.
          </p>
          
          <div className="file-access-benefits">
            <h4>Benefits:</h4>
            <ul>
              <li>✅ Calendar persists after page refresh</li>
              <li>✅ No data loss when closing browser</li>
              <li>✅ Full control over your calendar file</li>
              <li>✅ Works offline</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={onRequestAccess}
            disabled={isRequesting}
          >
            {isRequesting ? 'Requesting Access...' : 'Grant File Access'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
