import { useState } from 'react'
import { ModernModal } from './ModernModal'

export function DialogTest() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dialog ESC Test</h2>
      <button onClick={() => setIsOpen(true)}>
        Open Dialog (ESC should close it)
      </button>
      
      <ModernModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        className="test-dialog"
      >
        <h3>Test Dialog</h3>
        <p>Press ESC to close this dialog.</p>
        <p>Or click outside the dialog.</p>
        <button onClick={() => setIsOpen(false)}>
          Close Dialog
        </button>
      </ModernModal>
    </div>
  )
} 