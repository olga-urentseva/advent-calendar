import { OPFSWorkerService } from './OPFSWorkerService'

export class MediaUrlService {
  private opfsWorker: OPFSWorkerService
  private urlCache = new Map<string, string>()

  constructor(opfsWorker: OPFSWorkerService) {
    this.opfsWorker = opfsWorker
  }

  async getMediaUrl(content: string): Promise<string> {
    // If content is already a URL (http, https, data:, blob:), return as-is
    if (content.startsWith('http') || content.startsWith('data:') || content.startsWith('blob:')) {
      return content
    }

    // If content looks like an OPFS file path, get the file and create blob URL
    if (content.startsWith('media/')) {
      // Check cache first
      if (this.urlCache.has(content)) {
        return this.urlCache.get(content)!
      }

      try {
        const file = await this.opfsWorker.getMediaFile(content)
        if (file) {
          const blobUrl = URL.createObjectURL(file)
          this.urlCache.set(content, blobUrl)
          return blobUrl
        }
      } catch (error) {
        console.warn(`Failed to get OPFS file ${content}:`, error)
      }
    }

    // Fallback: return the content as-is
    return content
  }

  // Clean up blob URLs to prevent memory leaks
  revokeUrl(content: string) {
    if (this.urlCache.has(content)) {
      const blobUrl = this.urlCache.get(content)!
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
      this.urlCache.delete(content)
    }
  }

  // Clean up all cached URLs
  revokeAllUrls() {
    for (const [, blobUrl] of this.urlCache.entries()) {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
    this.urlCache.clear()
  }
}