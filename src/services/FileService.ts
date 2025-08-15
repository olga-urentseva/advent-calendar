import type { DayContent, ContentType, MediaSource } from '../types/calendar'

export class FileService {
  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate that file is a proper File object
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

  // Compress image if needed
  private async compressImage(file: File, maxSize = 50 * 1024 * 1024): Promise<File> {
    if (file.size <= maxSize) return file

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate compression ratio based on file size
        const ratio = Math.min(1, Math.sqrt(maxSize / file.size))
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Use progressive quality reduction for very large files
        const quality = file.size > 25 * 1024 * 1024 ? 0.6 : 0.8

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: blob.type })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Process media file - optimized for 25-cell storage
  async processMediaFile(file: File, type: ContentType): Promise<DayContent | null> {
    // Optimized file size limits for 25 cells with text descriptions
    const maxFileSize = 15 * 1024 * 1024 // 15MB max per file

    // Validate that file is a proper File object
    if (!(file instanceof File)) {
      throw new Error('Invalid file object provided')
    }

    // Check file size limit
    if (file.size > maxFileSize) {
      throw new Error(`File is too large. Maximum size is 15MB per ${type}. Please compress your file or use a URL instead.`)
    }

    let processedFile = file
    let wasCompressed = false

    // Apply compression for images over 5MB
    if (type === 'image' && file.size > 5 * 1024 * 1024) {
      try {
        processedFile = await this.compressImage(file, 15 * 1024 * 1024)
        wasCompressed = true
        console.log(`Image compressed from ${Math.round(file.size / (1024 * 1024))}MB to ${Math.round(processedFile.size / (1024 * 1024))}MB`)
      } catch (error) {
        console.warn('Image compression failed, using original file:', error)
        processedFile = file
      }
    }

    try {
      const base64 = await this.fileToBase64(processedFile)
      return {
        day: 0,
        type,
        source: 'upload' as MediaSource,
        content: base64,
        fileSize: processedFile.size,
        originalFileName: file.name,
        compressed: wasCompressed
      }
    } catch (error) {
      throw new Error(`Failed to process ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate URL
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

  // Download file
  downloadFile(data: string, title: string): void {
    const dataBlob = new Blob([data], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_advent_calendar.json`
    link.click()
  }

  // Read file
  readFile(file: File): Promise<string> {
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

  // Check if day should be unlocked
  isDayUnlocked(day: number): boolean {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth() + 1
    
    return currentMonth === 12 && day <= currentDay
  }
} 