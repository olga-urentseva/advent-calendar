import type { AdventCalendar } from '../types/calendar'

interface CalendarStore {
  id: string
  calendar: AdventCalendar
  lastSavedAt: number
}

export class OPFSService {
  private readonly CALENDAR_FILE = 'calendar.json'
  private readonly MEDIA_DIR = 'media'
  private opfsRoot: FileSystemDirectoryHandle | null = null

  async init(): Promise<void> {
    console.log('📁 Initializing OPFS...')
    
    if (!this.isSupported()) {
      throw new Error('OPFS is not supported in this browser')
    }

    try {
      this.opfsRoot = await navigator.storage.getDirectory()
      console.log('✅ OPFS initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize OPFS:', error)
      throw new Error(`Failed to initialize OPFS: ${error}`)
    }
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
    
    // OPFS typically has much larger quotas (GBs), so we use a generous limit
    const maxSizeMB = 2048 // 2GB reasonable limit for a calendar app
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    
    console.log(`📏 Calendar size check: ${estimatedSizeMB}MB / ${maxSizeMB}MB limit`)
    
    return {
      canSave: estimatedSize <= maxSizeBytes,
      currentSizeMB: estimatedSizeMB,
      maxSizeMB,
      estimatedSizeMB
    }
  }

  async saveCalendar(calendar: AdventCalendar): Promise<void> {
    console.log('💾 Saving calendar to OPFS')
    
    const sizeCheck = await this.canSaveCalendar(calendar)
    if (!sizeCheck.canSave) {
      throw new Error(`Calendar size (${sizeCheck.estimatedSizeMB}MB) exceeds storage limit of ${sizeCheck.maxSizeMB}MB.`)
    }
    
    const root = await this.ensureOPFS()
    const mediaDir = await this.ensureMediaDir()
    
    try {
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
      const writable = await calendarFile.createWritable()
      await writable.write(JSON.stringify(calendarData, null, 2))
      await writable.close()

      // Save media files separately
      for (const day of calendar.days) {
        if (day.source === 'upload' && day.content.startsWith('data:')) {
          const mediaFileName = `day_${day.day}.json`
          const mediaFile = await mediaDir.getFileHandle(mediaFileName, { create: true })
          const mediaWritable = await mediaFile.createWritable()
          
          const mediaData = {
            day: day.day,
            content: day.content,
            type: day.type,
            fileSize: day.fileSize,
            originalFileName: day.originalFileName,
            compressed: day.compressed
          }
          
          await mediaWritable.write(JSON.stringify(mediaData))
          await mediaWritable.close()
        }
      }

      console.log(`✅ Calendar saved to OPFS successfully (${sizeCheck.estimatedSizeMB}MB)`)
    } catch (error) {
      console.error('❌ Failed to save calendar to OPFS:', error)
      throw new Error(`Failed to save calendar: ${error}`)
    }
  }

  async loadCalendar(): Promise<AdventCalendar | null> {
    console.log('📂 Loading calendar from OPFS')
    
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
      
      const calendar = {
        ...calendarData.calendar,
        days: reconstructedDays
      }
      
      console.log('✅ Calendar loaded from OPFS successfully')
      return calendar
    } catch (error) {
      if ((error as any)?.name === 'NotFoundError') {
        console.log('📭 No calendar found in OPFS')
        return null
      }
      console.error('❌ Failed to load calendar from OPFS:', error)
      throw new Error(`Failed to load calendar: ${error}`)
    }
  }

  async hasCalendar(): Promise<boolean> {
    try {
      const calendar = await this.loadCalendar()
      return calendar !== null
    } catch (error) {
      console.warn('Failed to check calendar existence:', error)
      return false
    }
  }

  async clearCalendar(): Promise<void> {
    console.log('🗑️ Clearing calendar from OPFS')
    
    try {
      const root = await this.ensureOPFS()
      
      // Remove calendar file
      try {
        await root.removeEntry(this.CALENDAR_FILE)
      } catch (error) {
        if ((error as any)?.name !== 'NotFoundError') {
          throw error
        }
      }
      
      // Remove media directory and all its contents
      try {
        await root.removeEntry(this.MEDIA_DIR, { recursive: true })
      } catch (error) {
        if ((error as any)?.name !== 'NotFoundError') {
          throw error
        }
      }
      
      console.log('✅ Calendar cleared from OPFS successfully')
    } catch (error) {
      console.error('❌ Failed to clear calendar from OPFS:', error)
      throw new Error(`Failed to clear calendar: ${error}`)
    }
  }

  async getLastSavedAt(): Promise<number | null> {
    try {
      const root = await this.ensureOPFS()
      const calendarFile = await root.getFileHandle(this.CALENDAR_FILE)
      const file = await calendarFile.getFile()
      const content = await file.text()
      const calendarData = JSON.parse(content) as CalendarStore
      return calendarData.lastSavedAt || null
    } catch (error) {
      console.warn('Failed to get last saved timestamp:', error)
      return null
    }
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           'storage' in navigator && 
           'getDirectory' in navigator.storage
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
}