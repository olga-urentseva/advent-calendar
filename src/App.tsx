import { useState } from 'react'
import { HomeView } from './views/HomeView'
import { CreateCalendarView } from './views/CreateCalendarView'
import { ViewCalendarView } from './views/ViewCalendarView'
import { ErrorBoundary } from './components/ErrorBoundary'

type AppMode = 'home' | 'creator' | 'viewer'

function App() {
  const [mode, setMode] = useState<AppMode>('home')

  const handleCreateCalendar = () => {
    setMode('creator')
  }

  const handleOpenCalendar = () => {
    setMode('viewer')
  }

  const handleBackToHome = () => {
    setMode('home')
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {mode === 'home' && (
          <HomeView 
            onCreateCalendar={handleCreateCalendar}
            onOpenCalendar={handleOpenCalendar}
          />
        )}
        
        {mode === 'creator' && (
          <CreateCalendarView onBack={handleBackToHome} />
        )}
        
        {mode === 'viewer' && (
          <ViewCalendarView 
            onBack={handleBackToHome} 
            onCreateCalendar={handleCreateCalendar}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
