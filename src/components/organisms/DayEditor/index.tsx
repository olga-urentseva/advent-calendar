import { useState, useRef } from 'react'
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
  const [title, setTitle] = useState(dayContent?.title || '')
  const [content, setContent] = useState(dayContent?.content || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if form is valid for saving
  const isFormValid = () => {
    if (!title.trim()) return false
    
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
      title: title.trim()
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
  }

  const handleMediaSourceChange = (newSource: MediaSource) => {
    setMediaSource(newSource)
    // Clear content when switching sources
    setContent('')
    setSelectedFile(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
  }

  return (
    <div className="day-editor">
      <form ref={formRef} onSubmit={handleFormSubmit}>
        <FormGroup>
          <Label htmlFor={`day-${day}-title`} className='label'>Title</Label>
          <Input
            id={`day-${day}-title`}
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
          />
        </FormGroup>

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
              onChange={(e) => setContent(e.target.value)}
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
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Enter ${contentType === 'image' ? 'image' : 'video'} URL`}
                />
              )}
            </div>
          )}
        </FormGroup>

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
