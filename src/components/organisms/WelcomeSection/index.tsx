import { Title } from '../../atoms/Title'
import { Subtitle } from '../../atoms/Subtitle'
import './styles.css'



export function WelcomeSection() {
  return (
    <div className="welcome-section">
      <Title>Magic Advent Calendar</Title>
      <Subtitle>Create a personalized digital advent calendar for your loved ones or open one you received</Subtitle>
    </div>
  )
}
