import { Link } from 'react-router-dom'
import { Button } from '../../atoms'
import './styles.css'

interface ActionButton {
  to: string
  label: string
  variant?: 'primary' | 'secondary'
}

interface ActionButtonsProps {
  buttons: ActionButton[]
}

export function ActionButtons({ buttons }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      {buttons.map((button, index) => (
        <Link key={index} to={button.to}>
          <Button variant={button.variant || 'primary'}>
            {button.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}
