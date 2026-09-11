import { format } from 'date-fns';
import { CalendarOff, Eraser, Moon, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DayEntry, PayModifier, QuickLabel, RateType } from '../types';
import { dateKey, emptyEntry, entryPay, formatCurrency } from '../utils/calculations';

interface EntryModalProps {
  date: Date;
  entry: DayEntry | undefined;
  hourlyRate: number;
  onClose: () => void;
  onSave: (entry: DayEntry) => void;
  onClear: (dateKey: string) => void;
}

export function EntryModal({ date, entry, hourlyRate, onClose, onSave, onClear }: EntryModalProps) {
  const key = dateKey(date);
  const [draft, setDraft] = useState<DayEntry>(() => entry ?? emptyEntry(key));
  const [hoursError, setHoursError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(entry ?? emptyEntry(key));
    setHoursError(null);
  }, [entry, key]);

  const previewPay = useMemo(() => entryPay(draft, hourlyRate), [draft, hourlyRate]);

  const validate = (next: DayEntry): string | null => {
    if (next.normalHours < 0 || next.overtimeHours < 0) return 'Hours cannot be negative.';
    if (next.normalHours > 24 || next.overtimeHours > 24) return 'A single entry can\u2019t exceed 24 hours.';
    if (next.normalHours + next.overtimeHours > 24) return 'Total hours in a day can\u2019t exceed 24.';
    return null;
  };

  const updateHours = (field: 'normalHours' | 'overtimeHours', raw: string) => {
    const value = raw === '' ? 0 : Number(raw);
    const next = { ...draft, [field]: Number.isNaN(value) ? 0 : value, quickLabel: null as QuickLabel };
    setDraft(next);
    setHoursError(validate(next));
  };

  const setRateType = (rateType: RateType) => setDraft((prev) => ({ ...prev, rateType }));
  const setModifier = (modifier: PayModifier) => setDraft((prev) => ({ ...prev, modifier }));

  const applyQuickLabel = (label: QuickLabel) => {
    setDraft((prev) => ({
      ...prev,
      quickLabel: prev.quickLabel === label ? null : label,
      normalHours: 0,
      overtimeHours: 0,
    }));
    setHoursError(null);
  };

  const handleClearDay = () => {
    onClear(key);
    onClose();
  };

  const handleSave = () => {
    const error = validate(draft);
    if (error) {
      setHoursError(error);
      return;
    }
    onSave({ ...draft, date: key });
    onClose();
  };

  const hasAnyData =
    draft.normalHours > 0 || draft.overtimeHours > 0 || draft.quickLabel !== null || draft.notes.trim() !== '';

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 id="entry-modal-title">Log hours</h3>
            <p className="modal-header__date">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="quick-label-row" role="group" aria-label="Quick labels">
            <button
              type="button"
              className="pill-toggle"
              data-active={draft.quickLabel === 'restday'}
              onClick={() => applyQuickLabel('restday')}
            >
              <span className="status-dot status-dot--restday" /> Rest Day
            </button>
            <button
              type="button"
              className="pill-toggle"
              data-active={draft.quickLabel === 'excused'}
              onClick={() => applyQuickLabel('excused')}
            >
              <CalendarOff size={14} /> Excused Absence
            </button>
            <button
              type="button"
              className="pill-toggle"
              onClick={handleClearDay}
              disabled={!hasAnyData}
              title="Clear all data for this day"
            >
              <Eraser size={14} /> Clear Day
            </button>
          </div>

          {draft.quickLabel === null && (
            <>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="normal-hours">Normal hours</label>
                  <input
                    id="normal-hours"
                    className={`input tabular${hoursError ? ' input--invalid' : ''}`}
                    type="number"
                    min={0}
                    max={24}
                    step={0.25}
                    inputMode="decimal"
                    value={draft.normalHours === 0 ? '' : draft.normalHours}
                    placeholder="0"
                    onChange={(e) => updateHours('normalHours', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ot-hours">Overtime / extended hours</label>
                  <input
                    id="ot-hours"
                    className={`input tabular${hoursError ? ' input--invalid' : ''}`}
                    type="number"
                    min={0}
                    max={24}
                    step={0.25}
                    inputMode="decimal"
                    value={draft.overtimeHours === 0 ? '' : draft.overtimeHours}
                    placeholder="0"
                    onChange={(e) => updateHours('overtimeHours', e.target.value)}
                  />
                </div>
              </div>
              {hoursError && <p className="field__error">{hoursError}</p>}

              <div className="field">
                <label>Rate type</label>
                <div className="segmented" role="radiogroup" aria-label="Rate type">
                  <button
                    type="button"
                    className="segmented__option"
                    data-active={draft.rateType === 'normal'}
                    role="radio"
                    aria-checked={draft.rateType === 'normal'}
                    onClick={() => setRateType('normal')}
                  >
                    <Sun size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    Normal
                  </button>
                  <button
                    type="button"
                    className="segmented__option"
                    data-active={draft.rateType === 'night'}
                    role="radio"
                    aria-checked={draft.rateType === 'night'}
                    onClick={() => setRateType('night')}
                  >
                    <Moon size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    Night Diff (+10%)
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Pay modifier</label>
                <div className="segmented" role="radiogroup" aria-label="Pay modifier">
                  <button
                    type="button"
                    className="segmented__option"
                    data-active={draft.modifier === 'none'}
                    role="radio"
                    aria-checked={draft.modifier === 'none'}
                    onClick={() => setModifier('none')}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    className="segmented__option"
                    data-active={draft.modifier === 'holiday'}
                    role="radio"
                    aria-checked={draft.modifier === 'holiday'}
                    onClick={() => setModifier('holiday')}
                  >
                    Holiday (+30%)
                  </button>
                  <button
                    type="button"
                    className="segmented__option"
                    data-active={draft.modifier === 'double'}
                    role="radio"
                    aria-checked={draft.modifier === 'double'}
                    onClick={() => setModifier('double')}
                  >
                    Double (×2)
                  </button>
                </div>
              </div>

              <div className="pay-preview">
                <span className="pay-preview__label">Estimated pay for this day</span>
                <span className="pay-preview__value tabular">{formatCurrency(previewPay)}</span>
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="notes">Attendance notes</label>
            <textarea
              id="notes"
              className="textarea"
              placeholder="e.g. covered closing shift, tardy 10 mins..."
              value={draft.notes}
              onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
              maxLength={280}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!!hoursError}>
            Save entry
          </button>
        </div>
      </div>
    </div>
  );
}
