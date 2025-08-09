import { Link } from 'react-router-dom'
import { Container, Title, Subtitle } from '../components/atoms'

export function Home() {
  return (
    <Container>
      <Title>Magic Advent Calendar</Title>
      <Subtitle>
        Create a personalized advent calendar for your loved ones or open one you received
      </Subtitle>
      
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
    </Container>
  )
} 