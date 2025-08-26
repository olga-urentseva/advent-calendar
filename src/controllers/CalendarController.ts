import { CalendarModel } from '../models/CalendarModel'
import type { DayContent, ContentType, AdventCalendar } from '../types/calendar'
import { FileSystemService } from '../services/FileSystemService'

export class CalendarController {
  private model: CalendarModel
  private fileSystemService: FileSystemService

  constructor() {
    this.model = new CalendarModel()
    this.fileSystemService = new FileSystemService()
  }

  // Calendar Management
  getCalendar() {
    return this.model.getCalendar()
  }

  setCalendarMetadata(title: string, createdBy: string, to: string) {
    this.model.setTitle(title)
    this.model.setCreatedBy(createdBy)
    this.model.setTo(to)
  }

  // Day Management
  getDay(day: number) {
    return this.model.getDay(day)
  }

  async setDayContent(day: number, content: DayContent) {
    // Content should already be processed (base64 string for files, text for text content)
    this.model.setDayContent(day, content)
  }

  // Validation
  isCalendarValid() {
    return this.model.isValid()
  }

  isCalendarFullyCompleted() {
    return this.model.isFullyCompleted()
  }

  getCompletedDays() {
    return this.model.getCompletedDays()
  }

  getDayCount() {
    return this.model.getDayCount()
  }

  // File Operations with File System Access API
  async exportCalendar() {
    if (!this.isCalendarValid()) {
      throw new Error('Calendar is not complete. Please fill in all required fields.')
    }
    
    const calendar = this.model.getCalendar()
    await this.fileSystemService.exportCalendar(calendar)
  }

  async importCalendar(file: File) {
    // Read the file content 
    const data = await this.readFile(file)
    const calendarData = JSON.parse(data) as AdventCalendar
    
    // Import to OPFS for persistent storage
    const imported = await this.fileSystemService.importCalendar(calendarData)
    this.model.importCalendar(JSON.stringify(imported))
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

  // URL Validation
  validateUrl(url: string, type: ContentType) {
    return this.fileSystemService.validateUrl(url, type)
  }

  // Reset
  resetCalendar() {
    this.model.reset()
  }

  // Set day count
  setDayCount(count: number) {
    this.model.setDayCount(count)
  }
} 