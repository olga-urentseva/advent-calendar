import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CalendarController } from '../controllers/CalendarController'
import type { DayContent, ContentType, MediaSource } from '../types/calendar'

export function CreateCalendarView() {
  const [controller] = useState(() => new CalendarController())
  const [title, setTitle] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [to, setTo] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [dayCount, setDayCount] = useState(25)

  const calendar = controller.getCalendar()
  const currentDayCount = controller.getDayCount()

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }



  const handleDayCountChange = (count: number) => {
    setDayCount(count)
    // Reset the calendar with new day count
    controller.setDayCount(count)
  }

  const handleSaveDay = async (day: number, dayContent: DayContent) => {
    try {
      await controller.setDayContent(day, dayContent)
      setSelectedDay(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save day content')
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError('')
      
      // Set metadata before export
      controller.setCalendarMetadata(title, createdBy, to)
      
      // Debug logging
      console.log('Export Debug:', {
        title,
        createdBy,
        to,
        completedDays: controller.getCompletedDays(),
        totalDays: controller.getDayCount(),
        isValid: controller.isCalendarValid(),
        isFullyCompleted: controller.isCalendarFullyCompleted()
      })
      
      await controller.exportCalendar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export calendar')
    } finally {
      setIsExporting(false)
    }
  }

  const isDayCompleted = (day: number) => {
    const dayContent = controller.getDay(day)
    return dayContent && dayContent.content.trim() !== ''
  }

  return (
    <div className="container">
      <div className="header">
        <Link to="/" className="back-link">
          ← Back
        </Link>
        <h1 className="title">Create Calendar</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="calendar-form">
        <div className="form-group">
          <label htmlFor="title">Calendar Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter calendar title"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="created-by">Created By</label>
          <input
            id="created-by"
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Your name"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="to">To</label>
          <input
            id="to"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipient's name"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="day-count-buttons">Number of Days</label>
          <div className="day-count-buttons" id="day-count-buttons" role="group" aria-labelledby="day-count-buttons">
            <button
              type="button"
              className={`day-count-btn ${dayCount === 25 ? 'active' : ''}`}
              onClick={() => handleDayCountChange(25)}
            >
              25 Days
            </button>
            <button
              type="button"
              className={`day-count-btn ${dayCount === 15 ? 'active' : ''}`}
              onClick={() => handleDayCountChange(15)}
            >
              15 Days
            </button>
            <button
              type="button"
              className={`day-count-btn ${dayCount === 7 ? 'active' : ''}`}
              onClick={() => handleDayCountChange(7)}
            >
              7 Days
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          <h3>Calendar Days (Click to edit)</h3>
          <div className="days-grid">
            {calendar.days.slice(0, currentDayCount).map((day) => (
              <button
                key={day.day}
                className={`day-cell ${isDayCompleted(day.day) ? 'completed' : ''}`}
                onClick={() => handleDayClick(day.day)}
              >
                <span className="day-number">{day.day}</span>
                {isDayCompleted(day.day) && <span className="checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="export-section">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || !(title && createdBy && to && controller.getCompletedDays() === currentDayCount)}
          >
            {isExporting ? 'Exporting...' : 'Export Calendar'}
          </button>
          <div className="validation-info">
            <small>
              Title: {title ? '✓' : '✗'} | 
              Creator: {createdBy ? '✓' : '✗'} | 
              To: {to ? '✓' : '✗'} | 
              Completed: {controller.getCompletedDays()}/{currentDayCount} |
              Valid: {controller.isCalendarValid() ? '✓' : '✗'} |
              Fully Complete: {controller.isCalendarFullyCompleted() ? '✓' : '✗'}
            </small>
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '8px', fontSize: '12px', padding: '4px 8px' }}
              onClick={() => {
                controller.setCalendarMetadata(title, createdBy, to)
                console.log('Debug Info:', {
                  title,
                  createdBy,
                  to,
                  completedDays: controller.getCompletedDays(),
                  totalDays: controller.getDayCount(),
                  isValid: controller.isCalendarValid(),
                  isFullyCompleted: controller.isCalendarFullyCompleted()
                })
              }}
            >
              Debug Validation
            </button>
          </div>
          <p className="progress-text">
            {controller.getCompletedDays()} of {currentDayCount} days completed
          </p>
        </div>
      </div>

      {selectedDay && (
        <DayEditor
          day={selectedDay}
          dayContent={controller.getDay(selectedDay)}
          onSave={(dayContent) => handleSaveDay(selectedDay, dayContent)}
          onCancel={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}

// Day Editor Component
interface DayEditorProps {
  day: number
  dayContent: DayContent | null
  onSave: (content: DayContent) => void
  onCancel: () => void
}

function DayEditor({ day, dayContent, onSave, onCancel }: DayEditorProps) {
  const [type, setType] = useState<ContentType>('text')
  const [source, setSource] = useState<MediaSource>('upload')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [showMediaOptions, setShowMediaOptions] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dayContent) {
      setType(dayContent.type)
      setSource(dayContent.source)
      setContent(dayContent.content)
      setTitle(dayContent.title || '')
      // If there's existing content, show preview mode
      setIsEditing(dayContent.content.trim() === '')
      // Show media options for non-text content
      if (dayContent.type !== 'text') {
        setShowMediaOptions(true)
      }
    }
  }, [dayContent])

  const handleTypeChange = (newType: ContentType) => {
    setType(newType)
    if (newType === 'text') {
      setShowMediaOptions(false)
      setSource('upload')
    } else {
      setShowMediaOptions(true)
    }
    setIsEditing(true)
    // Clear content when changing type
    setContent('')
    setSelectedFile(null)
  }

  const handleReplace = () => {
    setIsEditing(true)
    setSelectedFile(null)
    // Clean up object URL if it exists
    if (content && content.startsWith('blob:')) {
      URL.revokeObjectURL(content)
    }
    setContent('')
    // Show media options for non-text content
    if (type !== 'text') {
      setShowMediaOptions(true)
    }
  }

  const handleTextChange = (text: string) => {
    setContent(text)
    // No preview needed for text content
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate that we have a proper File object
      if (!(file instanceof File)) {
        console.error('Invalid file object received')
        return
      }
      
      setIsUploading(true)
      try {
        setSelectedFile(file)
        setSource('upload')
        
        // Create a preview URL for the file
        const fileUrl = URL.createObjectURL(file)
        setContent(fileUrl)
        
        // Show preview immediately after file selection
        setIsEditing(false)
      } catch (error) {
        console.error('Error processing file:', error)
        // Clear the file input on error
        event.target.value = ''
        setSelectedFile(null)
        setContent('')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleUrlInput = (url: string) => {
    setContent(url)
    setSource('url')
    setSelectedFile(null)
    // Show preview immediately after URL input
    if (url.trim()) {
      setIsEditing(false)
    }
  }

  // Validation function to check if content is valid for saving
  const isValidContent = (): boolean => {
    if (type === 'text') {
      return content.trim().length > 0
    } else {
      // For media content, check if we have either a file or a valid URL
      if (source === 'upload') {
        return selectedFile !== null
      } else {
        return content.trim().length > 0
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (type === 'text') {
        onSave({
          day,
          type,
          source: 'upload',
          content,
          title: title || `Day ${day}`
        })
      } else {
        // For media content, we need to handle the actual file or URL
        if (source === 'upload' && selectedFile) {
          // Validate that selectedFile is actually a File object
          if (!(selectedFile instanceof File)) {
            throw new Error('Invalid file object. Please select a file again.')
          }
          
          // Convert file to base64 for storage
          const reader = new FileReader()
          reader.onload = () => {
            const base64Content = reader.result as string
            onSave({
              day,
              type,
              source,
              content: base64Content,
              title: title || `Day ${day}`,
              originalFileName: selectedFile.name,
              fileSize: selectedFile.size
            })
          }
          reader.onerror = () => {
            throw new Error('Failed to read file. Please try again.')
          }
          reader.readAsDataURL(selectedFile)
          return // Exit early since we're handling async file reading
        } else {
          onSave({
            day,
            type,
            source,
            content,
            title: title || `Day ${day}`
          })
        }
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving content:', error)
      // Show error to user
      alert(error instanceof Error ? error.message : 'Failed to save content. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Clean up object URLs when component unmounts or when replacing content
  useEffect(() => {
    return () => {
      // Clean up any object URLs we created
      if (content && content.startsWith('blob:')) {
        URL.revokeObjectURL(content)
      }
    }
  }, [content])

  const renderPreview = () => {
    if (!content) return null

    switch (type) {
      case 'text':
        return (
          <div className="content-preview">
            <h4>Text Preview</h4>
            <div className="text-preview">
              <p>{content}</p>
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="content-preview">
            <h4>Image Preview</h4>
            <div className="image-preview">
              <img 
                src={content} 
                alt={title || `Day ${day}`}
                className="preview-image"
              />
            </div>
          </div>
        )
      
      case 'video':
        if (source === 'url') {
          const videoId = extractVideoId(content)
          if (videoId) {
            return (
              <div className="content-preview">
                <h4>Video Preview</h4>
                <div className="video-preview">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title || `Day ${day}`}
                    frameBorder="0"
                    allowFullScreen
                    className="preview-video"
                  />
                </div>
              </div>
            )
          }
        }
        return (
          <div className="content-preview">
            <h4>Video Preview</h4>
            <div className="video-preview">
              <video 
                src={content} 
                controls
                className="preview-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // Helper function to extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <div className="day-editor-overlay">
      <div className="day-editor">
        <button 
          className="close-btn" 
          onClick={onCancel}
          aria-label="Close day editor"
        >
          ✕
        </button>
        <h3>Day {day}</h3>
        
        <div className="form-group">
          <label htmlFor={`day-${day}-title`}>Title</label>
          <input
            id={`day-${day}-title`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Day ${day} title`}
            className="form-input"
          />
        </div>

        {!isEditing && content && type !== 'text' ? (
          // Preview Mode (only for media content)
          <div className="preview-mode">
            {renderPreview()}
            <div className="preview-actions">
              <button className="btn btn-secondary" onClick={handleReplace}>
                🔄 Replace Content
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !isValidContent()}>
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Editing Mode
          <>
            <div className="form-group">
              <label htmlFor={`day-${day}-content-type`}>Content Type</label>
              <div className="content-type-buttons" id={`day-${day}-content-type`} role="group" aria-labelledby={`day-${day}-content-type`}>
                <button
                  type="button"
                  className={`type-btn ${type === 'text' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('text')}
                >
                  📝 Text
                </button>
                <button
                  type="button"
                  className={`type-btn ${type === 'image' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('image')}
                >
                  🖼️ Image
                </button>
                <button
                  type="button"
                  className={`type-btn ${type === 'video' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('video')}
                >
                  🎥 Video
                </button>
              </div>
            </div>

            {type === 'text' ? (
              <div className="form-group">
                <label htmlFor={`day-${day}-message`}>Message</label>
                <textarea
                  id={`day-${day}-message`}
                  value={content}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter your message"
                  className="form-textarea"
                  rows={4}
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor={`day-${day}-media-content`}>Media Content</label>
                {showMediaOptions && (
                  <div className="media-options" id={`day-${day}-media-content`} role="group" aria-labelledby={`day-${day}-media-content`}>
                    <div className="media-option">
                      
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={type === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileUpload}
                        className="file-input"
                        id={`file-upload-${day}`}
                        disabled={isUploading}
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`btn file-upload-btn ${isUploading ? 'uploading' : ''}`}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <span className="spinner"></span>
                            Processing...
                          </>
                        ) : (
                          `📁 Choose ${type === 'image' ? 'Image' : 'Video'} File`
                        )}
                      </button>
                      {selectedFile && (
                        <p className="file-info">Selected: {selectedFile.name}</p>
                      )}
                    </div>

                    <div className="media-divider">
                      <span>OR</span>
                    </div>

                    <div className="media-option">
                      <h4>Use URL</h4>
                      <input
                        id={`day-${day}-url-input`}
                        type="url"
                        value={source === 'url' ? content : ''}
                        onChange={(e) => handleUrlInput(e.target.value)}
                        placeholder={`Enter ${type} URL`}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="editor-actions">
              <button className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !isValidContent()}>
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 