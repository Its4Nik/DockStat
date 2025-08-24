import type React from 'react'

interface ThemeLoadingOverlayProps {
  isThemeLoaded: boolean
  isLoading?: boolean
  error?: string | null
  customLoadingContent?: React.ReactNode
  customErrorContent?: React.ReactNode
  showOverlay?: boolean
}

export function ThemeLoadingOverlay({
  isThemeLoaded,
  isLoading = false,
  error = null,
  customLoadingContent,
  customErrorContent,
  showOverlay = true,
}: ThemeLoadingOverlayProps) {
  // Don't render anything if theme is loaded and no error
  if (isThemeLoaded && !error && !isLoading) {
    return null
  }

  // Don't render if showOverlay is false
  if (!showOverlay) {
    return null
  }

  const renderContent = () => {
    if (error) {
      return (
        customErrorContent || (
          <div className="theme-loading-error">
            <div className="theme-loading-icon error">⚠️</div>
            <div className="theme-loading-text">
              <h3>Theme Loading Error</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="theme-loading-retry-btn"
              >
                Retry
              </button>
            </div>
          </div>
        )
      )
    }

    return (
      customLoadingContent || (
        <div className="theme-loading-content">
          <div className="theme-loading-spinner">
            <div className="theme-loading-spinner-inner" />
          </div>
          <div className="theme-loading-text">
            <h3>Loading Theme...</h3>
            <p>Applying your selected theme</p>
          </div>
        </div>
      )
    )
  }

  return (
    <div className="theme-loading-overlay">
      <div className="theme-loading-backdrop" />
      <div className="theme-loading-container">{renderContent()}</div>

      <style>{`
        .theme-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-loading-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .theme-loading-container {
          position: relative;
          z-index: 10000;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 400px;
          text-align: center;
        }

        .theme-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .theme-loading-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .theme-loading-spinner {
          width: 48px;
          height: 48px;
          position: relative;
        }

        .theme-loading-spinner-inner {
          width: 100%;
          height: 100%;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: theme-loading-spin 1s linear infinite;
        }

        .theme-loading-icon.error {
          font-size: 3rem;
        }

        .theme-loading-text {
          color: #333;
        }

        .theme-loading-text h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .theme-loading-text p {
          margin: 0;
          font-size: 0.875rem;
          color: #666;
          line-height: 1.4;
        }

        .theme-loading-retry-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          margin-top: 0.5rem;
        }

        .theme-loading-retry-btn:hover {
          background: #2980b9;
        }

        @keyframes theme-loading-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .theme-loading-container {
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .theme-loading-text {
            color: #f0f0f0;
          }

          .theme-loading-text h3 {
            color: #ffffff;
          }

          .theme-loading-text p {
            color: #cccccc;
          }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .theme-loading-container {
            margin: 1rem;
            padding: 1.5rem;
          }

          .theme-loading-text h3 {
            font-size: 1.125rem;
          }

          .theme-loading-text p {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ThemeLoadingOverlay
