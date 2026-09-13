import React, { useState, useEffect } from 'react';
import './PwaUpdateBanner.css';

interface PwaUpdateBannerProps {
  onRefresh?: () => void;
}

export const PwaUpdateBanner: React.FC<PwaUpdateBannerProps> = ({ onRefresh }) => {
  const [show, setShow] = useState<boolean>(false);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const handleNeedRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ updateServiceWorker: () => void }>;
      if (customEvent.detail && typeof customEvent.detail.updateServiceWorker === 'function') {
        setUpdateFn(() => customEvent.detail.updateServiceWorker);
      }
      setShow(true);
    };

    window.addEventListener('srms_pwa_need_refresh', handleNeedRefresh);
    return () => {
      window.removeEventListener('srms_pwa_need_refresh', handleNeedRefresh);
    };
  }, []);

  const handleRefreshClick = () => {
    setUpdating(true);
    if (onRefresh) {
      onRefresh();
    }
    if (updateFn) {
      updateFn();
    } else {
      // Fallback reload if updateFn wasn't attached
      window.location.reload();
    }
  };

  if (!show) return null;

  return (
    <div className="pwa-update-banner" role="alert" aria-live="assertive">
      <div className="pwa-update-info">
        <div className="pwa-update-icon">
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={updating ? 'animate-spin' : ''}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="pwa-update-text">
          <h5>A new version of the Dotmond Portal is available.</h5>
          <p>Click refresh to apply instant updates.</p>
        </div>
      </div>

      <div className="pwa-update-actions">
        <button
          onClick={handleRefreshClick}
          disabled={updating}
          className="pwa-refresh-btn"
          aria-label="Refresh Portal App"
        >
          {updating ? (
            'Updating...'
          ) : (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </>
          )}
        </button>
        <button
          onClick={() => setShow(false)}
          className="pwa-dismiss-btn"
          aria-label="Dismiss Update Notification"
          title="Dismiss"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
