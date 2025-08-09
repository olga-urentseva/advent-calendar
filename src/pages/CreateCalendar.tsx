import { useState } from 'react'
import { CalendarController } from '../controllers/CalendarController'
import type { DayContent } from '../types/calendar'
import { Container, Title, BackLink } from '../components/atoms'
import { 
  CalendarForm, 
  DayCountSelector, 
  CalendarGrid, 
  ExportSection, 
  DayEditor 
} from '../components/organisms'

export function CreateCalendar() {
  const [controller] = useState(() => new CalendarController())
  const [title, setTitle] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [to, setTo] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [dayCount, setDayCount] = useState(25)

  const calendar = controller.getCalendar()
  const currentDayCount = controller.getDayCount()

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const handleDayCountChange = (count: number) => {
    setDayCount(count)
    // Reset the calendar with new day count
    controller.setDayCount(count)
  }

  const handleSaveDay = async (day: number, dayContent: DayContent) => {
    try {
      await controller.setDayContent(day, dayContent)
      setSelectedDay(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save day content')
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError('')
      
      // Set metadata before export
      controller.setCalendarMetadata(title, createdBy, to)
      
      // Debug logging
      console.log('Export Debug:', {
        title,
        createdBy,
        to,
        completedDays: controller.getCompletedDays(),
        totalDays: controller.getDayCount(),
        isValid: controller.isCalendarValid(),
        isFullyCompleted: controller.isCalendarFullyCompleted()
      })
      
      await controller.exportCalendar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export calendar')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDebugValidation = () => {
    controller.setCalendarMetadata(title, createdBy, to)
    console.log('Debug Info:', {
      title,
      createdBy,
      to,
      completedDays: controller.getCompletedDays(),
      totalDays: controller.getDayCount(),
      isValid: controller.isCalendarValid(),
      isFullyCompleted: controller.isCalendarFullyCompleted()
    })
  }

  const isDayCompleted = (day: number): boolean => {
    const dayContent = controller.getDay(day)
    return Boolean(dayContent && dayContent.content.trim() !== '')
  }

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
        title={title}
        createdBy={createdBy}
        to={to}
        onTitleChange={setTitle}
        onCreatedByChange={setCreatedBy}
        onToChange={setTo}
      />

      <DayCountSelector
        dayCount={dayCount}
        onDayCountChange={handleDayCountChange}
      />

      <CalendarGrid
        days={calendar.days}
        currentDayCount={currentDayCount}
        isDayCompleted={isDayCompleted}
        onDayClick={handleDayClick}
      />

      <ExportSection
        isExporting={isExporting}
        title={title}
        createdBy={createdBy}
        to={to}
        completedDays={controller.getCompletedDays()}
        currentDayCount={currentDayCount}
        isValid={controller.isCalendarValid()}
        isFullyCompleted={controller.isCalendarFullyCompleted()}
        onExport={handleExport}
        onDebugValidation={handleDebugValidation}
      />

      {selectedDay && (
        <DayEditor
          day={selectedDay}
          dayContent={controller.getDay(selectedDay)}
          onSave={(dayContent) => handleSaveDay(selectedDay, dayContent)}
          onCancel={() => setSelectedDay(null)}
        />
      )}
    </Container>
  )
} 