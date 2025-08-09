import { FormGroup, Label } from '../../atoms'
import './styles.css'

interface DayCountSelectorProps {
  dayCount: number
  onDayCountChange: (count: number) => void
}

export function DayCountSelector({ dayCount, onDayCountChange }: DayCountSelectorProps) {
  return (
    <FormGroup>
      <Label htmlFor="day-count-buttons">Number of Days</Label>
      <div className="day-count-buttons" id="day-count-buttons" role="group" aria-labelledby="day-count-buttons">
        <button
          type="button"
          className={`day-count-btn ${dayCount === 25 ? 'active' : ''}`}
          onClick={() => onDayCountChange(25)}
        >
          25 Days
        </button>
        <button
          type="button"
          className={`day-count-btn ${dayCount === 15 ? 'active' : ''}`}
          onClick={() => onDayCountChange(15)}
        >
          15 Days
        </button>
        <button
          type="button"
          className={`day-count-btn ${dayCount === 7 ? 'active' : ''}`}
          onClick={() => onDayCountChange(7)}
        >
          7 Days
        </button>
      </div>
    </FormGroup>
  )
}
