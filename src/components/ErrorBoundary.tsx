import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="container">
            <h1 className="title">🚨 Something went wrong</h1>
            <p className="subtitle">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            
            <div className="error-details">
              <h3>Error Details:</h3>
              <pre className="error-stack">
                {this.state.error?.toString()}
              </pre>
              
              {this.state.errorInfo && (
                <details>
                  <summary>Component Stack</summary>
                  <pre className="error-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 