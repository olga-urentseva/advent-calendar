import type { AdventCalendar, DayContent } from '../types/calendar'
import { Storage } from './storage'

// Configuration for calendar unlock timing
const CALENDAR_CONFIG = {
  DAYS_BEFORE_CHRISTMAS_FOR_FIRST_DAY: 7, // Day 1 can be opened 7 days before Christmas
  CHRISTMAS_DAY: 25
} as const

export interface CountdownData {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export class Calendar {
  private storage: Storage
  private calendar: AdventCalendar
  private isImported: boolean = false
  private initialized: boolean = false

  constructor() {
    this.storage = new Storage()
    this.calendar = this.createEmptyCalendar()
  }

  // Initialize calendar data from storage
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    try {
      const loaded = await this.storage.load()
      if (loaded) {
        this.calendar = loaded
      }
    } catch (error) {
      console.warn('Failed to load calendar from storage:', error)
    }
    
    this.initialized = true
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

  async setDayContent(day: number, content: DayContent): Promise<void> {
    const dayIndex = this.calendar.days.findIndex(d => d.day === day)
    if (dayIndex !== -1) {
      this.calendar.days[dayIndex] = { ...content, day }
      if (!this.isImported) {
        try {
          await this.storage.save(this.calendar)
        } catch (error) {
          console.error('Failed to save calendar:', error)
          throw new Error('Failed to save calendar data')
        }
      }
    }
  }

  // Metadata methods

  async setCreatedBy(createdBy: string): Promise<void> {
    this.calendar.createdBy = createdBy
    if (!this.isImported) {
      try {
        await this.storage.save(this.calendar)
      } catch (error) {
        console.error('Failed to save calendar:', error)
        throw new Error('Failed to save calendar data')
      }
    }
  }

  getCreatedBy(): string {
    return this.calendar.createdBy
  }

  async setTo(to: string): Promise<void> {
    this.calendar.to = to
    if (!this.isImported) {
      try {
        await this.storage.save(this.calendar)
      } catch (error) {
        console.error('Failed to save calendar:', error)
        throw new Error('Failed to save calendar data')
      }
    }
  }

  getTo(): string {
    return this.calendar.to
  }

  // Day count methods
  async setDayCount(count: number): Promise<void> {
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
      try {
        await this.storage.save(this.calendar)
      } catch (error) {
        console.error('Failed to save calendar:', error)
        throw new Error('Failed to save calendar data')
      }
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
  async clearStorage(): Promise<void> {
    try {
      await this.storage.clear()
      this.calendar = this.createEmptyCalendar()
      this.isImported = false
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw new Error('Failed to clear calendar data')
    }
  }

  // Check if there's stored data
  async hasStoredData(): Promise<boolean> {
    return await this.storage.hasData()
  }

  // Calendar unlock logic
  isDayUnlocked(day: number, testMode: boolean = false): boolean {
    if (testMode) return true

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    // Day 1 can be opened N days before Christmas
    const firstDayUnlockDate = new Date(currentYear, 11, CALENDAR_CONFIG.CHRISTMAS_DAY - CALENDAR_CONFIG.DAYS_BEFORE_CHRISTMAS_FOR_FIRST_DAY)
    const canOpenFirstDay = today >= firstDayUnlockDate
    
    if (day === 1) {
      return canOpenFirstDay
    }
    
    // For other days, they unlock on their respective dates in December
    if (currentMonth === 12) {
      return day <= currentDay && canOpenFirstDay
    }
    
    return false
  }

  getNextUnlockTime(): Date | null {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    // Calculate when Day 1 can first be opened
    const firstDayUnlockDate = new Date(currentYear, 11, CALENDAR_CONFIG.CHRISTMAS_DAY - CALENDAR_CONFIG.DAYS_BEFORE_CHRISTMAS_FOR_FIRST_DAY)
    
    // If we haven't reached the first day unlock date yet, countdown to that
    if (today < firstDayUnlockDate) {
      return firstDayUnlockDate
    }
    
    // If we're in December and can open the first day, countdown to the next day
    if (currentMonth === 12) {
      const nextDay = currentDay + 1
      if (nextDay <= CALENDAR_CONFIG.CHRISTMAS_DAY) {
        return new Date(currentYear, 11, nextDay)
      }
    }
    
    return null
  }

  calculateCountdown(testMode: boolean = false): CountdownData | null {
    if (testMode) return null

    const nextUnlockTime = this.getNextUnlockTime()
    if (!nextUnlockTime) return null

    const now = new Date()
    const diff = nextUnlockTime.getTime() - now.getTime()

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }
}
