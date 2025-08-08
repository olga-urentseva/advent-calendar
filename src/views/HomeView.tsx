import { Link } from 'react-router-dom'

export function HomeView() {
  return (
    <div className="container">
      <h1 className="title">Magic Advent Calendar</h1>
      <p className="subtitle">
        Create a personalized advent calendar for your loved ones or open one you received
      </p>
      
      <div className="button-group">
        <Link 
          to="/create"
          className="btn btn-primary"
        >
          Create Advent Calendar
        </Link>
        
        <Link 
          to="/view"
          className="btn btn-primary"
        >
          I received an advent calendar
        </Link>
      </div>
    </div>
  )
} 