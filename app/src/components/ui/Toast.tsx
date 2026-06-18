import { useEffect } from 'react';

interface ToastData {
  msg: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, toast.duration ?? 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast">
      <div className="toast-icon">
        <svg viewBox="0 0 16 16">
          <polyline points="3 8.5 6.5 12 13 5" />
        </svg>
      </div>
      <span className="toast-msg">{toast.msg}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <svg viewBox="0 0 16 16">
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  );
}
