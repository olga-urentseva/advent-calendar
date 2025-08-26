import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CreateCalendar } from './pages/CreateCalendar'
import { ViewCalendar } from './pages/ViewCalendar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { BrowserCompatibility } from './components/atoms/BrowserCompatibility'
import Snowflakes from './components/atoms/Snowflakes'

function App() {
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false)
  const [hasCheckedCompatibility, setHasCheckedCompatibility] = useState(false)

  useEffect(() => {
    // Check OPFS support
    const isOPFSSupported = typeof navigator !== 'undefined' && 
                           'storage' in navigator && 
                           'getDirectory' in navigator.storage

    if (!isOPFSSupported) {
      // Check if user has dismissed this warning before
      const hasSeenWarning = localStorage.getItem('opfs-compatibility-warning-dismissed')
      if (!hasSeenWarning) {
        setShowCompatibilityWarning(true)
      }
    }
    
    setHasCheckedCompatibility(true)
  }, [])

  const handleCompatibilityClose = () => {
    setShowCompatibilityWarning(false)
    localStorage.setItem('opfs-compatibility-warning-dismissed', 'true')
  }

  if (!hasCheckedCompatibility) {
    return null // Avoid flash of content
  }

  return (
    <Router>
      <ErrorBoundary>
        <Snowflakes />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCalendar />} />
            <Route path="/view" element={<ViewCalendar />} />
          </Routes>
        </Layout>
        
        {showCompatibilityWarning && (
          <BrowserCompatibility onClose={handleCompatibilityClose} />
        )}
      </ErrorBoundary>
    </Router>
  )
}

export default App
