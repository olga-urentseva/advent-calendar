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
      <button 
          className="how-it-works__trigger" 
          aria-expanded="false"
          aria-label="Click to learn how it works"
        >
          How it works?
      </button>
      <p className='how-it-works__description'>Create your calendar by adding up to 24 special messages, photos, or videos. Share the unique file provided after creation with your loved one, and they can open it in this application — one cell each day leading up to Christmas! More info about privacy you can find on <Link to="/about">About page</Link>.</p>
    </div>
  )
} 