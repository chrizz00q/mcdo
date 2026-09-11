import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-panel"
        style={{ maxWidth: 380 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-body" style={{ paddingTop: 'var(--space-5)' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: danger
                ? 'color-mix(in srgb, var(--status-double) 18%, transparent)'
                : 'color-mix(in srgb, var(--accent) 18%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: danger ? 'var(--status-double)' : 'var(--accent)',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h3 id="confirm-title">{title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
