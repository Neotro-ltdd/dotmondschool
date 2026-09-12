import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import './OfflineIndicator.css';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnectedToast(true);
      setTimeout(() => setShowReconnectedToast(false), 3500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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
