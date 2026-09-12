import React from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import './InstallAppPrompt.css';

export const InstallAppPrompt: React.FC = () => {
  const { isIOS, showModal, installApp, dismissPrompt } = usePWA();

  if (!showModal) return null;

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-card">
        <button type="button" className="pwa-dismiss-btn" onClick={dismissPrompt} title="Close">
          <X size={18} />
        </button>

        <div className="pwa-install-header">
          <div className="pwa-icon-wrapper">
            <img src="/images/dotmond-logo-1.png" alt="Dotmond School Portal" className="pwa-app-logo" />
          </div>
          <div className="pwa-header-info">
            <h4 className="pwa-title">Dotmond School App</h4>
            <p className="pwa-subtitle">Official Mobile & Parent Portal</p>
          </div>
        </div>

        <p className="pwa-description">
          Install the portal on your phone for instant access to student results, attendance, and tuition updates offline.
        </p>

        {isIOS ? (
          <div className="pwa-ios-guide">
            <div className="pwa-ios-step">
              <Share size={16} className="pwa-ios-icon" />
              <span>Tap <strong>Share</strong> in Safari's toolbar.</span>
            </div>
            <div className="pwa-ios-step">
              <PlusSquare size={16} className="pwa-ios-icon" />
              <span>Select <strong>"Add to Home Screen"</strong>.</span>
            </div>
          </div>
        ) : (
          <div className="pwa-actions">
            <button type="button" className="btn-pwa-secondary" onClick={dismissPrompt}>
              Not Now
            </button>
            <button type="button" className="btn-pwa-primary" onClick={installApp}>
              <Download size={16} />
              <span>Install App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
