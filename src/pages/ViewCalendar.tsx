import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarController } from '../controllers/CalendarController'
import type { AdventCalendar, DayContent } from '../types/calendar'
import { Container, Title, BackLink } from '../components/atoms'

export function ViewCalendar() {
  const [controller] = useState(() => new CalendarController())
  const [calendar, setCalendar] = useState<AdventCalendar | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayContent | null>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [hasOpenedFirstDay, setHasOpenedFirstDay] = useState(false)
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  // Update countdown every second
  useEffect(() => {
    if (!calendar) return
    
    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [calendar, testMode])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const processFile = async (file: File) => {
    try {
      setError('')
      await controller.importCalendar(file)
      setCalendar(controller.getCalendar())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import calendar')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find(file => file.name.endsWith('.json'))
    
    if (jsonFile) {
      await processFile(jsonFile)
    } else {
      setError('Please select a valid JSON file')
    }
  }

  const handleDayClick = (day: DayContent) => {
    if (isDayUnlocked(day.day)) {
      setSelectedDay(day)
      if (!hasOpenedFirstDay) {
        setHasOpenedFirstDay(true)
      }
    }
  }



  const getNextUnlockTime = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    // If we're not in December yet, countdown to December 1st
    if (currentMonth < 12) {
      return new Date(currentYear, 11, 1) // December 1st
    }
    
    // If we're in December, find the next day to unlock
    if (currentMonth === 12) {
      const nextDay = currentDay + 1
      if (nextDay <= 25) {
        return new Date(currentYear, 11, nextDay) // Next day in December
      }
    }
    
    // If all days are unlocked, return null
    return null
  }

  const calculateCountdown = () => {
    const nextUnlockTime = getNextUnlockTime()
    if (!nextUnlockTime) {
      setCountdown(null)
      return
    }

    const now = new Date()
    const diff = nextUnlockTime.getTime() - now.getTime()

    if (diff <= 0) {
      setCountdown(null)
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setCountdown({ days, hours, minutes, seconds })
  }

  const isDayUnlocked = (day: number) => {
    if (testMode) return true
    
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    // If we're not in December yet, only day 1 is unlocked
    if (currentMonth < 12) {
      return day === 1
    }
    
    // If we're in December, unlock days up to today
    if (currentMonth === 12) {
      return day <= currentDay
    }
    
    return false
  }

  if (!calendar) {
    return (
      <Container>
        <div className="header">
          <BackLink to="/">
            ← Back
          </BackLink>
          <Title>Open Calendar</Title>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="upload-section">
          <h3>Upload Your Advent Calendar</h3>
          <p>Drag and drop your calendar file here or click to browse</p>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="file-input"
            id="calendar-upload"
          />
          <label 
            htmlFor="calendar-upload"
            className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <strong>Choose a file</strong>
              <span>or drag and drop</span>
            </div>
          </label>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="header">
        <BackLink to="/">
          ← Back
        </BackLink>
        <Title>{calendar.title}</Title>
        <p className="subtitle">Created by {calendar.createdBy}</p>
      </div>

      <div className="test-mode-toggle">
        <label className="test-toggle">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">🧪 Test Mode (Unlock All Days)</span>
        </label>
      </div>

      {!testMode && countdown && (
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
      )}

      <div className="calendar-view">
        <div className="days-grid">
          {calendar.days.map((day) => (
            <button
              key={day.day}
              className={`day-cell ${isDayUnlocked(day.day) ? 'unlocked' : 'locked'} ${day.content ? 'has-content' : ''}`}
              onClick={() => handleDayClick(day)}
              disabled={!isDayUnlocked(day.day)}
            >
              <span className="day-number">{day.day}</span>
              {!isDayUnlocked(day.day) && <span className="lock-icon">🔒</span>}
              {day.content && isDayUnlocked(day.day) && <span className="content-indicator">✨</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedDay && (
        <DayViewer
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {hasOpenedFirstDay && (
        <div className="create-own-section">
          <Link 
            to="/create"
            className="btn btn-primary create-own-btn"
          >
            🎁 Create Your Own Advent Calendar
          </Link>
          <p className="create-own-text">
            Spread the joy! Create an advent calendar for someone special.
          </p>
        </div>
      )}
    </Container>
  )
}

// Day Viewer Component
interface DayViewerProps {
  day: DayContent
  onClose: () => void
}

function DayViewer({ day, onClose }: DayViewerProps) {
  const renderContent = () => {
    switch (day.type) {
      case 'text':
        return (
          <div className="text-content">
            <p>{day.content}</p>
          </div>
        )
      
      case 'image':
        return (
          <div className="image-content">
            <img 
              src={day.content} 
              alt={day.title || `Day ${day.day}`}
              className="content-image"
            />
          </div>
        )
      
      case 'video':
        if (day.source === 'url') {
          // Handle YouTube/Vimeo URLs
          const videoId = extractVideoId(day.content)
          if (videoId) {
            return (
              <div className="video-content">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={day.title || `Day ${day.day}`}
                  frameBorder="0"
                  allowFullScreen
                  className="content-video"
                />
              </div>
            )
          }
        }
        return (
          <div className="video-content">
            <video 
              src={day.content} 
              controls
              className="content-video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )
      
      default:
        return <p>Unsupported content type</p>
    }
  }

  return (
    <div className="day-viewer-overlay">
      <div className="day-viewer">
        <div className="viewer-header">
          <h3>{day.title || `Day ${day.day}`}</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="viewer-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
} 