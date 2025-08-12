import type { DayContent } from '../../../types/calendar'
import './styles.css'

interface DayViewerProps {
  day: DayContent
  onClose: () => void
}

export function DayViewer({ day }: DayViewerProps) {
  const renderContent = () => {
    switch (day.type) {
      case 'text':
        return (
          <div className="text-content">
            <p>{day.content}</p>
          </div>
        )
      
      case 'image':
        return (
          <div className="image-content">
            <img 
              src={day.content} 
              alt={day.title || `Day ${day.day}`}
              className="content-image"
            />
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
                  frameBorder="0"
                  allowFullScreen
                  className="content-video"
                />
              </div>
            )
          }
        }
        return (
          <div className="video-content">
            <video 
              src={day.content} 
              controls
              className="content-video"
            >
              Your browser does not support the video tag.
            </video>
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
