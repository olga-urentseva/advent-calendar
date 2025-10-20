import { WelcomeSection } from '../../components/organisms/WelcomeSection'
import { ActionButtons } from '../../components/organisms/ActionButtons'
import './styles.css'
import { Link } from 'react-router-dom'

export function Home() {
  const actionButtons = [
    { to: '/create', label: 'Create Advent Calendar', variant: 'primary' as const },
    { to: '/view', label: 'I received an advent calendar', variant: 'primary' as const }
  ]

  return (
    <div className="inner-wrapper">
      <WelcomeSection />
      <ActionButtons buttons={actionButtons} />
      <p className='how-it-works__description'>
        Create your calendar by adding up to 24 special messages, photos, or videos. Once it’s ready, share the unique file with someone close to you—they can open one cell each day in this app as Christmas approaches! You can find more about privacy on the <Link to="/about">About page</Link>.
      </p>
    </div>
  )
} 