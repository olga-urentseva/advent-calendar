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

  const applyDayCountChange = (count: number, daysWithContent: number[], daysToBePreserved: number[], daysToBeLost: number[]) => {
    setDayCount(count)
    // Update the calendar with new day count (content will be preserved)
    calendarInstance.setDayCount(count)
    
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
  }

  const handleConfirmDayCountChange = () => {
    if (pendingDayCount !== null) {
      const calendarData = calendarInstance.getCalendar()
      const daysWithContent = calendarData.days
        .filter(day => day.content.trim() !== '')
        .map(day => day.day)
      
      const daysToBeLost = daysWithContent.filter(day => day > pendingDayCount)
      const daysToBePreserved = daysWithContent.filter(day => day <= pendingDayCount)
      
      applyDayCountChange(pendingDayCount, daysWithContent, daysToBePreserved, daysToBeLost)
      setPendingDayCount(null)
    }
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
    setConfirmationMessage('Are you sure you want to clear all calendar data? This action cannot be undone.')
    setConfirmationAction('clearData')
    setShowConfirmation(true)
  }

  const isDayCompleted = (day: number): boolean => {
    const dayContent = calendarInstance.getDay(day)
    return Boolean(dayContent && dayContent.content.trim() !== '')
  }

  const calendarData = calendarInstance.getCalendar()

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
            dayContent={calendarInstance.getDay(selectedDay)}
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
        onConfirm={() => {
          if (confirmationAction === 'dayCount') {
            handleConfirmDayCountChange()
          } else if (confirmationAction === 'clearData') {
            calendarInstance.clearStorage()
            setCreatedBy('')
            setTo('')
            setDayCount(25)
            setError('')
            setShowConfirmation(false)
            setConfirmationAction(null)
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