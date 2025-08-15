import type { AdventCalendar } from '../types/calendar'

export class Storage {
  private readonly storageKey = 'advent_calendar_data'
  private readonly dbName = 'AdventCalendarDB'
  private readonly dbVersion = 1
  private readonly calendarStore = 'calendars'
  private readonly mediaStore = 'media'
  private db: IDBDatabase | null = null

  // Initialize IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create calendar metadata store
        if (!db.objectStoreNames.contains(this.calendarStore)) {
          const calendarStore = db.createObjectStore(this.calendarStore, { keyPath: 'id' })
          calendarStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create media files store
        if (!db.objectStoreNames.contains(this.mediaStore)) {
          const mediaStore = db.createObjectStore(this.mediaStore, { keyPath: 'id' })
          mediaStore.createIndex('calendarId', 'calendarId', { unique: false })
          mediaStore.createIndex('day', 'day', { unique: false })
        }
      }
    })
  }

  // Save calendar data - always use IndexedDB for consistency
  async save(calendar: AdventCalendar): Promise<void> {
    try {
      // Clear any old localStorage data to prevent confusion
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.storageKey + '_location')
      localStorage.removeItem(this.storageKey + '_id')
      
      await this.saveToIndexedDB(calendar)
    } catch (error) {
      console.error('Failed to save calendar to storage:', error)
      throw new Error('Failed to save calendar data. Please try again or reduce file sizes.')
    }
  }

  // Save to IndexedDB with media file separation
  private async saveToIndexedDB(calendar: AdventCalendar): Promise<void> {
    const db = await this.initDB()
    
    // Clear all existing data first to ensure single source of truth
    await this.clearIndexedDB(db)
    
    const transaction = db.transaction([this.calendarStore, this.mediaStore], 'readwrite')
    const calendarStore = transaction.objectStore(this.calendarStore)
    const mediaStore = transaction.objectStore(this.mediaStore)

    const calendarId = 'current_calendar' // Always use the same ID for the single calendar

    // Separate calendar metadata from media content
    const calendarMetadata = {
      id: calendarId,
      title: calendar.title,
      createdBy: calendar.createdBy,
      to: calendar.to,
      createdAt: calendar.createdAt,
      totalDays: calendar.days.length,
      days: calendar.days.map(day => ({
        ...day,
        content: day.source === 'upload' && day.content.startsWith('data:') 
          ? `media_ref:${calendarId}_${day.day}` 
          : day.content
      }))
    }

    // Save calendar metadata
    await new Promise<void>((resolve, reject) => {
      const request = calendarStore.put(calendarMetadata)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save calendar metadata'))
    })

    // Save large media files separately
    for (const day of calendar.days) {
      if (day.source === 'upload' && day.content.startsWith('data:')) {
        const mediaFile = {
          id: `${calendarId}_${day.day}`,
          calendarId,
          day: day.day,
          content: day.content,
          type: day.type,
          fileSize: day.fileSize,
          originalFileName: day.originalFileName,
          compressed: day.compressed
        }

        await new Promise<void>((resolve, reject) => {
          const request = mediaStore.put(mediaFile)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(new Error(`Failed to save media for day ${day.day}`))
        })
      }
    }
  }

  // Clear IndexedDB completely
  private async clearIndexedDB(db: IDBDatabase): Promise<void> {
    const transaction = db.transaction([this.calendarStore, this.mediaStore], 'readwrite')
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(this.calendarStore).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear calendar store'))
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(this.mediaStore).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear media store'))
      })
    ])
  }

  // Load calendar data from IndexedDB only
  async load(): Promise<AdventCalendar | null> {
    try {
      // Clear any old localStorage data to prevent confusion
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.storageKey + '_location')
      localStorage.removeItem(this.storageKey + '_id')
      
      return await this.loadFromIndexedDB()
    } catch (error) {
      console.warn('Failed to load calendar from storage:', error)
      return null
    }
  }

  // Load from IndexedDB and reconstruct calendar
  private async loadFromIndexedDB(): Promise<AdventCalendar | null> {
    try {
      const db = await this.initDB()
      const calendarId = 'current_calendar' // Always use the same ID

      const transaction = db.transaction([this.calendarStore, this.mediaStore], 'readonly')
      const calendarStore = transaction.objectStore(this.calendarStore)
      const mediaStore = transaction.objectStore(this.mediaStore)

      // Load calendar metadata
      const calendar = await new Promise<any>((resolve, reject) => {
        const request = calendarStore.get(calendarId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error('Failed to load calendar'))
      })

      if (!calendar) return null

      // Load media files
      const mediaFiles = await new Promise<any[]>((resolve, reject) => {
        const request = mediaStore.index('calendarId').getAll(calendarId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error('Failed to load media files'))
      })

      // Reconstruct calendar with media content
      const reconstructedDays = calendar.days.map((day: any) => {
        if (day.content && day.content.startsWith('media_ref:')) {
          const mediaId = day.content.replace('media_ref:', '')
          const mediaFile = mediaFiles.find(media => media.id === mediaId)
          
          if (mediaFile) {
            return {
              ...day,
              content: mediaFile.content,
              fileSize: mediaFile.fileSize,
              originalFileName: mediaFile.originalFileName,
              compressed: mediaFile.compressed
            }
          }
        }
        return day
      })

      return {
        title: calendar.title,
        createdBy: calendar.createdBy,
        to: calendar.to,
        createdAt: calendar.createdAt,
        days: reconstructedDays
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error)
      return null
    }
  }

  // Clear all stored data
  async clear(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.storageKey + '_location')
      localStorage.removeItem(this.storageKey + '_id')

      // Clear IndexedDB
      const db = await this.initDB()
      await this.clearIndexedDB(db)
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }

  // Check if there's stored data
  async hasData(): Promise<boolean> {
    try {
      const calendar = await this.load()
      return calendar?.days?.some(day => day.content.trim() !== '') || false
    } catch {
      return false
    }
  }

}
