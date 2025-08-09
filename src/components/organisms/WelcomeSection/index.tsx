import { Title, Subtitle } from '../../atoms'
import './styles.css'

interface WelcomeSectionProps {
  title?: string
  subtitle?: string
}

export function WelcomeSection({ 
  title = "Magic Advent Calendar",
  subtitle = "Create a personalized advent calendar for your loved ones or open one you received"
}: WelcomeSectionProps) {
  return (
    <div className="welcome-section">
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </div>
  )
}
