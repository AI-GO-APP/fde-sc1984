import React from 'react'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI 錯誤:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full text-center space-y-4">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-900">發生未預期錯誤</h2>
            <p className="text-sm text-gray-500 break-all">{this.state.error?.message || '未知錯誤'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl font-medium shadow shadow-green-200"
            >
              重新整理
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
