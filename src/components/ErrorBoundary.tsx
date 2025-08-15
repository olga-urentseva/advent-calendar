import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Container } from './atoms/Container'
import { ErrorDisplay } from './organisms/ErrorDisplay'
import { ErrorActions } from './organisms/ErrorActions'

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
          <Container>
            <ErrorDisplay 
              error={this.state.error} 
              errorInfo={this.state.errorInfo} 
            />
            <ErrorActions />
          </Container>
        </div>
      )
    }

    return this.props.children
  }
} 