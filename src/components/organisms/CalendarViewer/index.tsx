import type { DayContent } from '../../../types/calendar'
import './styles.css'

interface CalendarViewerProps {
  days: DayContent[]
  isDayUnlocked: (day: number) => boolean
  onDayClick: (day: DayContent) => void
}

export function CalendarViewer({ 
  days, 
  isDayUnlocked, 
  onDayClick 
}: CalendarViewerProps) {
  return (
    <div className="calendar-view">
      <div className="days-grid">
        {days.map((day) => (
          <button
            key={day.day}
            className={`day-cell ${isDayUnlocked(day.day) ? 'unlocked' : 'locked'} ${day.content ? 'has-content' : ''}`}
            onClick={() => onDayClick(day)}
            disabled={!isDayUnlocked(day.day)}
          >
            <span className="day-number">{day.day}</span>
            {!isDayUnlocked(day.day) && <span className="lock-icon">🔒</span>}
            {day.content && isDayUnlocked(day.day) && <span className="content-indicator">✨</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
