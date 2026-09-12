import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import './ManualInstallButton.css';

interface ManualInstallButtonProps {
  variant?: 'button' | 'menu-item' | 'icon-only' | 'badge';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export const ManualInstallButton: React.FC<ManualInstallButtonProps> = ({
  variant = 'button',
  className = '',
  showLabel = true,
  label = 'Install App',
}) => {
  const { canInstall, installApp } = usePWA();

  // Hide button completely if app is already running in Standalone Mode or install prompt unavailable
  if (!canInstall) {
    return null;
  }

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        className={`pwa-manual-menu-item ${className}`}
        onClick={installApp}
        title="Download & Install App"
      >
        <Smartphone size={18} className="pwa-menu-icon" />
        {showLabel && <span>{label}</span>}
      </button>
    );
  }

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        className={`pwa-manual-icon-btn ${className}`}
        onClick={installApp}
        title="Download & Install App"
      >
        <Download size={16} />
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        className={`pwa-manual-badge-btn ${className}`}
        onClick={installApp}
        title="Download & Install App"
      >
        <Download size={13} />
        {showLabel && <span>{label}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`pwa-manual-standard-btn ${className}`}
      onClick={installApp}
    >
      <Download size={15} />
      {showLabel && <span>{label}</span>}
    </button>
  );
};
