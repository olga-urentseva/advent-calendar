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

export class OPFSWorkerService {
  private worker: Worker | null = null
  private messageId = 0
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
  }>()

  async init(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('OPFS is not supported in this browser')
    }

    console.log('🔧 Initializing OPFS Worker...')
    
    try {
      this.worker = new Worker(new URL('../workers/opfsWorker.ts', import.meta.url), {
        type: 'module'
      })
      
      this.worker.onmessage = this.handleWorkerMessage.bind(this)
      this.worker.onerror = this.handleWorkerError.bind(this)
      
      console.log('✅ OPFS Worker initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize OPFS Worker:', error)
      throw new Error(`Failed to initialize OPFS Worker: ${error}`)
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, data, error } = event.data
    const pending = this.pendingMessages.get(id)
    
    if (pending) {
      this.pendingMessages.delete(id)
      
      if (success) {
        pending.resolve(data)
      } else {
        pending.reject(new Error(error || 'Worker operation failed'))
      }
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error)
    
    // Reject all pending messages
    for (const [id, pending] of this.pendingMessages) {
      pending.reject(new Error('Worker encountered an error'))
      this.pendingMessages.delete(id)
    }
  }

  private async sendMessage(type: WorkerMessage['type'], payload?: any): Promise<any> {
    if (!this.worker) {
      await this.init()
    }

    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const id = `msg_${++this.messageId}`
    
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject })
      
      const message: WorkerMessage = { id, type, payload }
      this.worker!.postMessage(message)
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id)
          reject(new Error('Worker operation timed out'))
        }
      }, 30000)
    })
  }

  async saveCalendar(calendar: AdventCalendar): Promise<void> {
    console.log('💾 Saving calendar via OPFS Worker')
    await this.sendMessage('save', calendar)
    console.log('✅ Calendar saved successfully')
  }

  async loadCalendar(): Promise<AdventCalendar | null> {
    console.log('📂 Loading calendar via OPFS Worker')
    const result = await this.sendMessage('load')
    
    if (result) {
      console.log('✅ Calendar loaded successfully')
    } else {
      console.log('📭 No calendar found')
    }
    
    return result
  }

  async clearCalendar(): Promise<void> {
    console.log('🗑️ Clearing calendar via OPFS Worker')
    await this.sendMessage('clear')
    console.log('✅ Calendar cleared successfully')
  }

  async hasData(): Promise<boolean> {
    return await this.sendMessage('hasData')
  }

  async getStorageQuota(): Promise<{ usage: number; quota: number }> {
    return await this.sendMessage('getQuota')
  }

  async canSaveCalendar(calendar: AdventCalendar): Promise<{
    canSave: boolean
    currentSizeMB: number
    maxSizeMB: number
    estimatedSizeMB: number
  }> {
    return await this.sendMessage('canSave', calendar)
  }

  async getLastSavedAt(): Promise<number | null> {
    try {
      const calendar = await this.loadCalendar()
      return calendar ? Date.now() : null // Simplified - we could store this separately if needed
    } catch {
      return null
    }
  }

  async hasCalendar(): Promise<boolean> {
    try {
      const calendar = await this.loadCalendar()
      return calendar !== null
    } catch {
      return false
    }
  }

  isSupported(): boolean {
    return typeof Worker !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           'storage' in navigator && 
           'getDirectory' in navigator.storage
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    // Reject all pending messages
    for (const [id, pending] of this.pendingMessages) {
      pending.reject(new Error('Service destroyed'))
      this.pendingMessages.delete(id)
    }
  }
}