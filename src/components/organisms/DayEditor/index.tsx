import { useState, useEffect, useRef } from 'react'
import type { DayContent, ContentType, MediaSource } from '../../../types/calendar'
import { FormGroup, Label, Input, Textarea, Button } from '../../atoms'
import './styles.css'

interface DayEditorProps {
  day: number
  dayContent: DayContent | null
  onSave: (content: DayContent) => void
  onCancel: () => void
}

export function DayEditor({ day, dayContent, onSave, onCancel }: DayEditorProps) {
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
    setIsEditing(false)
  }

  const isValidContent = (): boolean => {
    if (type === 'text') {
      return content.trim() !== '' && title.trim() !== ''
    }
    return content.trim() !== '' && title.trim() !== ''
  }

  const handleSave = async () => {
    if (!isValidContent()) return

    setIsSaving(true)
    try {
      const dayContent: DayContent = {
        day,
        type,
        source,
        content: content.trim(),
        title: title.trim()
      }
      
      await onSave(dayContent)
    } catch (error) {
      console.error('Error saving day content:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderPreview = () => {
    if (!content) return null

    if (type === 'text') {
      return (
        <div className="content-preview">
          <h4>Text Preview</h4>
          <div className="text-preview">
            <p>{content}</p>
          </div>
        </div>
      )
    }

    if (type === 'image') {
      return (
        <div className="content-preview">
          <h4>Image Preview</h4>
          <div className="image-preview">
            <img 
              src={content} 
              alt="Preview" 
              className="preview-image"
              onError={(e) => {
                console.error('Image preview error:', e)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      )
    }

    if (type === 'video') {
      const videoId = extractVideoId(content)
      if (videoId) {
        return (
          <div className="content-preview">
            <h4>Video Preview</h4>
            <div className="video-preview">
              <iframe
                className="preview-video"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )
      } else {
        return (
          <div className="content-preview">
            <h4>Video Preview</h4>
            <div className="video-preview">
              <video 
                src={content} 
                controls 
                className="preview-video"
                onError={(e) => {
                  console.error('Video preview error:', e)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )
      }
    }

    return null
  }

  // Helper function to extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <div className="day-editor">
      <FormGroup>
        <Label htmlFor={`day-${day}-title`}>Title</Label>
        <Input
          id={`day-${day}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Day ${day} title`}
        />
      </FormGroup>

      {!isEditing && content && type !== 'text' ? (
        // Preview Mode (only for media content)
        <div className="preview-mode">
          {renderPreview()}
          <div className="preview-actions">
            <Button variant="secondary" onClick={handleReplace}>
              🔄 Replace Content
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving || !isValidContent()}>
              {isSaving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // Editing Mode
        <>
          <FormGroup>
            <Label htmlFor={`day-${day}-content-type`}>Content Type</Label>
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
          </FormGroup>

          {type === 'text' ? (
            <FormGroup>
              <Label htmlFor={`day-${day}-message`}>Message</Label>
              <Textarea
                id={`day-${day}-message`}
                value={content}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter your message"
                rows={4}
              />
            </FormGroup>
          ) : (
            <FormGroup>
              <Label htmlFor={`day-${day}-media-content`}>Media Content</Label>
              {showMediaOptions && (
                <div className="media-options" id={`day-${day}-media-content`} role="group" aria-labelledby={`day-${day}-media-content`}>
                  <div className="media-option">
                    <h4>Upload File</h4>
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
            </FormGroup>
          )}

          <div className="editor-actions">
            <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving || !isValidContent()}>
              {isSaving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
