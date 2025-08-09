import { Button } from '../../atoms'
import './styles.css'

interface ErrorActionsProps {
  onRefresh?: () => void
}

export function ErrorActions({ onRefresh }: ErrorActionsProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="error-actions">
      <Button 
        variant="primary"
        onClick={handleRefresh}
      >
        🔄 Refresh Page
      </Button>
    </div>
  )
}
