import { useState, useEffect } from 'react'
import { Calendar } from '../core/calendar'
import type { DayContent } from '../types/calendar'
import { Container } from '../components/atoms/Container'
import { Title } from '../components/atoms/Title'
import { BackLink } from '../components/atoms/BackLink'
import { Button } from '../components/atoms/Button'
import { Modal } from '../components/atoms/Modal'
import { CalendarForm } from '../components/organisms/CalendarForm'
import { DayCountSelector } from '../components/organisms/DayCountSelector'
import { CalendarGrid } from '../components/organisms/CalendarGrid'
import { ExportSection } from '../components/organisms/ExportSection'
import { DayEditor } from '../components/organisms/DayEditor'

// Create calendar instance once, outside the component
const calendarInstance = new Calendar()

export function CreateCalendar() {
  const [createdBy, setCreatedBy] = useState('')
  const [to, setTo] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [dayCount, setDayCount] = useState(25)
  const [isFullyCompleted, setIsFullyCompleted] = useState(false)

  // Load existing data from calendar on component mount
  useEffect(() => {
    const calendarData = calendarInstance.getCalendar()
    setCreatedBy(calendarData.createdBy)
    setTo(calendarData.to)
    setDayCount(calendarData.days.length)
    
    // Ensure calendar metadata is set from loaded data
    if (calendarData.createdBy) {
      calendarInstance.setCreatedBy(calendarData.createdBy)
    }
    if (calendarData.to) {
      calendarInstance.setTo(calendarData.to)
    }
    
    const fullyCompleted = calendarInstance.isFullyCompleted()
    console.log('On page load:', {
      createdBy: calendarData.createdBy,
      to: calendarData.to,
      completedDays: calendarInstance.getCompletedDays(),
      totalDays: calendarInstance.getDayCount(),
      fullyCompleted
    })
    setIsFullyCompleted(fullyCompleted)
  }, [])

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const handleDayCountChange = (count: number) => {
    setDayCount(count)
    // Reset the calendar with new day count
    calendarInstance.setDayCount(count)
  }

  const handleSaveDay = async (day: number, dayContent: DayContent) => {
    try {
      calendarInstance.setDayContent(day, dayContent)
      setSelectedDay(null)
      setError('')
      // Check if calendar is now fully completed
      const fullyCompleted = calendarInstance.isFullyCompleted()
      console.log('After saving day:', {
        day,
        fullyCompleted,
        completedDays: calendarInstance.getCompletedDays(),
        totalDays: calendarInstance.getDayCount(),
        createdBy: calendarInstance.getCreatedBy(),
        to: calendarInstance.getTo()
      })
      setIsFullyCompleted(fullyCompleted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save day content')
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError('')
      
      // Set metadata before export
      calendarInstance.setCreatedBy(createdBy)
      calendarInstance.setTo(to)
      
      const calendarData = calendarInstance.exportCalendar()
      
      // Download the file
      const dataBlob = new Blob([calendarData], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `advent_calendar.json`
      link.click()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export calendar')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDebugValidation = () => {
    calendarInstance.setCreatedBy(createdBy)
    calendarInstance.setTo(to)
    console.log('Debug Info:', {
      createdBy,
      to,
      completedDays: calendarInstance.getCompletedDays(),
      totalDays: calendarInstance.getDayCount(),
      isValid: calendarInstance.isValid(),
      isFullyCompleted: calendarInstance.isFullyCompleted()
    })
  }

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all calendar data? This action cannot be undone.')) {
      calendarInstance.clearStorage()
      setCreatedBy('')
      setTo('')
      setDayCount(25)
      setError('')
    }
  }

  const isDayCompleted = (day: number): boolean => {
    const dayContent = calendarInstance.getDay(day)
    return Boolean(dayContent && dayContent.content.trim() !== '')
  }

  const calendarData = calendarInstance.getCalendar()

  return (
    <Container>
      <div className="header">
        <BackLink to="/">
          ← Back
        </BackLink>
        <Title>Create Calendar</Title>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <CalendarForm
        createdBy={createdBy}
        to={to}
        onCreatedByChange={(value) => {
          setCreatedBy(value)
          calendarInstance.setCreatedBy(value)
          setIsFullyCompleted(calendarInstance.isFullyCompleted())
        }}
        onToChange={(value) => {
          setTo(value)
          calendarInstance.setTo(value)
          setIsFullyCompleted(calendarInstance.isFullyCompleted())
        }}
      />

      <DayCountSelector
        dayCount={dayCount}
        onDayCountChange={handleDayCountChange}
      />

      <CalendarGrid
        days={calendarData.days}
        currentDayCount={calendarData.days.length}
        isDayCompleted={isDayCompleted}
        onDayClick={handleDayClick}
      />

      <ExportSection
        isExporting={isExporting}
        createdBy={createdBy}
        to={to}
        completedDays={calendarInstance.getCompletedDays()}
        currentDayCount={calendarInstance.getDayCount()}
        isValid={calendarInstance.isValid()}
        isFullyCompleted={isFullyCompleted}
        onExport={handleExport}
        onDebugValidation={handleDebugValidation}
      />

      <div className="clear-data-section">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleClearAllData}
          className="clear-all-btn"
        >
          🗑️ Clear All Data
        </Button>
        <small className="clear-warning">
          This will remove all calendar data and reset to empty state
        </small>
      </div>

      <Modal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        header={`Day ${selectedDay}`}
      >
        {selectedDay && (
          <DayEditor
            day={selectedDay}
            dayContent={calendarInstance.getDay(selectedDay)}
            onSave={(dayContent) => handleSaveDay(selectedDay, dayContent)}
            onCancel={() => setSelectedDay(null)}
          />
        )}
      </Modal>
    </Container>
  )
} 