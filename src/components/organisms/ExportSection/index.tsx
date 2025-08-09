import { Button } from '../../atoms'
import './styles.css'

interface ExportSectionProps {
  isExporting: boolean
  title: string
  createdBy: string
  to: string
  completedDays: number
  currentDayCount: number
  isValid: boolean
  isFullyCompleted: boolean
  onExport: () => void
  onDebugValidation: () => void
}

export function ExportSection({
  isExporting,
  title,
  createdBy,
  to,
  completedDays,
  currentDayCount,
  isValid,
  isFullyCompleted,
  onExport,
  onDebugValidation
}: ExportSectionProps) {
  return (
    <div className="export-section">
      <Button
        variant="primary"
        onClick={onExport}
        disabled={isExporting || !(title && createdBy && to && completedDays === currentDayCount)}
      >
        {isExporting ? 'Exporting...' : 'Export Calendar'}
      </Button>
      <div className="validation-info">
        <small>
          Title: {title ? '✓' : '✗'} | 
          Creator: {createdBy ? '✓' : '✗'} | 
          To: {to ? '✓' : '✗'} | 
          Completed: {completedDays}/{currentDayCount} |
          Valid: {isValid ? '✓' : '✗'} |
          Fully Complete: {isFullyCompleted ? '✓' : '✗'}
        </small>
        <Button 
          variant="secondary"
          className="debug-btn"
          onClick={onDebugValidation}
        >
          Debug Validation
        </Button>
      </div>
      <p className="progress-text">
        {completedDays} of {currentDayCount} days completed
      </p>
    </div>
  )
}
