import { Link } from 'react-router-dom'
import { Button } from '../../atoms/Button'
import './styles.css'

export function ActiveButtons({ clearData }: { clearData: () => void }) {

  return (
    <div className="create-own-section">
      <button
          onClick={clearData}
          className="clear-calendar-button"
          title="Clear calendar"
        >
          🗑️
        </button>
      <Link to="/create">
        <Button variant="primary" className="create-own-btn">
          🎁 Create Your Own Advent Calendar
        </Button>
      </Link>
      
      {/* <p className="create-own-text">
        Spread the joy! Create an advent calendar for someone special.
      </p> */}
    </div>
  )
}
