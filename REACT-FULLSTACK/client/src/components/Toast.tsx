import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <AlertCircle size={18} />}
          {t.type === 'info' && <Info size={18} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              padding: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
