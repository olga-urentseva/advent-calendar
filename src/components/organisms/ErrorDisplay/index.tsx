import { Title, Subtitle } from '../../atoms'
import './styles.css'

interface ErrorDisplayProps {
  error?: Error
  errorInfo?: React.ErrorInfo
}

export function ErrorDisplay({ error, errorInfo }: ErrorDisplayProps) {
  return (
    <div className="error-display">
      <Title>🚨 Something went wrong</Title>
      <Subtitle>
        An unexpected error occurred. Please try refreshing the page.
      </Subtitle>
      
      <div className="error-details">
        <h3>Error Details:</h3>
        <pre className="error-stack">
          {error?.toString()}
        </pre>
        
        {errorInfo && (
          <details>
            <summary>Component Stack</summary>
            <pre className="error-stack">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
