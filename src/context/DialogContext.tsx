import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface DialogOptions {
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showAlert: (message: ReactNode, options?: DialogOptions) => Promise<void>;
  showConfirm: (message: ReactNode, options?: DialogOptions) => Promise<boolean>;
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
  message: ReactNode;
  options: DialogOptions;
  resolve: (value: boolean | any) => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const showAlert = (message: ReactNode, options?: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        isConfirm: false,
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
        message,
        options: options || {},
        resolve
      });
    });
  };

  const handleClose = (value: boolean) => {
    if (dialog) {
      dialog.resolve(value);
      setDialog(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {dialog?.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                background: dialog.options.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                            dialog.options.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                            dialog.options.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                            'rgba(59, 130, 246, 0.1)', 
                padding: '12px', borderRadius: '50%' 
              }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {dialog.options.type === 'danger' ? '⚠️' :
                   dialog.options.type === 'warning' ? '⚡' :
                   dialog.options.type === 'success' ? '✅' :
                   'ℹ️'}
                </span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>
                {dialog.options.title || (dialog.isConfirm ? 'Confirm Action' : 'Notice')}
              </h3>
            </div>
            
            <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '1rem' }}>
              {dialog.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {dialog.isConfirm && (
                <button 
                  onClick={() => handleClose(false)}
                  style={{
                    padding: '0.5rem 1.5rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                >
                  {dialog.options.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                onClick={() => handleClose(true)}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none',
                  background: dialog.options.type === 'danger' ? '#ef4444' : '#2563eb', 
                  color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: dialog.options.type === 'danger' ? '0 4px 6px -1px rgba(239, 68, 68, 0.2)' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
                onMouseOver={e => e.currentTarget.style.background = dialog.options.type === 'danger' ? '#dc2626' : '#1d4ed8'}
                onMouseOut={e => e.currentTarget.style.background = dialog.options.type === 'danger' ? '#ef4444' : '#2563eb'}
              >
                {dialog.options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
