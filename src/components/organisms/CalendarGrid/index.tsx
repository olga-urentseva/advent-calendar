import type { DayContent } from '../../../types/calendar'
import './styles.css'

interface CalendarGridProps {
  days: DayContent[]
  currentDayCount: number
  isDayCompleted: (day: number) => boolean
  onDayClick: (day: number) => void
}

export function CalendarGrid({ 
  days, 
  currentDayCount, 
  isDayCompleted, 
  onDayClick 
}: CalendarGridProps) {
  return (
    <div className="calendar-grid">
      <h3>Calendar Days (Click to edit)</h3>
      <div className="days-grid">
        {days.slice(0, currentDayCount).map((day) => (
          <button
            key={day.day}
            className={`day-cell ${isDayCompleted(day.day) ? 'completed' : ''}`}
            onClick={() => onDayClick(day.day)}
          >
            <span className="day-number">{day.day}</span>
            {isDayCompleted(day.day) && <span className="checkmark">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
