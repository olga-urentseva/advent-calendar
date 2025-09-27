import { useState, useEffect } from 'react'
import { ViewCalendarController, type ViewCalendarState } from '../../controllers/ViewCalendarController'

import { Title } from '../../components/atoms/Title'
import { Subtitle } from '../../components/atoms/Subtitle'
import { Modal } from '../../components/atoms/Modal'
import { CalendarUploader } from '../../components/organisms/CalendarUploader'
// import { TestModeToggle } from '../../components/organisms/TestModeToggle'
import { CountdownTimer } from '../../components/organisms/CountdownTimer'
import { CalendarViewer } from '../../components/organisms/CalendarViewer'
import { DayViewer } from '../../components/organisms/DayViewer'
import { ActiveButtons } from '../../components/organisms/ActiveButtons'
import { StorageFullModal } from '../../components/organisms/StorageFullModal'
import './styles.css'

export function ViewCalendar() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const [state, setState] = useState<ViewCalendarState>({
    calendarData: null,
    selectedDay: null,
    error: '',
    isDragging: false,
    testMode: false,
    hasOpenedFirstDay: false,
    countdown: null,
    showStorageFullModal: false,
    pendingImportData: null,
    storageInfo: null
  })

  const controller = useState(() => new ViewCalendarController(setState))[0]

  // Initialize calendar on component mount
  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        await controller.initialize()
      } catch (error) {
        console.warn('Failed to initialize calendar:', error)
      }
    }

    initializeCalendar()
  }, [controller])

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
      <>
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

        <StorageFullModal
          isOpen={state.showStorageFullModal}
          onClose={controller.closeStorageFullModal.bind(controller)}
          onClearStorage={controller.clearStorageAndImport.bind(controller)}
          requiredMB={state.storageInfo?.requiredMB || 0}
          availableMB={state.storageInfo?.availableMB || 0}
        />

      </>
    )


    
  }

  return (
    <>
      <Subtitle>From: {state.calendarData.createdBy}</Subtitle>
      <Subtitle>To: {state.calendarData.to}</Subtitle>
      
      {isSafari && (
        <div className="safari-notice">
          For the best app experience, we recommend using Chrome or Firefox due to Safari limitations.
        </div>
      )}
      
      {/* <TestModeToggle
        testMode={state.testMode}
        onTestModeChange={controller.toggleTestMode.bind(controller)}
      /> */}

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
            mediaUrlService={controller.getMediaUrlService()}
            createdBy={state.calendarData.createdBy}
          />
        )}
      </Modal>
      <ActiveButtons clearData={() => controller.clearAllCalendarData()}/>
    </>
  )
} 