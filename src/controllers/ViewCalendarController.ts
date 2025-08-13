import { Calendar, type CountdownData } from '../core/calendar'
import type { AdventCalendar, DayContent } from '../types/calendar'

export interface ViewCalendarState {
  calendarData: AdventCalendar | null
  selectedDay: DayContent | null
  error: string
  isDragging: boolean
  testMode: boolean
  hasOpenedFirstDay: boolean
  countdown: CountdownData | null
}

export class ViewCalendarController {
  private calendar: Calendar
  private state: ViewCalendarState
  private setState: (state: ViewCalendarState) => void

  constructor(setState: (state: ViewCalendarState) => void) {
    this.calendar = new Calendar()
    this.state = {
      calendarData: null,
      selectedDay: null,
      error: '',
      isDragging: false,
      testMode: false,
      hasOpenedFirstDay: false,
      countdown: null
    }
    this.setState = setState
  }

  async handleFileUpload(file: File): Promise<void> {
    try {
      this.updateState({ error: '' })
      const data = await this.readFile(file)
      this.calendar.importCalendar(data)
      this.updateState({ calendarData: this.calendar.getCalendar() })
    } catch (err) {
      this.updateState({ 
        error: err instanceof Error ? err.message : 'Failed to import calendar' 
      })
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          resolve(e.target?.result as string)
        } catch {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    this.updateState({ isDragging: true })
  }

  handleDragLeave(e: React.DragEvent): void {
    e.preventDefault()
    this.updateState({ isDragging: false })
  }

  async handleDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault()
    this.updateState({ isDragging: false })
    
    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find(file => file.name.endsWith('.json'))
    
    if (jsonFile) {
      await this.handleFileUpload(jsonFile)
    } else {
      this.updateState({ error: 'Please select a valid JSON file' })
    }
  }

  handleDayClick(day: DayContent): void {
    if (this.checkDayUnlocked(day.day)) {
      this.updateState({ 
        selectedDay: day,
        hasOpenedFirstDay: this.state.hasOpenedFirstDay || true
      })
    }
  }

  closeDayViewer(): void {
    this.updateState({ selectedDay: null })
  }

  toggleTestMode(): void {
    this.updateState({ testMode: !this.state.testMode })
  }

  updateCountdown(countdown: CountdownData | null): void {
    this.updateState({ countdown })
  }

  calculateCountdown(testMode: boolean): CountdownData | null {
    return this.calendar.calculateCountdown(testMode)
  }

  checkDayUnlocked(day: number): boolean {
    return this.calendar.isDayUnlocked(day, this.state.testMode)
  }

  private updateState(updates: Partial<ViewCalendarState>): void {
    this.state = { ...this.state, ...updates }
    this.setState(this.state)
  }

  getState(): ViewCalendarState {
    return this.state
  }
}
