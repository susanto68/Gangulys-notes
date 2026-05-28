import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return this.props.fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-medium text-red-900">Something went wrong</h3>
          <p className="text-sm text-red-700 mt-1">
            There was an error rendering this component. Please refresh the page.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
