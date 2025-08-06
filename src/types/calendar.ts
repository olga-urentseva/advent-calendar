export type ContentType = 'text' | 'image' | 'video'
export type MediaSource = 'upload' | 'url'

export interface DayContent {
  day: number
  type: ContentType
  source: MediaSource
  content: string // text content, base64, or URL
  title?: string
  fileSize?: number
  originalFileName?: string
  compressed?: boolean
}

export interface AdventCalendar {
  title: string
  createdBy: string
  createdAt: string
  days: DayContent[]
}

export interface CalendarMetadata {
  title: string
  createdBy: string
  createdAt: string
  totalDays: number
  completedDays: number
} 