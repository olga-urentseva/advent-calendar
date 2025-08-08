import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomeView } from './views/HomeView'
import { CreateCalendarView } from './views/CreateCalendarView'
import { ViewCalendarView } from './views/ViewCalendarView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DialogTest } from './components/DialogTest'

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/create" element={<CreateCalendarView />} />
          <Route path="/view" element={<ViewCalendarView />} />
          <Route path="/test" element={<DialogTest />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  )
}

export default App
