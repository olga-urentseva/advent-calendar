import { Button } from '../../atoms/Button'
import './styles.css'

interface ExportSectionProps {
  isExporting: boolean
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
        disabled={isExporting || !isFullyCompleted}
      >
        {isExporting ? 'Exporting...' : 'Export Calendar'}
      </Button>
      <div className="validation-info">
        <small>
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
