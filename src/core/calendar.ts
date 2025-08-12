import type { AdventCalendar, DayContent } from '../types/calendar'
import { Storage } from './storage'

export class Calendar {
  private storage: Storage
  private calendar: AdventCalendar
  private isImported: boolean = false

  constructor() {
    this.storage = new Storage()
    this.calendar = this.storage.load() || this.createEmptyCalendar()
  }

  private createEmptyCalendar(): AdventCalendar {
    return {
      title: '',
      createdBy: '',
      to: '',
      createdAt: new Date().toISOString(),
      days: this.initializeDays(25)
    }
  }

  private initializeDays(count: number): DayContent[] {
    const days: DayContent[] = []
    for (let i = 1; i <= count; i++) {
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

  // Core methods
  getCalendar(): AdventCalendar {
    return { ...this.calendar }
  }

  getDay(day: number): DayContent | null {
    return this.calendar.days.find(d => d.day === day) || null
  }

  setDayContent(day: number, content: DayContent): void {
    const dayIndex = this.calendar.days.findIndex(d => d.day === day)
    if (dayIndex !== -1) {
      this.calendar.days[dayIndex] = { ...content, day }
      if (!this.isImported) {
        this.storage.save(this.calendar)
      }
    }
  }

  // Metadata methods

  setCreatedBy(createdBy: string): void {
    this.calendar.createdBy = createdBy
    if (!this.isImported) {
      this.storage.save(this.calendar)
    }
  }

  getCreatedBy(): string {
    return this.calendar.createdBy
  }

  setTo(to: string): void {
    this.calendar.to = to
    if (!this.isImported) {
      this.storage.save(this.calendar)
    }
  }

  getTo(): string {
    return this.calendar.to
  }

  // Day count methods
  setDayCount(count: number): void {
    const currentDays = this.calendar.days
    const newDays: DayContent[] = []
    
    for (let i = 1; i <= count; i++) {
      // Try to find existing content for this day
      const existingDay = currentDays.find(d => d.day === i)
      
      if (existingDay) {
        // Preserve existing content
        newDays.push({ ...existingDay })
      } else {
        // Create new empty day
        newDays.push({
          day: i,
          type: 'text',
          source: 'upload',
          content: '',
          title: `Day ${i}`
        })
      }
    }
    
    this.calendar.days = newDays
    if (!this.isImported) {
      this.storage.save(this.calendar)
    }
  }

  getDayCount(): number {
    return this.calendar.days.length
  }

  // Validation methods
  getCompletedDays(): number {
    return this.calendar.days.filter(day => day.content.trim() !== '').length
  }

  isValid(): boolean {
    return this.calendar.createdBy.trim() !== '' &&
           this.calendar.to.trim() !== '' &&
           this.getCompletedDays() > 0
  }

  isFullyCompleted(): boolean {
    return this.calendar.createdBy.trim() !== '' &&
           this.calendar.to.trim() !== '' &&
           this.getCompletedDays() === this.getDayCount()
  }

  // Import/Export
  importCalendar(data: string): void {
    try {
      const imported = JSON.parse(data) as AdventCalendar
      this.calendar = imported
      this.isImported = true
    } catch {
      throw new Error('Invalid calendar data format')
    }
  }

  exportCalendar(): string {
    return JSON.stringify(this.calendar, null, 2)
  }

  // Storage
  clearStorage(): void {
    this.storage.clear()
    this.calendar = this.createEmptyCalendar()
    this.isImported = false
  }
}
