export interface CompressionOptions {
  maxWidthOrHeight: number
  quality: number
  format: 'image/jpeg' | 'image/webp' | 'image/png'
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export class ImageCompressionUtil {
  // Default compression settings for different scenarios
  static readonly COMPRESSION_PRESETS = {
    high_quality: { maxWidthOrHeight: 1920, quality: 0.8, format: 'image/jpeg' as const },
    medium_quality: { maxWidthOrHeight: 1280, quality: 0.7, format: 'image/jpeg' as const },
    low_quality: { maxWidthOrHeight: 800, quality: 0.6, format: 'image/jpeg' as const },
    thumbnail: { maxWidthOrHeight: 400, quality: 0.5, format: 'image/jpeg' as const }
  }

  // Compress image file
  static async compressImage(
    file: File, 
    options: CompressionOptions = ImageCompressionUtil.COMPRESSION_PRESETS.medium_quality
  ): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          const { width, height } = ImageCompressionUtil.calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidthOrHeight
          )

          // Set canvas size
          canvas.width = width
          canvas.height = height

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              const compressedFile = new File([blob], file.name, {
                type: options.format,
                lastModified: Date.now()
              })

              const originalSize = file.size
              const compressedSize = compressedFile.size
              const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)

              console.log(`🖼️ Image compressed: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (${compressionRatio}% reduction)`)

              resolve({
                compressedFile,
                originalSize,
                compressedSize,
                compressionRatio
              })
            },
            options.format,
            options.quality
          )
        } catch (error) {
          reject(new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }

      // Load image from file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(file)
    })
  }

  // Calculate dimensions maintaining aspect ratio
  private static calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxSize: number
  ): { width: number; height: number } {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return { width: originalWidth, height: originalHeight }
    }

    const aspectRatio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio)
      }
    } else {
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize
      }
    }
  }

  // Check if file needs compression
  static shouldCompress(file: File, maxFileSizeKB: number = 500): boolean {
    const fileSizeKB = file.size / 1024
    return fileSizeKB > maxFileSizeKB
  }

  // Get appropriate compression preset based on file size
  static getCompressionPreset(fileSizeKB: number): CompressionOptions {
    if (fileSizeKB > 2000) { // > 2MB
      return ImageCompressionUtil.COMPRESSION_PRESETS.low_quality
    } else if (fileSizeKB > 1000) { // > 1MB
      return ImageCompressionUtil.COMPRESSION_PRESETS.medium_quality
    } else {
      return ImageCompressionUtil.COMPRESSION_PRESETS.high_quality
    }
  }
}