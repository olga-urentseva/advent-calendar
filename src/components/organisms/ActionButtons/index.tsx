
import { ButtonLink } from '../../atoms/ButtonLink'
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
        <ButtonLink key={index} to={button.to}>
          {button.label}
        </ButtonLink>
      ))}
    </div>
  )
}
