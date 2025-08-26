import { useState, useEffect } from 'react'
import { Calendar } from '../../core/calendar'
import type { DayContent } from '../../types/calendar'
import { Container } from '../../components/atoms/Container'
import { Modal } from '../../components/atoms/Modal'
import { ConfirmationModal } from '../../components/atoms/ConfirmationModal'
import { CalendarForm } from '../../components/organisms/CalendarForm'
import { DayCountSelector } from '../../components/organisms/DayCountSelector'
import { CalendarGrid } from '../../components/organisms/CalendarGrid'
import { ExportSection } from '../../components/organisms/ExportSection'
import { DayEditor } from '../../components/organisms/DayEditor'

import './styles.css'

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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingDayCount, setPendingDayCount] = useState<number | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [confirmationAction, setConfirmationAction] = useState<'dayCount' | 'clearData' | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  

  // Load existing data from calendar on component mount
  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        await calendarInstance.initialize()
        const calendarData = calendarInstance.getCalendar()
        setCreatedBy(calendarData.createdBy)
        setTo(calendarData.to)
        setDayCount(calendarData.days.length)
        
        const fullyCompleted = calendarInstance.isFullyCompleted()
        console.log('On page load:', {
          createdBy: calendarData.createdBy,
          to: calendarData.to,
          completedDays: calendarInstance.getCompletedDays(),
          totalDays: calendarInstance.getDayCount(),
          fullyCompleted
        })
        setIsFullyCompleted(fullyCompleted)
        setIsLoaded(true)
        
        // Load initial storage info
      } catch (error) {
        console.error('Failed to initialize calendar:', error)
        setError('Failed to load calendar data')
        setIsLoaded(true)
      }
    }
    
    initializeCalendar()
  }, [])

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const handleDayCountChange = (count: number) => {
    const calendarData = calendarInstance.getCalendar()
    
    // Check which specific days have content and will be lost
    const daysWithContent = calendarData.days
      .filter(day => day.content.trim() !== '')
      .map(day => day.day)
    
    const daysToBeLost = daysWithContent.filter(day => day > count)
    const daysToBePreserved = daysWithContent.filter(day => day <= count)
    
    // If content will be lost, show confirmation modal
    if (daysToBeLost.length > 0) {
      const message = `Changing to ${count} days will permanently delete content from days ${daysToBeLost.join(', ')}. Are you sure you want to continue?`
      setConfirmationMessage(message)
      setPendingDayCount(count)
      setConfirmationAction('dayCount')
      setShowConfirmation(true)
      return
    }
    
    // No content will be lost, proceed immediately
    applyDayCountChange(count, daysWithContent, daysToBePreserved, daysToBeLost)
  }

  const applyDayCountChange = async (count: number, daysWithContent: number[], daysToBePreserved: number[], daysToBeLost: number[]) => {
    try {
      setDayCount(count)
      // Update the calendar with new day count (content will be preserved)
      await calendarInstance.setDayCount(count)
      // Save to file manually
      await calendarInstance.saveToFile()
    
    // Show notification about content preservation/loss
    if (daysWithContent.length > 0) {
      let message = ''
      
      if (daysToBePreserved.length > 0) {
        message += `✅ Days ${daysToBePreserved.join(', ')} preserved`
      }
      
      if (daysToBeLost.length > 0) {
        if (message) message += '\n'
        message += `⚠️ Days ${daysToBeLost.join(', ')} will be lost`
      }
      
      // Show temporary notification
      setError('') // Clear any existing errors
      const notification = document.createElement('div')
      notification.className = 'content-preservation-notification'
      notification.textContent = message
      notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--color-accent);
        color: var(--color-primary);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 20rem;
        white-space: pre-line;
        font-size: 0.875rem;
      `
      document.body.appendChild(notification)
      
      // Remove notification after 4 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)
    }
    } catch (error) {
      setError('Failed to save day count change')
    }
  }

  const handleConfirmDayCountChange = async () => {
    if (pendingDayCount !== null) {
      const calendarData = calendarInstance.getCalendar()
      const daysWithContent = calendarData.days
        .filter(day => day.content.trim() !== '')
        .map(day => day.day)
      
      const daysToBeLost = daysWithContent.filter(day => day > pendingDayCount)
      const daysToBePreserved = daysWithContent.filter(day => day <= pendingDayCount)
      
      await applyDayCountChange(pendingDayCount, daysWithContent, daysToBePreserved, daysToBeLost)
      setPendingDayCount(null)
    }
  }

  const handleSaveDay = async (day: number, dayContent: DayContent) => {
    try {
      console.log('💾 Save button clicked - updating calendar in memory...')
      // Update content in memory first
      await calendarInstance.setDayContent(day, dayContent)
      
      console.log('💾 Now saving entire calendar to OPFS...')
      // Now save to file manually
      await calendarInstance.saveToFile()
      console.log('✅ Calendar successfully saved to OPFS!')
      
      setSelectedDay(null)
      setError('')
      
      // Update storage info after save
      console.log('🔄 About to update storage info after saving day...')
      console.log('✅ Storage info update completed after saving day')
      
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
      await calendarInstance.setCreatedBy(createdBy)
      await calendarInstance.setTo(to)
      
      const calendarData = calendarInstance.getCalendarJSON()
      
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

  const handleDebugValidation = async () => {
    try {
      await calendarInstance.setCreatedBy(createdBy)
      await calendarInstance.setTo(to)
      console.log('Debug Info:', {
        createdBy,
        to,
        completedDays: calendarInstance.getCompletedDays(),
        totalDays: calendarInstance.getDayCount(),
        isValid: calendarInstance.isValid(),
        isFullyCompleted: calendarInstance.isFullyCompleted()
      })
    } catch (error) {
      console.error('Debug validation failed:', error)
    }
  }

  const handleClearAllData = () => {
    setConfirmationMessage('Are you sure you want to clear all calendar data? This action cannot be undone.')
    setConfirmationAction('clearData')
    setShowConfirmation(true)
  }

  const isDayCompleted = (day: number): boolean => {
    const dayContent = calendarInstance.getDay(day)
    return Boolean(dayContent && dayContent.content.trim() !== '')
  }

  const calendarData = calendarInstance.getCalendar()

  if (!isLoaded) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading calendar data...
        </div>
      </Container>
    )
  }

  return (
    <Container>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <CalendarForm
        createdBy={createdBy}
        to={to}
        onCreatedByChange={async (value) => {
          setCreatedBy(value)
          try {
            await calendarInstance.setCreatedBy(value)
            await calendarInstance.saveToFile()
                setIsFullyCompleted(calendarInstance.isFullyCompleted())
          } catch (error) {
            setError('Failed to save created by field')
          }
        }}
        onToChange={async (value) => {
          setTo(value)
          try {
            await calendarInstance.setTo(value)
            await calendarInstance.saveToFile()
                setIsFullyCompleted(calendarInstance.isFullyCompleted())
          } catch (error) {
            setError('Failed to save to field')
          }
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
        onClearData={handleClearAllData}
      />

      <Modal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        header={`Day ${selectedDay}`}
      >
        {selectedDay && (
          <DayEditor
            day={selectedDay}
            dayContent={calendarInstance.getDay(selectedDay) || undefined}
            onSave={(dayContent) => handleSaveDay(selectedDay, dayContent)}
            onCancel={() => setSelectedDay(null)}
          />
        )}
      </Modal>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false)
          setPendingDayCount(null)
          setConfirmationAction(null)
        }}
        onConfirm={async () => {
          if (confirmationAction === 'dayCount') {
            await handleConfirmDayCountChange()
          } else if (confirmationAction === 'clearData') {
            try {
              await calendarInstance.clearStorage()
              setCreatedBy('')
              setTo('')
              setDayCount(25)
              setError('')
              setShowConfirmation(false)
              setConfirmationAction(null)
              // Update storage info after clearing data
                    } catch (error) {
              setError('Failed to clear calendar data')
            }
          }
        }}
        title={confirmationAction === 'dayCount' ? 'Confirm Day Count Change' : 'Confirm Clear Data'}
        message={confirmationMessage}
        confirmText={confirmationAction === 'dayCount' ? 'Yes, Change Days' : 'Yes, Clear All'}
        cancelText="Cancel"
        variant="danger"
      />

    </Container>
  )
} 