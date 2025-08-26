import React from 'react'
import './styles.css'

interface BrowserCompatibilityProps {
  onClose: () => void
}

export const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({ onClose }) => {
  const currentBrowser = getBrowserInfo()
  
  return (
    <div className="browser-compatibility-modal">
      <div className="browser-compatibility-content">
        <div className="browser-compatibility-header">
          <h2>🚀 Browser Update Required</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="browser-compatibility-body">
          <p>
            Your current browser <strong>{currentBrowser.name} {currentBrowser.version}</strong> doesn't support 
            the advanced file storage features required for this app.
          </p>
          
          <p>
            To enjoy the full experience with reliable file storage and faster performance, 
            please update to one of these modern browsers:
          </p>
          
          <div className="browser-requirements">
            <div className="browser-item">
              <div className="browser-icon">🌐</div>
              <div className="browser-details">
                <h3>Chrome</h3>
                <p>Version 86 or later</p>
              </div>
            </div>
            
            <div className="browser-item">
              <div className="browser-icon">🔥</div>
              <div className="browser-details">
                <h3>Firefox</h3>
                <p>Version 111 or later</p>
              </div>
            </div>
            
            <div className="browser-item">
              <div className="browser-icon">🧭</div>
              <div className="browser-details">
                <h3>Safari</h3>
                <p>Version 17 or later</p>
              </div>
            </div>
          </div>
          
          <div className="compatibility-benefits">
            <h3>Benefits of updating:</h3>
            <ul>
              <li>✨ Gigabytes of storage space (vs limited browser storage)</li>
              <li>⚡ Faster file operations</li>
              <li>🔒 More reliable data persistence</li>
              <li>📱 Better mobile experience</li>
            </ul>
          </div>
          
          <div className="compatibility-actions">
            <a 
              href="https://www.google.com/chrome/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="update-button primary"
            >
              Download Chrome
            </a>
            <a 
              href="https://www.mozilla.org/firefox/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="update-button"
            >
              Download Firefox
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function getBrowserInfo() {
  const ua = navigator.userAgent
  
  if (ua.includes('Chrome')) {
    const match = ua.match(/Chrome\/(\d+)/)
    return {
      name: 'Chrome',
      version: match ? match[1] : 'Unknown'
    }
  }
  
  if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/)
    return {
      name: 'Firefox',
      version: match ? match[1] : 'Unknown'
    }
  }
  
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/)
    return {
      name: 'Safari',
      version: match ? match[1] : 'Unknown'
    }
  }
  
  if (ua.includes('Edge')) {
    const match = ua.match(/Edg\/(\d+)/)
    return {
      name: 'Edge',
      version: match ? match[1] : 'Unknown'
    }
  }
  
  return {
    name: 'Unknown Browser',
    version: 'Unknown'
  }
}