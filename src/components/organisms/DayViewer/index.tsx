import { useState, useEffect } from 'react'
import type { DayContent } from '../../../types/calendar'
import { MediaUrlService } from '../../../services/MediaUrlService'
import { FileSystemService } from '../../../services/FileSystemService'
import './styles.css'

interface DayViewerProps {
  day: DayContent
  onClose: () => void
  mediaUrlService?: MediaUrlService
  createdBy: string;
}

export function DayViewer({ day, mediaUrlService, createdBy }: DayViewerProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const actualMediaUrlService = mediaUrlService || new FileSystemService('received').getMediaUrlService()

  useEffect(() => {
    const loadMediaUrl = async () => {
      if (day.type !== 'text' && day.content) {
        try {
          const url = await actualMediaUrlService.getMediaUrl(day.content)
          setMediaUrl(url)
        } catch (error) {
          console.error('Failed to load media URL:', error)
          setMediaUrl(day.content) // Fallback to original content
        }
      }
    }

    loadMediaUrl()

    // Cleanup function
    return () => {
      if (day.content && day.content.startsWith('media/')) {
        actualMediaUrlService.revokeUrl(day.content)
      }
    }
  }, [day.content, day.type, actualMediaUrlService])
  const renderContent = () => {
    switch (day.type) {
      case 'text':
        return (
          <div className="text-content">
            <p className='message-description'>{createdBy} left you a message:</p>
            <p className='message'>{day.content}</p>
          </div>
        )
      
      case 'image':
        return (
          <div className="image-content">
            <img 
              src={mediaUrl || day.content} 
              alt={day.title || `Day ${day.day}`}
              className="content-image"
            />
            {day.description && (
              <div className="content-description">
                <p>{day.description}</p>
              </div>
            )}
          </div>
        )
      
      case 'video':
        if (day.source === 'url') {
          // Handle YouTube/Vimeo URLs
          const videoId = extractVideoId(day.content)
          if (videoId) {
            return (
              <div className="video-content">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={day.title || `Day ${day.day}`}
                  
                  allowFullScreen
                  className="content-video"
                />
                {day.description && (
                  <div className="content-description">
                    <p>{day.description}</p>
                  </div>
                )}
              </div>
            )
          }
        }
        return (
          <div className="video-content">
            <video 
              src={mediaUrl || day.content} 
              controls
              className="content-video"
            >
              Your browser does not support the video tag.
            </video>
            {day.description && (
              <div className="content-description">
                <p>{day.description}</p>
              </div>
            )}
          </div>
        )
      
      default:
        return <p>Unsupported content type</p>
    }
  }

  // Helper function to extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <div className="day-viewer">
      <div className="viewer-content">
        {renderContent()}
      </div>
    </div>
  )
}
