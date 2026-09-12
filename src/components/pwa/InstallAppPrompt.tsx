import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import './InstallAppPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt within 7 days
    const dismissedAt = localStorage.getItem('srms_pwa_prompt_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS devices (which do not trigger beforeinstallprompt)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    // Standard Android / Chrome / Windows / Edge listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('srms_pwa_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-card">
        <button type="button" className="pwa-dismiss-btn" onClick={handleDismiss} title="Close">
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
            <button type="button" className="btn-pwa-secondary" onClick={handleDismiss}>
              Not Now
            </button>
            <button type="button" className="btn-pwa-primary" onClick={handleInstallClick}>
              <Download size={16} />
              <span>Install App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
