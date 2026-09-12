import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import './OfflineIndicator.css';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnectedToast(true);
      setTimeout(() => setShowReconnectedToast(false), 3500);
    };

    const handleConflict = (e: Event) => {
      const customEvt = e as CustomEvent<{ message?: string }>;
      const msg = customEvt.detail?.message || 'This record was modified by another user. Please refresh.';
      setConflictMessage(msg);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('srms_conflict_error', handleConflict);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('srms_conflict_error', handleConflict);
    };
  }, []);

  if (conflictMessage) {
    return (
      <div className="offline-status-bar is-conflict">
        <AlertTriangle size={15} />
        <span>{conflictMessage}</span>
        <button
          type="button"
          className="btn-conflict-refresh"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={12} /> Refresh Page
        </button>
      </div>
    );
  }

  if (!isOffline && !showReconnectedToast) return null;

  return (
    <div className={`offline-status-bar ${isOffline ? 'is-offline' : 'is-reconnected'}`}>
      {isOffline ? (
        <>
          <WifiOff size={14} />
          <span>You are currently offline. Displaying cached data.</span>
        </>
      ) : (
        <>
          <Wifi size={14} />
          <span>Connection restored. Syncing latest data...</span>
        </>
      )}
    </div>
  );
};
