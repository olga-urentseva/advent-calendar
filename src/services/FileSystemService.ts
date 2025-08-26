import type { AdventCalendar, DayContent, ContentType } from '../types/calendar'
import { OPFSWorkerService } from './OPFSWorkerService'
import { ImageCompressionUtil } from '../utils/imageCompression'

interface FileHandleStorage {
  calendarFileName: string
  lastSavedAt: number | null
}

export class FileSystemService {
  private readonly STORAGE_KEY = 'advent_calendar_file_handles'
  private fileHandles: FileHandleStorage = { calendarFileName: 'calendar.json', lastSavedAt: null }
  private opfsWorker: OPFSWorkerService

  // Image compression threshold (not a limit, just when to compress)
  private readonly IMAGE_COMPRESSION_THRESHOLD_KB = 500 // When to start compressing images

  constructor() {
    this.opfsWorker = new OPFSWorkerService()
    this.initializeStorage()
    this.loadFileHandles()
  }

  private async initializeStorage(): Promise<void> {
    if (!this.opfsWorker.isSupported()) {
      throw new Error('OPFS is not supported in this browser. Please use a modern browser that supports OPFS (Chrome 86+, Firefox 111+, Safari 17+)')
    }

    try {
      await this.opfsWorker.init()
      console.log('✅ Using OPFS for storage')
    } catch (error) {
      console.error('❌ OPFS initialization failed:', error)
      throw new Error(`Failed to initialize OPFS storage: ${error}`)
    }
  }

  // Check if OPFS is supported
  isSupported(): boolean {
    return this.opfsWorker.isSupported()
  }

  // Load stored file handles from localStorage
  private async loadFileHandles(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      console.log('🔍 Loading file handles from localStorage:', stored)
      if (stored) {
        const data = JSON.parse(stored)
        this.fileHandles.lastSavedAt = data.lastSavedAt || null
        this.fileHandles.calendarFileName = data.calendarFileName || 'calendar.json'
        console.log('📂 Found previous OPFS session:', { 
          lastSavedAt: this.fileHandles.lastSavedAt,
          calendarFileName: this.fileHandles.calendarFileName
        })
      } else {
        console.log('📭 No previous file handles found in localStorage')
      }
    } catch (error) {
      console.warn('Failed to load file handles:', error)
    }
  }

  // Create calendar file in OPFS
  async createCalendarFile(calendar: AdventCalendar, _suggestedName?: string): Promise<void> {
    console.log('📁 createCalendarFile called with OPFS')
    if (!this.isSupported()) {
      throw new Error('OPFS is not supported in this browser')
    }

    try {
      const fileName = this.fileHandles.calendarFileName
      console.log('💾 Creating file in OPFS:', fileName)
      
      await this.opfsWorker.saveCalendar(calendar)
      
      this.fileHandles.lastSavedAt = Date.now()
      console.log('💾 Saving file metadata...')
      await this.saveFileHandles()
      console.log('✅ File created in OPFS with persistent access')
      
    } catch (error) {
      console.error('❌ Failed to create file in OPFS:', error)
      throw new Error(`Failed to create calendar file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Save calendar data to OPFS
  async saveCalendar(calendar: AdventCalendar): Promise<void> {
    console.log('💾 Saving calendar to OPFS')
    if (!this.isSupported()) {
      throw new Error('OPFS is not supported in this browser')
    }

    try {
      await this.opfsWorker.saveCalendar(calendar)
      
      this.fileHandles.lastSavedAt = Date.now()
      await this.saveFileHandles()
      console.log('✅ Calendar saved to OPFS successfully')
    } catch (error) {
      console.error('❌ Failed to save calendar to OPFS:', error)
      throw new Error(`Failed to save calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Load calendar from OPFS
  async loadCalendar(): Promise<AdventCalendar | null> {
    console.log('📂 Loading calendar from OPFS')
    if (!this.isSupported()) {
      console.log('❌ OPFS not supported')
      return null
    }

    try {
      const calendar = await this.opfsWorker.loadCalendar()
      
      if (calendar) {
        console.log('✅ Calendar loaded from OPFS successfully')
        return calendar
      } else {
        console.log('📭 No calendar file found in OPFS')
        return null
      }
    } catch (error) {
      console.error('❌ Failed to load calendar from OPFS:', error)
      return null
    }
  }

  // Import calendar: Simply save imported data to OPFS
  async importCalendar(calendarData: AdventCalendar): Promise<AdventCalendar> {
    console.log('📥 Importing calendar to OPFS')
    
    await this.opfsWorker.saveCalendar(calendarData)
    
    this.fileHandles.lastSavedAt = Date.now()
    await this.saveFileHandles()
    return calendarData
  }

  // Export calendar for sharing using traditional File System Access API
  async exportCalendar(calendar: AdventCalendar): Promise<void> {
    try {
      const fileName = `${calendar.title || 'Advent Calendar'} - Share.json`
      
      // Use File System Access API for export (user chooses where to save)
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName.replace(/[^a-z0-9\s\-_]/gi, ''),
        types: [{
          description: 'Advent Calendar',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const writable = await fileHandle.createWritable()
      const calendarData = JSON.stringify(calendar, null, 2)
      await writable.write(calendarData)
      await writable.close()
      
      console.log('✅ Calendar exported successfully!')
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Export was cancelled')
      }
      throw new Error(`Failed to export calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  // Check if video format is supported by browsers
  private isSupportedVideoFormat(file: File): boolean {
    const supportedTypes = [
      'video/mp4',
      'video/webm', 
      'video/ogg',
      'video/avi',
      'video/mov', // QuickTime - limited support
      'video/quicktime' // QuickTime - limited support
    ]
    
    const supportedExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    return supportedTypes.includes(file.type) || supportedExtensions.includes(fileExtension)
  }

  // Process media file - no storage limits with OPFS
  async processMediaFile(file: File, type: ContentType): Promise<DayContent | null> {
    console.log(`📁 Processing ${type} file: ${file.name} (${Math.round(file.size/1024)}KB)`)
    
    try {

      // Check video format support
      if (type === 'video') {
        if (!this.isSupportedVideoFormat(file)) {
          throw new Error(`Video format "${file.type || 'unknown'}" may not be supported by all browsers. Recommended formats: MP4, WebM. For QuickTime (.mov) files, consider converting to MP4 for better compatibility.`)
        }
        
        if (file.type === 'video/quicktime' || file.type === 'video/mov' || file.name.toLowerCase().endsWith('.mov')) {
          console.warn('⚠️ QuickTime video detected. This format has limited browser support. Consider converting to MP4.')
        }
      }

      let processedFile = file
      let wasCompressed = false
      let compressionInfo = ''

      if (type === 'image') {
        // Image compression (always try to compress large images)
        const imageSizeKB = file.size / 1024
        
        if (ImageCompressionUtil.shouldCompress(file, this.IMAGE_COMPRESSION_THRESHOLD_KB)) {
          console.log(`🖼️ Compressing image (${Math.round(imageSizeKB)}KB > ${this.IMAGE_COMPRESSION_THRESHOLD_KB}KB threshold)`)
          
          const preset = ImageCompressionUtil.getCompressionPreset(imageSizeKB)
          const compressionResult = await ImageCompressionUtil.compressImage(file, preset)
          
          processedFile = compressionResult.compressedFile
          wasCompressed = true
          compressionInfo = `Compressed from ${Math.round(compressionResult.originalSize/1024)}KB to ${Math.round(compressionResult.compressedSize/1024)}KB (${compressionResult.compressionRatio}% reduction)`
          
          console.log(`✅ ${compressionInfo}`)
        }
      }

      const base64 = await this.fileToBase64(processedFile)
      
      return {
        day: 0,
        type,
        source: 'upload',
        content: base64,
        fileSize: processedFile.size,
        originalFileName: file.name,
        title: `Day 0`,
        ...(wasCompressed && { compressionInfo })
      }
    } catch (error) {
      throw new Error(`Failed to process ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Convert file to base64 (same as before, but no size restrictions)
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        reject(new Error('Invalid file object provided'))
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  // Clear stored file handle references and delete OPFS data
  async clearFileHandles(): Promise<void> {
    console.log('🧹 Starting complete data cleanup...')
    
    try {
      if (this.isSupported()) {
        // Always try to delete the calendar from OPFS (regardless of lastSavedAt)
        await this.opfsWorker.clearCalendar()
        console.log('🗑️ Calendar file deleted from OPFS')
      }
    } catch (error) {
      console.warn('Failed to delete OPFS calendar:', error)
    }
    
    // Clear localStorage data
    this.fileHandles = { calendarFileName: 'calendar.json', lastSavedAt: null }
    localStorage.removeItem(this.STORAGE_KEY)
    
    // Clear any other advent calendar related localStorage keys
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('advent')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ Removed localStorage key: ${key}`)
    })
    
    console.log('✅ Complete data cleanup finished')
  }

  // Save file handle references (note: actual handles can't be serialized)
  private async saveFileHandles(): Promise<void> {
    try {
      // We can't actually serialize file handles, but we can track that we have one
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ 
        lastSavedAt: this.fileHandles.lastSavedAt,
        calendarFileName: this.fileHandles.calendarFileName
      }))
    } catch (error) {
      console.warn('Failed to save file handle references:', error)
    }
  }


  // Get current file name (always available with OPFS)
  async getCurrentFileName(): Promise<string | null> {
    return this.fileHandles.calendarFileName
  }


  // Validate URL (same as before)
  validateUrl(url: string, type: ContentType): boolean {
    if (type === 'text') return false
    
    const urlPatterns = {
      image: [
        /\.(jpg|jpeg|png|gif|webp)$/i,
        /imgur\.com/i,
        /drive\.google\.com/i,
        /cloudinary\.com/i
      ],
      video: [
        /youtube\.com|youtu\.be/i,
        /vimeo\.com/i,
        /\.(mp4|webm|mov)$/i
      ]
    } as const

    return urlPatterns[type].some((pattern: RegExp) => pattern.test(url))
  }
}