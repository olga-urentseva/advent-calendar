import { Container } from '../components/atoms'
import { WelcomeSection, ActionButtons } from '../components/organisms'

const actionButtons = [
  {
    to: '/create',
    label: 'Create Advent Calendar',
    variant: 'primary' as const
  },
  {
    to: '/view',
    label: 'I received an advent calendar',
    variant: 'primary' as const
  }
]

export function Home() {
  return (
    <Container>
      <WelcomeSection />
      <ActionButtons buttons={actionButtons} />
    </Container>
  )
} 