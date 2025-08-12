import { Container } from '../components/atoms/Container'
import { WelcomeSection } from '../components/organisms/WelcomeSection'
import { ActionButtons } from '../components/organisms/ActionButtons'

export function Home() {
  const actionButtons = [
    { to: '/create', label: 'Create Advent Calendar', variant: 'primary' as const },
    { to: '/view', label: 'I received an advent calendar', variant: 'primary' as const }
  ]

  return (
    <Container>
      <WelcomeSection />
      <ActionButtons buttons={actionButtons} />
    </Container>
  )
} 