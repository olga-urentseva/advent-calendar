import type { ChangeEvent, DragEvent } from 'react'
import './styles.css'

interface CalendarUploaderProps {
  isDragging: boolean
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}

export function CalendarUploader({
  isDragging,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop
}: CalendarUploaderProps) {
  return (
    <div className="upload-section">
      <h3>Import Advent Calendar</h3>
      
      <input
        type="file"
        accept=".json"
        onChange={onFileUpload}
        className="file-input"
        id="calendar-upload"
      />
      <label 
        htmlFor="calendar-upload"
        className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          <strong>Select any JSON calendar file to import</strong>
          <span>or drag and drop here</span>
        </div>
      </label>
    </div>
  )
}
