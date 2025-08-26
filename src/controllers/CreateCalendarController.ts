import { Calendar } from '../core/calendar'
import type { DayContent } from '../types/calendar'

export interface CreateCalendarState {
  createdBy: string
  to: string
  selectedDay: number | null
  isExporting: boolean
  error: string
  dayCount: number
  isFullyCompleted: boolean
  showConfirmation: boolean
  pendingDayCount: number | null
  confirmationMessage: string
  confirmationAction: 'dayCount' | 'clearData' | null
}

export class CreateCalendarController {
  private calendar: Calendar
  private state: CreateCalendarState
  private setState: (state: CreateCalendarState) => void

  constructor(setState: (state: CreateCalendarState) => void) {
    this.calendar = new Calendar()
    this.state = {
      createdBy: '',
      to: '',
      selectedDay: null,
      isExporting: false,
      error: '',
      dayCount: 25,
      isFullyCompleted: false,
      showConfirmation: false,
      pendingDayCount: null,
      confirmationMessage: '',
      confirmationAction: null
    }
    this.setState = setState
    this.initializeController()
  }

  private async initializeController(): Promise<void> {
    await this.calendar.initialize()
    this.loadExistingData()
  }

  private loadExistingData(): void {
    const calendarData = this.calendar.getCalendar()
    this.updateState({
      createdBy: calendarData.createdBy,
      to: calendarData.to,
      dayCount: calendarData.days.length,
      isFullyCompleted: this.calendar.isFullyCompleted()
    })
  }

  async setCreatedBy(createdBy: string): Promise<void> {
    try {
      await this.calendar.setCreatedBy(createdBy)
      this.updateState({ createdBy })
    } catch (error) {
      this.updateState({ error: 'Failed to save calendar data' })
    }
  }

  async setTo(to: string): Promise<void> {
    try {
      await this.calendar.setTo(to)
      this.updateState({ to })
    } catch (error) {
      this.updateState({ error: 'Failed to save calendar data' })
    }
  }

  handleDayClick(day: number): void {
    this.updateState({ selectedDay: day })
  }

  closeDayEditor(): void {
    this.updateState({ selectedDay: null })
  }

  handleDayCountChange(count: number): void {
    const calendarData = this.calendar.getCalendar()
    
    // Check which specific days have content and will be lost
    const daysWithContent = calendarData.days
      .filter(day => day.content.trim() !== '')
      .map(day => day.day)
    
    const daysToBeLost = daysWithContent.filter(day => day > count)
    
    // If content will be lost, show confirmation modal
    if (daysToBeLost.length > 0) {
      const message = `Changing to ${count} days will permanently delete content from days ${daysToBeLost.join(', ')}. Are you sure you want to continue?`
      this.updateState({
        confirmationMessage: message,
        pendingDayCount: count,
        confirmationAction: 'dayCount',
        showConfirmation: true
      })
      return
    }
    
    // No content will be lost, proceed immediately
    this.applyDayCountChange(count)
  }

  private async applyDayCountChange(count: number): Promise<void> {
    try {
      await this.calendar.setDayCount(count)
      this.updateState({
        dayCount: count,
        isFullyCompleted: this.calendar.isFullyCompleted()
      })
    } catch (error) {
      this.updateState({ error: 'Failed to save calendar data' })
    }
  }

  async confirmDayCountChange(): Promise<void> {
    if (this.state.pendingDayCount !== null) {
      await this.applyDayCountChange(this.state.pendingDayCount)
    }
    this.closeConfirmation()
  }

  handleClearAllData(): void {
    this.updateState({
      confirmationMessage: 'This will permanently delete all calendar data. Are you sure you want to continue?',
      confirmationAction: 'clearData',
      showConfirmation: true
    })
  }

  async confirmClearAllData(): Promise<void> {
    try {
      await this.calendar.clearStorage()
      this.loadExistingData()
      this.closeConfirmation()
    } catch (error) {
      this.updateState({ error: 'Failed to clear calendar data' })
    }
  }

  closeConfirmation(): void {
    this.updateState({
      showConfirmation: false,
      pendingDayCount: null,
      confirmationMessage: '',
      confirmationAction: null
    })
  }

  async exportCalendar(): Promise<void> {
    try {
      this.updateState({ isExporting: true, error: '' })
      
      if (!this.calendar.isValid()) {
        throw new Error('Calendar is not complete. Please fill in all required fields.')
      }
      
      const calendarData = this.calendar.getCalendarJSON()
      const blob = new Blob([calendarData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${this.state.createdBy || 'advent'}-calendar.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      this.updateState({ isExporting: false })
    } catch (err) {
      this.updateState({
        isExporting: false,
        error: err instanceof Error ? err.message : 'Failed to export calendar'
      })
    }
  }

  getDay(day: number): DayContent | null {
    return this.calendar.getDay(day)
  }

  async setDayContent(day: number, content: DayContent): Promise<void> {
    try {
      await this.calendar.setDayContent(day, content)
      this.updateState({ isFullyCompleted: this.calendar.isFullyCompleted() })
    } catch (error) {
      this.updateState({ error: 'Failed to save day content' })
    }
  }

  getCompletedDays(): number {
    return this.calendar.getCompletedDays()
  }

  getDayCount(): number {
    return this.calendar.getDayCount()
  }

  isValid(): boolean {
    return this.calendar.isValid()
  }

  private updateState(updates: Partial<CreateCalendarState>): void {
    this.state = { ...this.state, ...updates }
    this.setState(this.state)
  }

  getState(): CreateCalendarState {
    return this.state
  }
}
