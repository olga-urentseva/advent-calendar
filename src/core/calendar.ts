import type { AdventCalendar, DayContent } from '../types/calendar'
import { FileSystemService } from '../services/FileSystemService'

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
  private fileSystem: FileSystemService
  private calendar: AdventCalendar
  private initialized: boolean = false

  constructor(storageType: 'created' | 'received' = 'created') {
    this.fileSystem = new FileSystemService(storageType)
    this.calendar = this.createEmptyCalendar()
  }

  // Initialize calendar data from file system
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    console.log('🚀 Initializing calendar...')
    console.log('🔍 OPFS supported:', this.fileSystem.isSupported())
    
    try {
      const loaded = await this.fileSystem.loadCalendar()
      if (loaded) {
        console.log('📂 Loaded calendar from file:', {
          createdBy: loaded.createdBy,
          to: loaded.to,
          daysCount: loaded.days.length,
          completedDays: loaded.days.filter(d => d.content.trim() !== '').length
        })
        this.calendar = loaded
      } else {
        console.log('📭 No calendar file found, using empty calendar')
      }
    } catch (error) {
      console.error('❌ Failed to load calendar from file system:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
    }
    
    this.initialized = true
    console.log('✅ Calendar initialization complete')
  }



  private createEmptyCalendar(): AdventCalendar {
    return {
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
      console.log('✅ Updated calendar data in memory for day', day)
      // Note: Not saving to file automatically - only when user explicitly saves
    }
  }

  // Metadata methods

  async setCreatedBy(createdBy: string): Promise<void> {
    this.calendar.createdBy = createdBy
    
    // Note: Not saving to file automatically - only when user explicitly saves
  }

  getCreatedBy(): string {
    return this.calendar.createdBy
  }

  async setTo(to: string): Promise<void> {
    this.calendar.to = to
    
    // Note: Not saving to file automatically - only when user explicitly saves
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
    console.log('📝 Updated day count in memory:', count)
    // Note: Not saving to file automatically - only when user explicitly saves
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

  // Import calendar data and save to OPFS
  async importCalendar(calendarData: AdventCalendar): Promise<void> {
    try {
      const imported = await this.fileSystem.importCalendar(calendarData)
      this.calendar = imported
    } catch (error) {
      throw new Error(`Failed to import calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  async exportCalendar(): Promise<void> {
    try {
      await this.fileSystem.exportCalendar(this.calendar)
    } catch (error) {
      throw new Error(`Failed to export calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Legacy JSON export for backwards compatibility (internal use only - contains OPFS paths)
  getCalendarJSON(): string {
    return JSON.stringify(this.calendar, null, 2)
  }

  // Export-ready JSON with OPFS files converted to base64 for sharing
  async getExportJSON(): Promise<string> {
    try {
      const exportCalendar = await this.fileSystem.convertOPFSFilesToBase64(this.calendar)
      return JSON.stringify(exportCalendar, null, 2)
    } catch (error) {
      throw new Error(`Failed to prepare export JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if File System Access API is supported
  isFileSystemSupported(): boolean {
    return this.fileSystem.isSupported()
  }

  // Get the FileSystemService instance for components that need direct access
  getFileSystemService(): FileSystemService {
    return this.fileSystem
  }


  // Save calendar to OPFS
  async saveToFile(): Promise<void> {
    console.log('💾 Saving calendar to OPFS')
    console.log('💾 Calendar data being saved:', {
      createdBy: this.calendar.createdBy,
      to: this.calendar.to,
      daysCount: this.calendar.days.length,
      completedDays: this.calendar.days.filter(d => d.content.trim() !== '').length,
      sampleDay: this.calendar.days[0] ? {
        day: this.calendar.days[0].day,
        type: this.calendar.days[0].type,
        hasContent: Boolean(this.calendar.days[0].content),
        contentPreview: this.calendar.days[0].content.substring(0, 50) + '...'
      } : 'No days'
    })
    
    try {
      await this.fileSystem.saveCalendar(this.calendar)
      console.log('✅ Calendar saved to OPFS successfully')
    } catch (error) {
      console.error('❌ Failed to save calendar to OPFS:', error)
      console.error('Save error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }


  // File management
  async clearFileHandles(): Promise<void> {
    try {
      await this.fileSystem.clearFileHandles()
      this.calendar = this.createEmptyCalendar()
    } catch (error) {
      console.error('Failed to clear file handles:', error)
      throw new Error('Failed to clear calendar data')
    }
  }

  // Backwards compatibility alias
  async clearStorage(): Promise<void> {
    return this.clearFileHandles()
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
