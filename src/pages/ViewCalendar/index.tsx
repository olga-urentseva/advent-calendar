import { useState, useEffect } from 'react'
import { ViewCalendarController, type ViewCalendarState } from '../../controllers/ViewCalendarController'
import { Container } from '../../components/atoms/Container'
import { Title } from '../../components/atoms/Title'
import { Subtitle } from '../../components/atoms/Subtitle'
import { Modal } from '../../components/atoms/Modal'
import { CalendarUploader } from '../../components/organisms/CalendarUploader'
import { TestModeToggle } from '../../components/organisms/TestModeToggle'
import { CountdownTimer } from '../../components/organisms/CountdownTimer'
import { CalendarViewer } from '../../components/organisms/CalendarViewer'
import { DayViewer } from '../../components/organisms/DayViewer'
import { CreateOwnSection } from '../../components/organisms/CreateOwnSection'
import './styles.css'



export function ViewCalendar() {
  const [state, setState] = useState<ViewCalendarState>({
    calendarData: null,
    selectedDay: null,
    error: '',
    isDragging: false,
    testMode: false,
    hasOpenedFirstDay: false,
    countdown: null
  })

  const controller = useState(() => new ViewCalendarController(setState))[0]

  // Countdown effect
  useEffect(() => {
    if (!state.calendarData) return

    const calculateCountdown = () => {
      const countdown = controller.calculateCountdown(state.testMode)
      controller.updateCountdown(countdown)
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [state.calendarData, state.testMode, controller])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    controller.handleFileUpload(file)
  }

  const isDayUnlocked = (day: number): boolean => {
    return controller.checkDayUnlocked(day)
  }

  if (!state.calendarData) {
    return (
      <Container>
        <Title>Open Calendar</Title>
        
        {state.error && (
          <div className="view-calendar-error" role="alert">
            {state.error}
          </div>
        )}

        <CalendarUploader
          isDragging={state.isDragging}
          onFileUpload={handleFileUpload}
          onDragOver={controller.handleDragOver.bind(controller)}
          onDragLeave={controller.handleDragLeave.bind(controller)}
          onDrop={controller.handleDrop.bind(controller)}
        />
      </Container>
    )
  }

  return (
    <Container>
      <Title>{state.calendarData.title}</Title>
      <Subtitle>From: {state.calendarData.createdBy}</Subtitle>
      
      <TestModeToggle
        testMode={state.testMode}
        onTestModeChange={controller.toggleTestMode.bind(controller)}
      />

      {!state.testMode && state.countdown && (
        <CountdownTimer countdown={state.countdown} />
      )}

      <CalendarViewer
        days={state.calendarData.days}
        isDayUnlocked={isDayUnlocked}
        onDayClick={controller.handleDayClick.bind(controller)}
      />

      <Modal
        isOpen={state.selectedDay !== null}
        onClose={controller.closeDayViewer.bind(controller)}
        header={state.selectedDay ? (state.selectedDay.title || `Day ${state.selectedDay.day}`) : ''}
      >
        {state.selectedDay && (
          <DayViewer
            day={state.selectedDay}
            onClose={controller.closeDayViewer.bind(controller)}
          />
        )}
      </Modal>

      <CreateOwnSection hasOpenedFirstDay={state.hasOpenedFirstDay} />
    </Container>
  )
} 