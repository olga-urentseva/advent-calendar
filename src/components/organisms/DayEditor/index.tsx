import { useState, useRef, useEffect } from 'react'
import type { DayContent, ContentType, MediaSource } from '../../../types/calendar'
import { FormGroup } from '../../atoms/FormGroup'
import { Label } from '../../atoms/Label'
import { Input } from '../../atoms/Input'
import { Textarea } from '../../atoms/Textarea'
import { Button } from '../../atoms/Button'
import './styles.css'

interface DayEditorProps {
  day: number
  dayContent: DayContent | null
  onSave: (content: DayContent) => void
  onCancel: () => void
}

export function DayEditor({ day, dayContent, onSave, onCancel }: DayEditorProps) {
  const [contentType, setContentType] = useState<ContentType>(dayContent?.type || 'text')
  const [mediaSource, setMediaSource] = useState<MediaSource>(dayContent?.source || 'upload')
  const [content, setContent] = useState(dayContent?.content || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if form is valid for saving
  const isFormValid = () => {
    if (contentType === 'text') {
      return content.trim().length > 0
    } else {
      // For media content
      if (mediaSource === 'upload') {
        return selectedFile !== null
      } else {
        return content.trim().length > 0
      }
    }
  }

  // Check if preview is available
  const hasPreviewContent = () => {
    if (contentType === 'text') {
      return content.trim().length > 0
    } else {
      if (mediaSource === 'upload') {
        return selectedFile !== null
      } else {
        return content.trim().length > 0
      }
    }
  }



  // Clean up preview URL when component unmounts or file changes
  const cleanupPreviewUrl = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Auto-generate preview URL when file is selected
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    
    // Clean up previous preview URL first
    cleanupPreviewUrl()
    
    setSelectedFile(file)
    
    if (file) {
      // Generate new preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!isFormValid()) {
      return
    }

    let finalContent = content.trim()
    let finalSource: MediaSource = 'upload'

    if (contentType === 'text') {
      finalContent = content.trim()
    } else {
      // Handle media content
      if (mediaSource === 'upload' && selectedFile) {
        // Create object URL for file preview
        finalContent = URL.createObjectURL(selectedFile)
        finalSource = 'upload'
      } else if (mediaSource === 'url' && finalContent) {
        finalSource = 'url'
      } else {
        alert('Please provide media content')
        return
      }
    }

    const dayContent: DayContent = {
      day,
      type: contentType,
      source: finalSource,
      content: finalContent,
      title: `Day ${day}`
    }
    
    await onSave(dayContent)
  }

  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType)
    // Reset media source to upload when changing content type
    setMediaSource('upload')
    // Clear content when switching types
    setContent('')
    setSelectedFile(null)
    cleanupPreviewUrl()
  }

  const handleMediaSourceChange = (newSource: MediaSource) => {
    setMediaSource(newSource)
    // Clear content when switching sources
    setContent('')
    setSelectedFile(null)
    cleanupPreviewUrl()
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setContent(e.target.value)
  }

  const handleReplaceFile = () => {
    setSelectedFile(null)
    cleanupPreviewUrl()
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    cleanupPreviewUrl()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrl()
    }
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('Preview state:', { 
      hasPreviewContent: hasPreviewContent(), 
      selectedFile, 
      previewUrl, 
      contentType, 
      mediaSource 
    })
  }, [selectedFile, previewUrl, contentType, mediaSource])

  // Render preview content
  const renderPreview = () => {
    // Show preview if there's any content
    const shouldShowPreview = 
      (contentType === 'text' && content.trim().length > 0) ||
      (contentType !== 'text' && mediaSource === 'upload' && selectedFile) ||
      (contentType !== 'text' && mediaSource === 'url' && content.trim().length > 0)

    if (!shouldShowPreview) return null

    return (
      <div className="preview-mode">
        <div className="content-preview">
          <h4>Preview</h4>
          
          {contentType === 'text' && (
            <div className="text-preview">
              <p>{content}</p>
            </div>
          )}
          
          {contentType === 'image' && (
            <div className="image-preview">
              {mediaSource === 'upload' && selectedFile && previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="preview-image"
                  onError={(e) => {
                    console.error('Image preview error:', e)
                    cleanupPreviewUrl()
                  }}
                />
              )}
              {mediaSource === 'url' && content && (
                <img 
                  src={content} 
                  alt="Preview" 
                  className="preview-image"
                  onError={(e) => {
                    console.error('URL image preview error:', e)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
          )}
          
          {contentType === 'video' && (
            <div className="video-preview">
              {mediaSource === 'upload' && selectedFile && previewUrl && (
                <video 
                  src={previewUrl} 
                  controls 
                  className="preview-video"
                  onError={(e) => {
                    console.error('Video preview error:', e)
                    cleanupPreviewUrl()
                  }}
                />
              )}
              {mediaSource === 'url' && content && (
                <video 
                  src={content} 
                  controls 
                  className="preview-video"
                  onError={(e) => {
                    console.error('URL video preview error:', e)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
          )}
        </div>
        
        {mediaSource === 'upload' && selectedFile && (
          <div className="preview-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleRemoveFile}
              className='btn-remove'
            >
              🗑️ Remove
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleReplaceFile}
              className='btn-replace'
            >
              🔄 Replace
            </Button>
            
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="day-editor">
      <form ref={formRef} onSubmit={handleFormSubmit}>
        <FormGroup>
          <Label htmlFor={`day-${day}-content-type`} className='label'>Content Type</Label>
          <div className="content-type-buttons" id={`day-${day}-content-type`} role="group">
            <label className="type-btn">
              <input
                type="radio"
                name="contentType"
                value="text"
                checked={contentType === 'text'}
                onChange={() => handleContentTypeChange('text')}
              />
              <span>📝 Text</span>
            </label>
            <label className="type-btn">
              <input
                type="radio"
                name="contentType"
                value="image"
                checked={contentType === 'image'}
                onChange={() => handleContentTypeChange('image')}
              />
              <span>🖼️ Image</span>
            </label>
            <label className="type-btn">
              <input
                type="radio"
                name="contentType"
                value="video"
                checked={contentType === 'video'}
                onChange={() => handleContentTypeChange('video')}
              />
              <span>🎥 Video</span>
            </label>
          </div>
        </FormGroup>

        <FormGroup>
          <Label htmlFor={`day-${day}-content`} className='label'>Content</Label>
          
          {/* Text Content */}
          {contentType === 'text' && (
            <Textarea
              id={`day-${day}-content`}
              name="content"
              value={content}
              onChange={handleContentChange}
              placeholder="Enter your message"
              rows={4}
            />
          )}

          {/* Media Content */}
          {contentType !== 'text' && (
            <div className="media-options">
              <div className="media-source-buttons" role="group">
                <label className="source-btn">
                  <input
                    type="radio"
                    name="mediaSource"
                    value="upload"
                    checked={mediaSource === 'upload'}
                    onChange={() => handleMediaSourceChange('upload')}
                  />
                  <span>📁 Upload File</span>
                </label>
                <label className="source-btn">
                  <input
                    type="radio"
                    name="mediaSource"
                    value="url"
                    checked={mediaSource === 'url'}
                    onChange={() => handleMediaSourceChange('url')}
                  />
                  <span>🔗 Use URL</span>
                </label>
              </div>

              {/* File Upload Section */}
              {mediaSource === 'upload' && (
                <div className="file-upload-section">
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="file"
                    accept={contentType === 'image' ? 'image/*' : 'video/*'}
                    className="file-input"
                    id={`file-upload-${day}`}
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn file-upload-btn"
                  >
                    📁 Choose {contentType === 'image' ? 'Image' : 'Video'} File
                  </button>
                  {selectedFile && (
                    <div className="file-info">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </div>
              )}

              {/* URL Input Section */}
              {mediaSource === 'url' && (
                <Input
                  id={`day-${day}-url-input`}
                  name="content"
                  type="url"
                  value={content}
                  onChange={handleContentChange}
                  placeholder={`Enter ${contentType === 'image' ? 'image' : 'video'} URL`}
                />
              )}
            </div>
          )}
        </FormGroup>

        {/* Preview Section */}
        {renderPreview()}

        <div className="editor-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isFormValid()}>
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
