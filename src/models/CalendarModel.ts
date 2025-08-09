import type { AdventCalendar, DayContent } from '../types/calendar'

export class CalendarModel {
  private calendar: AdventCalendar

  constructor() {
    this.calendar = {
      title: '',
      createdBy: '',
      to: '',
      createdAt: new Date().toISOString(),
      days: this.initializeDays()
    }
  }

  private initializeDays(): DayContent[] {
    const days: DayContent[] = []
    for (let i = 1; i <= 25; i++) {
      days.push({
        day: i,
        type: 'text',
        source: 'upload',
        content: '',
        title: `Day ${i}`
      })
    }
    return days
  }

  setDayCount(count: number): void {
    const newDays: DayContent[] = []
    for (let i = 1; i <= count; i++) {
      newDays.push({
        day: i,
        type: 'text',
        source: 'upload',
        content: '',
        title: `Day ${i}`
      })
    }
    this.calendar.days = newDays
  }

  // Getters
  getCalendar(): AdventCalendar {
    return { ...this.calendar }
  }

  getDay(day: number): DayContent | null {
    return this.calendar.days.find(d => d.day === day) || null
  }

  getCompletedDays(): number {
    return this.calendar.days.filter(day => day.content.trim() !== '').length
  }

  getDayCount(): number {
    return this.calendar.days.length
  }

  // Setters
  setTitle(title: string): void {
    this.calendar.title = title
  }

  setCreatedBy(createdBy: string): void {
    this.calendar.createdBy = createdBy
  }

  setTo(to: string): void {
    this.calendar.to = to
  }

  setDayContent(day: number, content: DayContent): void {
    const dayIndex = this.calendar.days.findIndex(d => d.day === day)
    if (dayIndex !== -1) {
      this.calendar.days[dayIndex] = { ...content, day }
    }
  }

  // Validation
  isValid(): boolean {
    return this.calendar.title.trim() !== '' && 
           this.calendar.createdBy.trim() !== '' &&
           this.calendar.to.trim() !== '' &&
           this.getCompletedDays() > 0
  }

  // Check if all days are completed
  isFullyCompleted(): boolean {
    return this.calendar.title.trim() !== '' && 
           this.calendar.createdBy.trim() !== '' &&
           this.calendar.to.trim() !== '' &&
           this.getCompletedDays() === this.getDayCount()
  }

  // Export/Import
  exportCalendar(): string {
    return JSON.stringify(this.calendar, null, 2)
  }

  importCalendar(data: string): void {
    try {
      const imported = JSON.parse(data) as AdventCalendar
      this.calendar = imported
    } catch {
      throw new Error('Invalid calendar data format')
    }
  }

  // Reset
  reset(): void {
    this.calendar = {
      title: '',
      createdBy: '',
      to: '',
      createdAt: new Date().toISOString(),
      days: this.initializeDays()
    }
  }
} 