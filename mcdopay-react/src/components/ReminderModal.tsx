import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import type { ReminderSettings } from '../types';

interface ReminderModalProps {
  reminder: ReminderSettings;
  onClose: () => void;
  onSave: (reminder: ReminderSettings) => void;
}

export function ReminderModal({ reminder, onClose, onSave }: ReminderModalProps) {
  const [draft, setDraft] = useState<ReminderSettings>(reminder);
  const [notice, setNotice] = useState<string | null>(null);

  const handleToggle = async () => {
    const next = !draft.enabled;
    if (next && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setNotice('Notifications are blocked in your browser. The reminder will still be saved, but you may not receive an alert.');
        }
      } catch {
        // ignore — environments without Notification support
      }
    }
    setDraft((prev) => ({ ...prev, enabled: next }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: 400 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 id="reminder-title">
              <Bell size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Daily reminder
            </h3>
            <p className="modal-header__date">Get nudged to log your hours each day</p>
          </div>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="legend-row" style={{ borderBottom: 'none', padding: 0 }}>
            <div className="legend-row__label">
              <span>Enable daily reminder</span>
            </div>
            <button
              type="button"
              className="switch"
              data-on={draft.enabled}
              role="switch"
              aria-checked={draft.enabled}
              aria-label="Enable daily reminder"
              onClick={handleToggle}
            >
              <span className="switch__thumb" />
            </button>
          </div>

          <div className="field">
            <label htmlFor="reminder-time">Reminder time</label>
            <input
              id="reminder-time"
              type="time"
              className="input"
              value={draft.time}
              disabled={!draft.enabled}
              onChange={(e) => setDraft((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          {notice && <p className="field__error">{notice}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Save reminder
          </button>
        </div>
      </div>
    </div>
  );
}
