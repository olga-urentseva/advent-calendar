import { useState, useEffect, useRef } from 'react'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Label } from '../../atoms/Label'
import { Textarea } from '../../atoms/Textarea'
import { FormGroup } from '../../atoms/FormGroup'
import { FileSystemService } from '../../../services/FileSystemService'
import type { DayContent, ContentType, MediaSource } from '../../../types/calendar'
import './styles.css'

interface DayEditorProps {
  day: number
  dayContent?: DayContent
  onSave: (content: DayContent) => void
  onCancel: () => void
}

export function DayEditor({ day, dayContent, onSave, onCancel }: DayEditorProps) {
  const [contentType, setContentType] = useState<ContentType>(dayContent?.type || 'text')
  const [mediaSource, setMediaSource] = useState<MediaSource>(dayContent?.source || 'upload')
  const [content, setContent] = useState(dayContent?.content || '')
  const [description, setDescription] = useState(dayContent?.description || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileSystemService = new FileSystemService()

  // Character limits
  const MAX_DESCRIPTION_CHARS = 500

  // Initialize from existing content
  useEffect(() => {
    if (dayContent) {
      console.log('🎬 DayEditor: Loading existing content for day', dayContent.day, {
        type: dayContent.type,
        source: dayContent.source,
        hasContent: Boolean(dayContent.content),
        contentPreview: dayContent.content ? dayContent.content.substring(0, 50) + '...' : 'none'
      })
      
      setContentType(dayContent.type)
      setMediaSource(dayContent.source)
      setContent(dayContent.content || '')
      setDescription(dayContent.description || '')
      
      // If there's existing content and it's a base64 file, create preview URL
      if (dayContent.content && dayContent.content.startsWith('data:')) {
        console.log('🎬 Setting preview URL for existing base64 content')
        setPreviewUrl(dayContent.content)
      } else {
        console.log('🎬 No base64 content found or content does not start with data:')
        setPreviewUrl(null)
      }
    } else {
      console.log('🎬 DayEditor: No existing content, resetting form')
      // Reset form when no dayContent
      setContentType('text')
      setMediaSource('upload')
      setContent('')
      setDescription('')
      setSelectedFile(null)
      cleanupPreviewUrl()
    }
  }, [dayContent])



  // Check if form is valid for saving
  const isFormValid = () => {
    // Don't allow saving if there's a file error
    if (fileError) {
      return false
    }
    
    if (contentType === 'text') {
      return content.trim().length > 0
    } else {
      // For media content
      if (mediaSource === 'upload') {
        return selectedFile !== null || (content && content.startsWith('data:'))
      } else {
        return content.trim().length > 0
      }
    }
  }

  // Clean up preview URL when component unmounts or file changes
  const cleanupPreviewUrl = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  // Auto-generate preview URL when file is selected
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    
    // Clean up previous preview URL and errors first
    cleanupPreviewUrl()
    setFileError(null)
    setCompressionInfo(null)
    setIsProcessing(true) // Disable save button during file processing
    
    if (!file) {
      setSelectedFile(null)
      setIsProcessing(false)
      return
    }

    console.log('🎬 File selected:', {
      name: file.name,
      type: file.type,
      size: `${Math.round(file.size/1024)}KB`,
      contentType
    })

    // Check video file size limit (50MB)
    if (contentType === 'video' && file.size > 50 * 1024 * 1024) {
      setFileError(`Video file too large. Please use videos under 50MB to prevent browser crashes.`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsProcessing(false) // Re-enable save button
      return
    }

    try {

      // Set the file and generate preview
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      console.log('🎬 Preview URL created:', url)
      
      // Note: File is NOT processed/saved to OPFS here
      // It will only be processed when user clicks Save button
      console.log('🎬 File ready for saving when user clicks Save button')
      setIsProcessing(false) // Re-enable save button
    } catch (error) {
      // If checking fails, show error and clear file input
      console.error('🎬 File handling failed:', error)
      setFileError(error instanceof Error ? error.message : 'File handling failed')
      setSelectedFile(null)
      setPreviewUrl(null)
      setCompressionInfo(null)
      setIsProcessing(false) // Re-enable save button
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!isFormValid()) {
      return
    }

    setIsProcessing(true)

    try {
      let finalContent = content.trim()
      let finalSource: MediaSource = 'upload'

      if (contentType === 'text') {
        finalContent = content.trim()
      } else {
        // Handle media content
        if (mediaSource === 'upload' && selectedFile) {
          // NOW we process the file when user clicks Save
          console.log('💾 Processing file for save - converting to base64...')
          const processedContent = await fileSystemService.processMediaFile(selectedFile, contentType)
          if (!processedContent) {
            throw new Error('Failed to process file')
          }
          finalContent = processedContent.content
          finalSource = 'upload'
          console.log('✅ File converted to base64, ready for IndexedDB save')
        } else if (mediaSource === 'upload' && content && content.startsWith('data:')) {
          // Keep existing base64 content
          finalContent = content
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
        description: contentType !== 'text' ? description.trim() : undefined,
        title: `Day ${day}`,
        fileSize: selectedFile?.size,
        originalFileName: selectedFile?.name
      }
      
      onSave(dayContent)
    } catch (error) {
      console.error('Error saving day content:', error)
      alert('Failed to save content. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType)
    // Reset media source to upload when changing content type
    setMediaSource('upload')
    // Clear content when switching types
    setContent('')
    setDescription('')
    setSelectedFile(null)
    cleanupPreviewUrl()
  }

  const handleMediaSourceChange = (newSource: MediaSource) => {
    setMediaSource(newSource)
    // Clear content when switching sources
    setContent('')
    setDescription('')
    setSelectedFile(null)
    cleanupPreviewUrl()
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setContent(e.target.value)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_DESCRIPTION_CHARS) {
      setDescription(value)
    }
  }

  const handleReplaceFile = () => {
    setSelectedFile(null)
    cleanupPreviewUrl()
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    cleanupPreviewUrl()
    setContent('')
    setDescription('')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrl()
    }
  }, [])

  // Render preview content (only for media, not text)
  const renderPreview = () => {
    // Only show preview for media content, not text
    const shouldShowPreview = 
      (contentType !== 'text' && mediaSource === 'upload' && selectedFile) ||
      (contentType !== 'text' && mediaSource === 'upload' && content && content.startsWith('data:')) ||
      (contentType !== 'text' && mediaSource === 'url' && content.trim().length > 0)

    console.log('🎬 Preview render check:', {
      contentType,
      mediaSource,
      selectedFile: Boolean(selectedFile),
      hasContent: Boolean(content),
      contentStartsWithData: content?.startsWith('data:'),
      shouldShowPreview
    })

    if (!shouldShowPreview) return null

    return (
      <div className="preview-mode">
        <div className="content-preview">
          <h4>Preview</h4>
          
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
              {mediaSource === 'upload' && content && content.startsWith('data:') && !selectedFile && (
                <img 
                  src={content} 
                  alt="Preview" 
                  className="preview-image"
                  onError={(e) => {
                    console.error('Stored image preview error:', e)
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
              {(() => {
                console.log('🎬 Video preview render check:', {
                  mediaSource,
                  hasSelectedFile: Boolean(selectedFile),
                  hasPreviewUrl: Boolean(previewUrl),
                  hasContent: Boolean(content),
                  contentStartsWithData: content?.startsWith('data:')
                })
                return null
              })()}
              {mediaSource === 'upload' && selectedFile && previewUrl && (
                <video 
                  src={previewUrl} 
                  controls 
                  className="preview-video"
                  onError={(e) => {
                    console.error('🎬 Video preview error (new file):', e)
                    cleanupPreviewUrl()
                  }}
                  onLoadStart={() => console.log('🎬 Video loading started (new file)')}
                  onCanPlay={() => console.log('🎬 Video can play (new file)')}
                />
              )}
              {mediaSource === 'upload' && content && content.startsWith('data:') && !selectedFile && (
                <video 
                  src={content} 
                  controls 
                  className="preview-video"
                  onError={(e) => {
                    console.error('🎬 Stored video preview error:', e, 'Source:', content.substring(0, 100))
                  }}
                  onLoadStart={() => console.log('🎬 Stored video loading started, src length:', content.length)}
                  onCanPlay={() => console.log('🎬 Stored video can play')}
                />
              )}
              {mediaSource === 'url' && content && (
                <video 
                  src={content} 
                  controls 
                  className="preview-video"
                  onError={(e) => {
                    console.error('🎬 URL video preview error:', e)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoadStart={() => console.log('🎬 URL video loading started')}
                  onCanPlay={() => console.log('🎬 URL video can play')}
                />
              )}
            </div>
          )}
        </div>
        
        {(mediaSource === 'upload' && selectedFile) || (mediaSource === 'upload' && content && content.startsWith('data:')) ? (
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
        ) : null}
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
                    accept={contentType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg'}
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
                  <div className="file-size-notice">
                    <>Please use files under 50MB to prevent browser crashes.</>
                    <br />
                    {contentType === 'image' ? (
                      <>🖼️ Images &gt;500KB auto-compressed</>
                    ) : (
                      <>
                      <>🎥 Supported: MP4, WebM, OGG (avoid QuickTime/MOV)</>
                      
          
                      </>
                      
                    )}
                    <br />
                  </div>
                  {fileError && (
                    <div className="file-error">
                      ❌ {fileError}
                    </div>
                  )}
                  {selectedFile && (
                    <div className="file-info">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                  {compressionInfo && (
                    <div className="compression-info">
                      ✅ {compressionInfo}
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

        {/* Description Section for Media Files */}
        {contentType !== 'text' && (
          <FormGroup>
            <Label htmlFor={`day-${day}-description`} className='label'>
              Message (Optional)
            </Label>
            <Textarea
              id={`day-${day}-description`}
              name="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Add a message..."
              rows={3}
            />
            <div className={`character-count ${
              description.length > MAX_DESCRIPTION_CHARS * 0.9 ? 'danger' : 
              description.length > MAX_DESCRIPTION_CHARS * 0.75 ? 'warning' : ''
            }`}>
              {description.length}/{MAX_DESCRIPTION_CHARS} characters
            </div>
          </FormGroup>
        )}

        {/* Preview Section */}
        {renderPreview()}

        <div className="editor-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isFormValid() || isProcessing}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
