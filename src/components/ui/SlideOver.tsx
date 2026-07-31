import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import './SlideOver.css';

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  closeOnOverlayClick = true,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Handle CSS enter/leave animations gracefully by delaying DOM unmounting
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden'; // Lock background scroll
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setShouldRender(false), 300); // Matches CSS transition
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender && !isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div 
      className={`slideover-overlay ${isOpen ? 'open' : ''}`} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={`slideover-container slideover-${width}`}>
        <div className="slideover-header">
          <div className="slideover-title-group">
            {title && <h3 className="slideover-title">{title}</h3>}
            {subtitle && <p className="slideover-subtitle">{subtitle}</p>}
          </div>
          <button 
            type="button" 
            className="slideover-close-btn" 
            onClick={onClose}
            aria-label="Close slide panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="slideover-body">
          {children}
        </div>

        {footer && (
          <div className="slideover-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SlideOver;
