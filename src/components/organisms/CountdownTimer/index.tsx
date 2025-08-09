import './styles.css'

interface CountdownTimerProps {
  countdown: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
}

export function CountdownTimer({ countdown }: CountdownTimerProps) {
  return (
    <div className="countdown-section">
      <h3>⏰ Next Day Unlocks In:</h3>
      <div className="countdown-timer">
        <div className="countdown-item">
          <span className="countdown-value">{countdown.days}</span>
          <span className="countdown-label">Days</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.hours.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Hours</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.minutes.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Minutes</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.seconds.toString().padStart(2, '0')}</span>
          <span className="countdown-label">Seconds</span>
        </div>
      </div>
    </div>
  )
}
