import type { AdventCalendar } from '../types/calendar'

interface WorkerMessage {
  id: string
  type: 'save' | 'load' | 'clear' | 'hasData' | 'getQuota' | 'canSave'
  payload?: any
}

interface WorkerResponse {
  id: string
  success: boolean
  data?: any
  error?: string
}

interface CalendarStore {
  id: string
  calendar: AdventCalendar
  lastSavedAt: number
}

class OPFSWorker {
  private readonly CALENDAR_FILE = 'calendar.json'
  private readonly MEDIA_DIR = 'media'
  private opfsRoot: FileSystemDirectoryHandle | null = null

  async init(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('OPFS is not supported in this browser')
    }

    this.opfsRoot = await navigator.storage.getDirectory()
  }

  private async ensureOPFS(): Promise<FileSystemDirectoryHandle> {
    if (!this.opfsRoot) {
      await this.init()
    }
    if (!this.opfsRoot) {
      throw new Error('Failed to initialize OPFS')
    }
    return this.opfsRoot
  }

  private async ensureMediaDir(): Promise<FileSystemDirectoryHandle> {
    const root = await this.ensureOPFS()
    
    try {
      return await root.getDirectoryHandle(this.MEDIA_DIR)
    } catch {
      return await root.getDirectoryHandle(this.MEDIA_DIR, { create: true })
    }
  }

  private calculateCalendarSize(calendar: AdventCalendar): number {
    const calendarData: CalendarStore = {
      id: 'main_calendar',
      calendar,
      lastSavedAt: Date.now()
    }
    
    const jsonString = JSON.stringify(calendarData)
    return new Blob([jsonString]).size
  }

  async canSaveCalendar(calendar: AdventCalendar): Promise<{
    canSave: boolean
    currentSizeMB: number
    maxSizeMB: number
    estimatedSizeMB: number
  }> {
    const estimatedSize = this.calculateCalendarSize(calendar)
    const estimatedSizeMB = Math.round((estimatedSize / 1024 / 1024) * 100) / 100
    
    const maxSizeMB = 2048 // 2GB reasonable limit
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    
    return {
      canSave: estimatedSize <= maxSizeBytes,
      currentSizeMB: estimatedSizeMB,
      maxSizeMB,
      estimatedSizeMB
    }
  }

  private async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    // Try createWritable() first (Chrome/Edge)
    if ('createWritable' in fileHandle) {
      try {
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()
        return
      } catch (error) {
        console.warn('createWritable() failed, trying createSyncAccessHandle():', error)
      }
    }

    // Fallback to createSyncAccessHandle() (Safari)
    if ('createSyncAccessHandle' in fileHandle) {
      try {
        const syncHandle = await (fileHandle as any).createSyncAccessHandle()
        const encoder = new TextEncoder()
        const data = encoder.encode(content)
        
        // Truncate file and write new content
        syncHandle.truncate(0)
        syncHandle.write(data, { at: 0 })
        syncHandle.flush()
        syncHandle.close()
        return
      } catch (error) {
        console.warn('createSyncAccessHandle() failed:', error)
        throw new Error(`Failed to write file: ${error}`)
      }
    }

    throw new Error('Neither createWritable() nor createSyncAccessHandle() are available')
  }

  async saveCalendar(calendar: AdventCalendar): Promise<void> {
    const sizeCheck = await this.canSaveCalendar(calendar)
    if (!sizeCheck.canSave) {
      throw new Error(`Calendar size (${sizeCheck.estimatedSizeMB}MB) exceeds storage limit of ${sizeCheck.maxSizeMB}MB.`)
    }
    
    const root = await this.ensureOPFS()
    const mediaDir = await this.ensureMediaDir()
    
    // Separate calendar metadata from media content
    const calendarMetadata = {
      ...calendar,
      days: calendar.days.map(day => ({
        ...day,
        content: day.source === 'upload' && day.content.startsWith('data:') 
          ? `media_ref:day_${day.day}` 
          : day.content
      }))
    }

    const calendarData: CalendarStore = {
      id: 'main_calendar',
      calendar: calendarMetadata,
      lastSavedAt: Date.now()
    }

    // Save calendar metadata
    const calendarFile = await root.getFileHandle(this.CALENDAR_FILE, { create: true })
    await this.writeFile(calendarFile, JSON.stringify(calendarData, null, 2))

    // Save media files separately
    for (const day of calendar.days) {
      if (day.source === 'upload' && day.content.startsWith('data:')) {
        const mediaFileName = `day_${day.day}.json`
        const mediaFile = await mediaDir.getFileHandle(mediaFileName, { create: true })
        
        const mediaData = {
          day: day.day,
          content: day.content,
          type: day.type,
          fileSize: day.fileSize,
          originalFileName: day.originalFileName,
          compressed: day.compressed
        }
        
        await this.writeFile(mediaFile, JSON.stringify(mediaData))
      }
    }
  }

  async loadCalendar(): Promise<AdventCalendar | null> {
    try {
      const root = await this.ensureOPFS()
      const mediaDir = await this.ensureMediaDir()
      
      // Load calendar metadata
      const calendarFile = await root.getFileHandle(this.CALENDAR_FILE)
      const file = await calendarFile.getFile()
      const content = await file.text()
      const calendarData = JSON.parse(content) as CalendarStore
      
      // Reconstruct calendar with media content
      const reconstructedDays = await Promise.all(
        calendarData.calendar.days.map(async (day) => {
          if (day.content && day.content.startsWith('media_ref:day_')) {
            const mediaFileName = `day_${day.day}.json`
            try {
              const mediaFile = await mediaDir.getFileHandle(mediaFileName)
              const mediaFileData = await mediaFile.getFile()
              const mediaContent = await mediaFileData.text()
              const mediaData = JSON.parse(mediaContent)
              
              return {
                ...day,
                content: mediaData.content,
                fileSize: mediaData.fileSize,
                originalFileName: mediaData.originalFileName,
                compressed: mediaData.compressed
              }
            } catch (error) {
              console.warn(`Failed to load media for day ${day.day}:`, error)
              return day
            }
          }
          return day
        })
      )
      
      return {
        ...calendarData.calendar,
        days: reconstructedDays
      }
    } catch (error) {
      if ((error as any)?.name === 'NotFoundError') {
        return null
      }
      throw error
    }
  }

  async clearCalendar(): Promise<void> {
    const root = await this.ensureOPFS()
    
    try {
      // Get all entries in the root directory and remove them
      const entries = []
      for await (const [name] of (root as any).entries()) {
        entries.push(name)
      }
      
      // Remove all entries
      for (const name of entries) {
        try {
          await root.removeEntry(name, { recursive: true })
          console.log(`🗑️ Removed OPFS entry: ${name}`)
        } catch (error) {
          if ((error as any)?.name !== 'NotFoundError') {
            console.warn(`Failed to remove OPFS entry ${name}:`, error)
          }
        }
      }
      
      console.log('🗑️ OPFS directory completely cleared')
    } catch (error) {
      console.warn('Failed to clear OPFS directory:', error)
      // Fallback to removing known entries
      try {
        await root.removeEntry(this.CALENDAR_FILE)
      } catch {}
      try {
        await root.removeEntry(this.MEDIA_DIR, { recursive: true })
      } catch {}
    }
  }

  async hasData(): Promise<boolean> {
    try {
      const calendar = await this.loadCalendar()
      return calendar?.days?.some(day => day.content.trim() !== '') || false
    } catch {
      return false
    }
  }

  async getStorageQuota(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { usage: 0, quota: 0 }
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           'storage' in navigator && 
           'getDirectory' in navigator.storage
  }
}

// Worker instance
const opfsWorker = new OPFSWorker()

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data
  
  try {
    let result: any = null
    
    switch (type) {
      case 'save':
        await opfsWorker.saveCalendar(payload)
        result = { success: true }
        break
      
      case 'load':
        result = await opfsWorker.loadCalendar()
        break
      
      case 'clear':
        await opfsWorker.clearCalendar()
        result = { success: true }
        break
      
      case 'hasData':
        result = await opfsWorker.hasData()
        break
      
      case 'getQuota':
        result = await opfsWorker.getStorageQuota()
        break
      
      case 'canSave':
        result = await opfsWorker.canSaveCalendar(payload)
        break
      
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    const response: WorkerResponse = {
      id,
      success: true,
      data: result
    }
    
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
    
    self.postMessage(response)
  }
}