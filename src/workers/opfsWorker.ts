import type { AdventCalendar } from '../types/calendar'

interface WorkerMessage {
  id: string
  type: 'save' | 'load' | 'clear' | 'hasData' | 'getQuota' | 'canSave' | 'storeMedia' | 'getMediaFile'
  payload?: any
  fileName?: string
  fileId?: string
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

  async saveCalendar(calendar: AdventCalendar, fileName: string = 'calendar.json'): Promise<void> {
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
          ? `media_ref:day_${day.day}_${fileName}` 
          : day.content
      }))
    }

    const calendarData: CalendarStore = {
      id: fileName.replace('.json', ''),
      calendar: calendarMetadata,
      lastSavedAt: Date.now()
    }

    // Save calendar metadata
    const calendarFile = await root.getFileHandle(fileName, { create: true })
    await this.writeFile(calendarFile, JSON.stringify(calendarData, null, 2))

    // Save media files separately
    for (const day of calendar.days) {
      if (day.source === 'upload' && day.content.startsWith('data:')) {
        const mediaFileName = `day_${day.day}_${fileName}.json`
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

  async loadCalendar(fileName: string = 'calendar.json'): Promise<AdventCalendar | null> {
    console.log('🔧 OPFS Worker: loadCalendar called with fileName:', fileName)
    
    try {
      const root = await this.ensureOPFS()
      const mediaDir = await this.ensureMediaDir()
      
      console.log('🔧 OPFS Worker: Trying to get file handle for:', fileName)
      // Load calendar metadata
      const calendarFile = await root.getFileHandle(fileName)
      const file = await calendarFile.getFile()
      const content = await file.text()
      console.log('🔧 OPFS Worker: File content length:', content.length)
      
      const calendarData = JSON.parse(content) as CalendarStore
      console.log('🔧 OPFS Worker: Parsed calendar data:', {
        id: calendarData.id,
        title: calendarData.calendar.title,
        createdBy: calendarData.calendar.createdBy,
        daysCount: calendarData.calendar.days.length
      })
      
      // Reconstruct calendar with media content
      const reconstructedDays = await Promise.all(
        calendarData.calendar.days.map(async (day) => {
          if (day.content && day.content.startsWith('media_ref:day_')) {
            const mediaFileName = `day_${day.day}_${fileName}.json`
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
      
      const finalCalendar = {
        ...calendarData.calendar,
        days: reconstructedDays
      }
      
      console.log('🔧 OPFS Worker: Returning calendar:', {
        title: finalCalendar.title,
        createdBy: finalCalendar.createdBy,
        to: finalCalendar.to,
        daysCount: finalCalendar.days.length,
        completedDays: finalCalendar.days.filter(d => d.content.trim() !== '').length
      })
      
      return finalCalendar
    } catch (error) {
      console.log('🔧 OPFS Worker: Load failed with error:', error)
      if ((error as any)?.name === 'NotFoundError') {
        console.log('🔧 OPFS Worker: File not found, returning null')
        return null
      }
      console.error('🔧 OPFS Worker: Unexpected error:', error)
      throw error
    }
  }

  async clearCalendar(fileName: string = 'calendar.json'): Promise<void> {
    const root = await this.ensureOPFS()
    
    try {
      // Remove specific calendar file
      await root.removeEntry(fileName)
      console.log(`🗑️ Removed calendar file: ${fileName}`)
      
      // Remove associated media files
      try {
        const mediaDir = await root.getDirectoryHandle(this.MEDIA_DIR)
        const entries = []
        for await (const [name] of (mediaDir as any).entries()) {
          if (name.includes(fileName)) {
            entries.push(name)
          }
        }
        
        for (const name of entries) {
          try {
            await mediaDir.removeEntry(name)
            console.log(`🗑️ Removed media file: ${name}`)
          } catch (error) {
            if ((error as any)?.name !== 'NotFoundError') {
              console.warn(`Failed to remove media file ${name}:`, error)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to clear media files:', error)
      }
    } catch (error) {
      if ((error as any)?.name !== 'NotFoundError') {
        console.warn(`Failed to clear calendar ${fileName}:`, error)
      }
    }
  }

  async hasData(fileName: string = 'calendar.json'): Promise<boolean> {
    try {
      const calendar = await this.loadCalendar(fileName)
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

  async storeMediaFile(file: File, fileId: string): Promise<string> {
    const mediaDir = await this.ensureMediaDir()
    const fileName = `${fileId}.${this.getFileExtension(file.name)}`
    
    try {
      const fileHandle = await mediaDir.getFileHandle(fileName, { create: true })
      
      // Write the actual file data (not base64)
      if ('createWritable' in fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(file)
        await writable.close()
      } else if ('createSyncAccessHandle' in fileHandle) {
        const syncHandle = await (fileHandle as any).createSyncAccessHandle()
        const arrayBuffer = await file.arrayBuffer()
        syncHandle.truncate(0)
        syncHandle.write(new Uint8Array(arrayBuffer), { at: 0 })
        syncHandle.flush()
        syncHandle.close()
      } else {
        throw new Error('Neither createWritable() nor createSyncAccessHandle() are available')
      }
      
      return `media/${fileName}` // Return the file path
    } catch (error) {
      throw new Error(`Failed to store media file ${fileName}: ${error}`)
    }
  }

  async getMediaFile(filePath: string): Promise<File | null> {
    try {
      const mediaDir = await this.ensureMediaDir()
      const fileName = filePath.replace('media/', '')
      const fileHandle = await mediaDir.getFileHandle(fileName)
      const file = await fileHandle.getFile()
      return file
    } catch (error) {
      console.warn(`Failed to get media file ${filePath}:`, error)
      return null
    }
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot !== -1 ? fileName.substring(lastDot + 1) : 'bin'
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
  const { id, type, payload, fileName, fileId } = event.data
  
  try {
    let result: any = null
    
    switch (type) {
      case 'save':
        await opfsWorker.saveCalendar(payload, fileName)
        result = { success: true }
        break
      
      case 'load':
        result = await opfsWorker.loadCalendar(fileName)
        break
      
      case 'clear':
        await opfsWorker.clearCalendar(fileName)
        result = { success: true }
        break
      
      case 'hasData':
        result = await opfsWorker.hasData(fileName)
        break
      
      case 'getQuota':
        result = await opfsWorker.getStorageQuota()
        break
      
      case 'canSave':
        result = await opfsWorker.canSaveCalendar(payload)
        break
        
      case 'storeMedia':
        if (!fileId) {
          throw new Error('fileId is required for storeMedia operation')
        }
        result = await opfsWorker.storeMediaFile(payload, fileId)
        break
        
      case 'getMediaFile':
        result = await opfsWorker.getMediaFile(payload)
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