import { CalendarModel } from '../models/CalendarModel'
import type { DayContent, ContentType, MediaSource } from '../types/calendar'
import { FileService } from '../services/FileService'

export class CalendarController {
  private model: CalendarModel
  private fileService: FileService

  constructor() {
    this.model = new CalendarModel()
    this.fileService = new FileService()
  }

  // Calendar Management
  getCalendar() {
    return this.model.getCalendar()
  }

  setCalendarMetadata(title: string, createdBy: string) {
    this.model.setTitle(title)
    this.model.setCreatedBy(createdBy)
  }

  // Day Management
  getDay(day: number) {
    return this.model.getDay(day)
  }

  async setDayContent(day: number, content: DayContent) {
    // Process content based on type and source
    if (content.source === 'upload' && content.type !== 'text') {
      // For file uploads, content should be a File object
      const file = content.content as unknown as File
      const processedContent = await this.fileService.processMediaFile(file, content.type)
      if (processedContent) {
        this.model.setDayContent(day, processedContent)
      }
    } else {
      this.model.setDayContent(day, content)
    }
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

  // File Operations
  async exportCalendar() {
    if (!this.isCalendarValid()) {
      throw new Error('Calendar is not complete. Please fill in all required fields.')
    }
    
    const calendarData = this.model.exportCalendar()
    this.fileService.downloadFile(calendarData, this.getCalendar().title)
  }

  async importCalendar(file: File) {
    try {
      const data = await this.fileService.readFile(file)
      this.model.importCalendar(data)
    } catch (error) {
      throw new Error('Failed to import calendar file')
    }
  }

  // URL Validation
  validateUrl(url: string, type: ContentType) {
    return this.fileService.validateUrl(url, type)
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