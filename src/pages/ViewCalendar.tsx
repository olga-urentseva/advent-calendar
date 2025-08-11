import { useState, useEffect } from 'react'
import { CalendarController } from '../controllers/CalendarController'
import type { AdventCalendar, DayContent } from '../types/calendar'
import { Container, Title, BackLink, Subtitle, Modal } from '../components/atoms'
import { 
  CalendarUploader,
  TestModeToggle,
  CountdownTimer,
  CalendarViewer,
  DayViewer,
  CreateOwnSection
} from '../components/organisms'

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
    if (testMode) {
      setCountdown(null)
      return
    }

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

  const isDayUnlocked = (day: number): boolean => {
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

        <CalendarUploader
          isDragging={isDragging}
          onFileUpload={handleFileUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
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
        <Subtitle>Created by {calendar.createdBy}</Subtitle>
      </div>

      <TestModeToggle
        testMode={testMode}
        onTestModeChange={setTestMode}
      />

      {!testMode && countdown && (
        <CountdownTimer countdown={countdown} />
      )}

      <CalendarViewer
        days={calendar.days}
        isDayUnlocked={isDayUnlocked}
        onDayClick={handleDayClick}
      />

      <Modal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        header={selectedDay ? (selectedDay.title || `Day ${selectedDay.day}`) : ''}
      >
        {selectedDay && (
          <DayViewer
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </Modal>

      <CreateOwnSection hasOpenedFirstDay={hasOpenedFirstDay} />
    </Container>
  )
} 