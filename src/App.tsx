import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CreateCalendar } from './pages/CreateCalendar'
import { ViewCalendar } from './pages/ViewCalendar'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCalendar />} />
          <Route path="/view" element={<ViewCalendar />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  )
}

export default App
