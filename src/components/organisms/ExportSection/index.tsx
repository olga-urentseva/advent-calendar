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
  onClearData: () => void
}

export function ExportSection({
  isExporting,
  completedDays,
  currentDayCount,
  isFullyCompleted,
  onExport,
  onClearData,
}: ExportSectionProps) {
  return (
    <div className="export-section">
      <div className="export-actions">
        <Button
          type="button" 
          variant="secondary" 
          onClick={onClearData}
          className="clear-all-btn"
        >
          🗑️ Clear All Data
        </Button>
        <Button
          variant="primary"
          onClick={onExport}
          disabled={isExporting || !isFullyCompleted}
        >
          {isExporting ? 'Exporting...' : 'Export Calendar'}
        </Button>
      </div>
      <p className="progress-text">
        {completedDays} of {currentDayCount} days completed
      </p>
    </div>
  )
}
