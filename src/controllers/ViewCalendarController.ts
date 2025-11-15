import { Calendar, type CountdownData } from '../core/calendar'
import type { AdventCalendar, DayContent } from '../types/calendar'

export interface ViewCalendarState {
  calendarData: AdventCalendar | null
  selectedDay: DayContent | null
  error: string
  isDragging: boolean
  testMode: boolean
  hasOpenedFirstDay: boolean
  openedDays: Set<number>
  countdown: CountdownData | null
  showStorageFullModal: boolean
  pendingImportData: string | null
  storageInfo: { requiredMB: number; availableMB: number } | null
}

export class ViewCalendarController {
  private calendar: Calendar
  private state: ViewCalendarState
  private setState: (state: ViewCalendarState) => void

  constructor(setState: (state: ViewCalendarState) => void) {
    this.calendar = new Calendar('received')
    this.state = {
      calendarData: null,
      selectedDay: null,
      error: '',
      isDragging: false,
      testMode: false,
      hasOpenedFirstDay: false,
      countdown: null,
      showStorageFullModal: false,
      pendingImportData: null,
      storageInfo: null,
      openedDays: new Set()
    }
    this.setState = setState
  }

  // Initialize calendar and handle file access
  async initialize(): Promise<void> {
    try {
      await this.calendar.initialize()
      
      // Load calendar data if available
      const calendarData = this.calendar.getCalendar()
      if (calendarData && this.calendar.isValid()) {
        this.updateState({ calendarData })
      }
    } catch (error) {
      console.warn('Failed to initialize calendar:', error)
    }
  }


  async handleFileUpload(file: File): Promise<void> {
    try {
      this.updateState({ error: '' })
      
      // Read the uploaded file
      const data = await this.readFile(file)
      
      // Parse JSON with better error handling
      let imported: AdventCalendar
      try {
        imported = JSON.parse(data) as AdventCalendar
      } catch (jsonError) {
        throw new Error(`Invalid JSON file: ${jsonError instanceof Error ? jsonError.message : 'Malformed JSON'}`)
      }

      // Validate basic calendar structure
      if (!imported.days || !Array.isArray(imported.days)) {
        throw new Error('Invalid calendar file: Missing or invalid days array')
      }
      if (!imported.createdBy) {
        throw new Error('Invalid calendar file: Missing creator information')
      }

      // Debug the imported data
      console.log('📥 Imported calendar data:', {
        createdBy: imported.createdBy,
        to: imported.to
      })

      // Import to OPFS
      await this.calendar.importCalendar(imported)
      this.updateState({ calendarData: this.calendar.getCalendar() })
    } catch (err) {
      console.error('Calendar import error:', err)
      this.updateState({ 
        error: err instanceof Error ? err.message : 'Failed to import calendar' 
      })
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result !== 'string') {
          reject(new Error('File reading failed: Invalid file content'))
          return
        }
        if (result.length === 0) {
          reject(new Error('File reading failed: File is empty'))
          return
        }
        resolve(result)
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error(`File reading failed: ${reader.error?.message || 'Unknown FileReader error'}`))
      }
      reader.onabort = () => {
        reject(new Error('File reading was aborted'))
      }
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
    const newOpenedDays = new Set(this.state.openedDays)
    newOpenedDays.add(day.day)
    
    this.updateState({ 
      selectedDay: day,
      hasOpenedFirstDay: true,
      openedDays: newOpenedDays
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

  calculateCountdown(testMode: boolean, daysInCalendar: 25 | 15 | 7): CountdownData | null {
  return this.calendar.calculateCountdown(
    testMode, 
    daysInCalendar, 
    this.state.openedDays
  )
}

  checkDayUnlocked(day: number): boolean {
    return this.calendar.isDayUnlocked(day, this.state.testMode)
  }

  // Storage modal handlers
  closeStorageFullModal(): void {
    this.updateState({
      showStorageFullModal: false,
      pendingImportData: null,
      storageInfo: null
    })
  }

  async clearStorageAndImport(): Promise<void> {
    try {
      if (!this.state.pendingImportData) return
      
      // Clear existing OPFS data
      await this.calendar.clearFileHandles()
      
      // Import the pending data to OPFS
      if (this.state.pendingImportData) {
        const imported = JSON.parse(this.state.pendingImportData) as AdventCalendar
        await this.calendar.importCalendar(imported)
      }
      
      // Update state
      this.updateState({
        calendarData: this.calendar.getCalendar(),
        showStorageFullModal: false,
        pendingImportData: null,
        storageInfo: null,
        error: ''
      })
    } catch (err) {
      this.updateState({
        error: err instanceof Error ? err.message : 'Failed to import calendar',
        showStorageFullModal: false,
        pendingImportData: null,
        storageInfo: null
      })
    }
  }

  async clearAllCalendarData(): Promise<void> {
    try {
      // Only clear the 'received' calendar storage, not 'created'
      await this.calendar.clearStorage()
      this.updateState({
        calendarData: null,
        selectedDay: null,
        error: '',
        hasOpenedFirstDay: false,
        countdown: null
      })
    } catch (err) {
      this.updateState({
        error: err instanceof Error ? err.message : 'Failed to clear calendar data'
      })
    }
  }

  private updateState(updates: Partial<ViewCalendarState>): void {
    this.state = { ...this.state, ...updates }
    this.setState(this.state)
  }

  getState(): ViewCalendarState {
    return this.state
  }

  getMediaUrlService() {
    return this.calendar.getFileSystemService().getMediaUrlService()
  }
}
