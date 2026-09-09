import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="offline-indicator"
    >
      <WifiOff className="offline-indicator-icon" />
      <span className="offline-indicator-text">
        You're offline. Some features may be unavailable.
      </span>
    </div>
  );
}

export default OfflineIndicator;
