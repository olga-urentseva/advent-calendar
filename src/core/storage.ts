import type { AdventCalendar } from '../types/calendar'

export class Storage {
  private readonly storageKey = 'advent_calendar_data'

  // Save calendar data to local storage
  save(calendar: AdventCalendar): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(calendar))
    } catch (error) {
      console.warn('Failed to save calendar to storage:', error)
    }
  }

  // Load calendar data from local storage
  load(): AdventCalendar | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as AdventCalendar
        // Validate the structure
        if (parsed.days && Array.isArray(parsed.days)) {
          return parsed
        }
      }
    } catch (error) {
      console.warn('Failed to load calendar from storage:', error)
    }
    return null
  }

  // Clear all stored data
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }

  // Check if there's stored data
  hasData(): boolean {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as AdventCalendar
        return parsed.days && Array.isArray(parsed.days) && parsed.days.some(day => day.content.trim() !== '')
      }
    } catch {
      // Ignore errors
    }
    return false
  }
}
