import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface DialogOptions {
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  placeholder?: string;
}

interface DialogContextType {
  showAlert: (message: ReactNode, options?: DialogOptions) => Promise<void>;
  showConfirm: (message: ReactNode, options?: DialogOptions) => Promise<boolean>;
  showPrompt: (message: ReactNode, options?: DialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogState {
  isOpen: boolean;
  isConfirm: boolean;
  isPrompt: boolean;
  message: ReactNode;
  options: DialogOptions;
  resolve: (value: any) => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const showAlert = (message: ReactNode, options?: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        isConfirm: false,
        isPrompt: false,
        message,
        options: options || {},
        resolve: () => resolve()
      });
    });
  };

  const showConfirm = (message: ReactNode, options?: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        isConfirm: true,
        isPrompt: false,
        message,
        options: options || {},
        resolve
      });
    });
  };

  const showPrompt = (message: ReactNode, options?: DialogOptions): Promise<string | null> => {
    setPromptValue(options?.defaultValue || '');
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        isConfirm: false,
        isPrompt: true,
        message,
        options: options || {},
        resolve
      });
    });
  };

  const handleClose = (value: any) => {
    if (dialog) {
      if (dialog.isPrompt && value === true) {
        dialog.resolve(promptValue);
      } else if (dialog.isPrompt && value === false) {
        dialog.resolve(null);
      } else {
        dialog.resolve(value);
      }
      setDialog(null);
    }
  };

  const renderIcon = () => {
    const type = dialog?.options.type || 'info';
    switch (type) {
      case 'success':
        return <CheckCircle2 size={26} style={{ color: '#10B981' }} />;
      case 'danger':
        return <XCircle size={26} style={{ color: '#EF4444' }} />;
      case 'warning':
        return <AlertTriangle size={26} style={{ color: '#F59E0B' }} />;
      default:
        return <Info size={26} style={{ color: '#000080' }} />;
    }
  };

  const getAccentGradient = () => {
    const type = dialog?.options.type || 'info';
    switch (type) {
      case 'success':
        return 'linear-gradient(90deg, #10B981 0%, #059669 100%)';
      case 'danger':
        return 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
      case 'warning':
        return 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)';
      default:
        return 'linear-gradient(90deg, #000080 0%, #3B82F6 100%)';
    }
  };

  const getIconBadgeBg = () => {
    const type = dialog?.options.type || 'info';
    switch (type) {
      case 'success':
        return '#ECFDF5';
      case 'danger':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      default:
        return '#EFF6FF';
    }
  };

  const getPrimaryButtonBg = () => {
    const type = dialog?.options.type || 'info';
    switch (type) {
      case 'success':
        return '#10B981';
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#000080';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {dialog?.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(8px)', padding: '1.25rem', boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '18px',
            maxWidth: '480px', width: '100%', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 128, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            overflow: 'hidden', position: 'relative', animation: 'slideUp 0.2s ease-out'
          }}>
            {/* Top Color Accent Line */}
            <div style={{ height: '5px', background: getAccentGradient(), width: '100%' }} />

            <div style={{ padding: '1.75rem 1.75rem 1.5rem 1.75rem', position: 'relative' }}>
              {/* Close Button */}
              <button 
                onClick={() => handleClose(false)}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  border: 'none', background: '#F8FAFC', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = '#0F172A';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.color = '#64748B';
                }}
                title="Close"
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ 
                  background: getIconBadgeBg(), 
                  padding: '12px', borderRadius: '14px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {renderIcon()}
                </div>

                <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 800 }}>
                    {dialog.options.title || (dialog.isConfirm ? 'Confirm Action' : dialog.isPrompt ? 'Input Required' : 'Notice')}
                  </h3>
                  <div style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.94rem' }}>
                    {dialog.message}
                  </div>
                </div>
              </div>

              {dialog.isPrompt && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder={dialog.options.placeholder || "Enter value..."}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      color: '#0F172A'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#000080';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 128, 0.12)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleClose(true);
                      if (e.key === 'Escape') handleClose(false);
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                {(dialog.isConfirm || dialog.isPrompt) && (
                  <button 
                    onClick={() => handleClose(false)}
                    style={{
                      padding: '0.65rem 1.4rem', borderRadius: '10px', border: '1px solid #CBD5E1',
                      background: '#ffffff', color: '#475569', fontWeight: '600', fontSize: '0.9rem',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#94A3B8';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                  >
                    {dialog.options.cancelText || 'Cancel'}
                  </button>
                )}
                <button 
                  onClick={() => handleClose(true)}
                  style={{
                    padding: '0.65rem 1.6rem', borderRadius: '10px', border: 'none',
                    background: getPrimaryButtonBg(),
                    color: '#ffffff', fontWeight: '700', fontSize: '0.9rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  {dialog.options.confirmText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
