import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './SlideNotification.css';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface SlideNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  action?: NotificationAction;
  autoCloseMs?: number;
}

export const SlideNotification: React.FC<SlideNotificationProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  action,
  autoCloseMs = 7000,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      return;
    }

    if (autoCloseMs && autoCloseMs > 0 && !action) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, action]);

  if (!isOpen && !isClosing) {
    return null;
  }

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250); // Matches transition duration
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="slide-notification-icon success" />;
      case 'warning':
        return <AlertTriangle size={24} className="slide-notification-icon warning" />;
      case 'error':
        return <XCircle size={24} className="slide-notification-icon error" />;
      default:
        return <Info size={24} className="slide-notification-icon info" />;
    }
  };

  const defaultTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Notice';
      case 'error':
        return 'Action Failed';
      default:
        return 'Information';
    }
  };

  return ReactDOM.createPortal(
    <div className="slide-notification-container" role="alert" aria-live="assertive">
      <div className={`slide-notification-card ${type} ${isClosing ? 'closing' : ''}`}>
        {renderIcon()}

        <div className="slide-notification-content">
          <h4 className="slide-notification-title">{title || defaultTitle()}</h4>
          <p className="slide-notification-message">{message}</p>

          {action && (
            <div className="slide-notification-actions">
              <button
                type="button"
                className="slide-notification-action-btn"
                onClick={() => {
                  action.onClick();
                  handleClose();
                }}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="slide-notification-dismiss-btn"
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default SlideNotification;
