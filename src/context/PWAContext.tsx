import React, { createContext, useContext, useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  showModal: boolean;
  installApp: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  dismissPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is running in Standalone Mode (Already installed)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    setIsStandalone(standaloneMode);
    setIsIOS(isIOSDevice);

    if (standaloneMode) return;

    // Check if previously dismissed within 7 days
    const dismissedAt = localStorage.getItem('srms_pwa_prompt_dismissed');
    let isDismissedRecently = false;
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 7) {
        isDismissedRecently = true;
      }
    }

    if (isIOSDevice && !standaloneMode && !isDismissedRecently) {
      setShowModal(true);
      return;
    }

    // Android / Desktop beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissedRecently) {
        setShowModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const dismissPrompt = () => {
    localStorage.setItem('srms_pwa_prompt_dismissed', Date.now().toString());
    setShowModal(false);
  };

  const installApp = async () => {
    if (isIOS) {
      setShowModal(true);
      return;
    }

    if (!deferredPrompt) {
      setShowModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowModal(false);
    }
    setDeferredPrompt(null);
  };

  const canInstall = !isStandalone && (deferredPrompt !== null || isIOS);

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isIOS,
        isStandalone,
        canInstall,
        showModal,
        installApp,
        openModal,
        closeModal,
        dismissPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
