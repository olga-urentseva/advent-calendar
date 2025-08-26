import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CreateCalendar } from './pages/CreateCalendar'
import { ViewCalendar } from './pages/ViewCalendar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import Snowflakes from './components/atoms/Snowflakes'

function App() {

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
      </ErrorBoundary>
    </Router>
  )
}

export default App
