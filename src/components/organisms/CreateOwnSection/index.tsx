import { Link } from 'react-router-dom'
import { Button } from '../../atoms/Button'
import './styles.css'

export function CreateOwnSection() {

  return (
    <div className="create-own-section">
      <Link to="/create">
        <Button variant="primary" className="create-own-btn">
          🎁 Create Your Own Advent Calendar
        </Button>
      </Link>
      <p className="create-own-text">
        Spread the joy! Create an advent calendar for someone special.
      </p>
    </div>
  )
}
