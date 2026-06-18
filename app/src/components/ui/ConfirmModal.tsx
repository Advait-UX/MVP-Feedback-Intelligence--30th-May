import { X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="ly-modal-backdrop" onClick={onCancel}>
      <div
        className="ly-modal"
        style={{ width: 400 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="ly-modal-head">
          <span className="ly-modal-title" id="confirm-modal-title">{title}</span>
          <button className="ly-modal-close" aria-label="Close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <div
          style={{
            padding: 'var(--space-5) var(--space-6)',
            font: '400 14px/24px var(--font-sans)',
            color: 'var(--color-fg-secondary)',
          }}
        >
          {body}
        </div>
        <div className="ly-modal-foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn destructive" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
