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

  // Compress image
  private async compressImage(file: File, maxSize = 10 * 1024 * 1024): Promise<File> {
    if (file.size <= maxSize) return file

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const ratio = Math.min(1, Math.sqrt(maxSize / file.size))
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: blob.type })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.8)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Process media file
  async processMediaFile(file: File, type: ContentType): Promise<DayContent | null> {
    const maxSize = 10 * 1024 * 1024 // 10MB

    // Validate that file is a proper File object
    if (!(file instanceof File)) {
      throw new Error('Invalid file object provided')
    }

    if (file.size > maxSize) {
      if (type === 'image') {
        try {
          const compressedFile = await this.compressImage(file)
          const base64 = await this.fileToBase64(compressedFile)
          return {
            day: 0,
            type,
            source: 'upload' as MediaSource,
            content: base64,
            fileSize: compressedFile.size,
            originalFileName: file.name,
            compressed: true
          }
        } catch (error) {
          throw new Error(`Failed to process image file: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        throw new Error('Video file is too large. Please choose a file under 10MB.')
      }
    }

    try {
      const base64 = await this.fileToBase64(file)
      return {
        day: 0,
        type,
        source: 'upload' as MediaSource,
        content: base64,
        fileSize: file.size,
        originalFileName: file.name,
        compressed: false
      }
    } catch (error) {
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`)
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