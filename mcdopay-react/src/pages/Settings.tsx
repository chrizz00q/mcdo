import { format } from 'date-fns';
import { Bell, Clipboard, Info, Moon, Palette, Sun, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { ReminderModal } from '../components/ReminderModal';
import { SettingsSection } from '../components/SettingsSection';
import { Toast } from '../components/Toast';
import { useAppData } from '../context/AppDataContext';
import { RATE_LEGEND } from '../utils/rates';
import { buildCutoffLog, computeMonthSummary, formatCurrency } from '../utils/calculations';

const APP_VERSION = '1.0.0';

export function Settings() {
  const { settings, updateSettings, entries } = useAppData();
  const [rateInput, setRateInput] = useState(String(settings.hourlyRate));
  const [rateError, setRateError] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const monthDate = new Date();
  const summary = useMemo(
    () => computeMonthSummary(entries, monthDate, settings.hourlyRate),
    [entries, settings.hourlyRate],
  );

  const commitRate = () => {
    const value = Number(rateInput);
    if (rateInput.trim() === '' || Number.isNaN(value)) {
      setRateError('Enter a valid number.');
      return;
    }
    if (value <= 0) {
      setRateError('Hourly rate must be greater than zero.');
      return;
    }
    if (value > 100000) {
      setRateError('That rate looks too high — double-check the value.');
      return;
    }
    setRateError(null);
    updateSettings({ hourlyRate: Math.round(value * 100) / 100 });
    setToast('Hourly rate updated.');
  };

  const handleCopy = async (which: 'first' | 'second') => {
    const cutoff = which === 'first' ? summary.firstCutoff : summary.secondCutoff;
    const log = buildCutoffLog(entries, monthDate, cutoff, settings.hourlyRate, settings.appName);
    try {
      await navigator.clipboard.writeText(log);
      setToast(`${cutoff.label} log copied to clipboard.`);
    } catch {
      setToast('Could not access clipboard. Try copying manually.');
    }
  };

  return (
    <div className="app-shell">
      <Header subtitle="Settings" />

      <div className="settings-page">
        <SettingsSection icon={Palette} title="Appearance" description="Choose how Mcdopay looks on this device.">
          <div className="settings-row">
            <div>
              <div className="settings-row__label">Theme</div>
              <div className="settings-row__sublabel">Dark cosmic or light mode</div>
            </div>
            <div className="segmented" style={{ width: 180 }}>
              <button
                type="button"
                className="segmented__option"
                data-active={settings.theme === 'dark'}
                onClick={() => updateSettings({ theme: 'dark' })}
              >
                <Moon size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Dark
              </button>
              <button
                type="button"
                className="segmented__option"
                data-active={settings.theme === 'light'}
                onClick={() => updateSettings({ theme: 'light' })}
              >
                <Sun size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Light
              </button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={Wallet} title="Hourly rate" description="Your base rate is used to compute every entry's pay.">
          <div className="field-row">
            <div className="field">
              <label htmlFor="app-name">App name</label>
              <input
                id="app-name"
                className="input"
                value={settings.appName}
                onChange={(e) => updateSettings({ appName: e.target.value || 'Mcdopay' })}
                maxLength={30}
              />
            </div>
            <div className="field">
              <label htmlFor="hourly-rate">Base hourly rate (₱)</label>
              <input
                id="hourly-rate"
                className={`input tabular${rateError ? ' input--invalid' : ''}`}
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                onBlur={commitRate}
              />
            </div>
          </div>
          {rateError && <p className="field__error">{rateError}</p>}

          <div>
            <div className="settings-row__label" style={{ marginBottom: 8 }}>
              Rate breakdown preview
            </div>
            <div className="rate-preview-grid">
              {RATE_LEGEND.map((rate) => (
                <div className="rate-preview-item" key={rate.key}>
                  <span className="rate-preview-item__label">
                    <span className={`status-dot status-dot--${rate.key}`} />
                    {rate.label}
                  </span>
                  <span className="rate-preview-item__value tabular">
                    {formatCurrency(settings.hourlyRate * rate.multiplier)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={Clipboard} title="Copy cutoff logs" description="Copy a formatted attendance log for payroll submission.">
          <div className="cutoff-log-picker">
            <button type="button" className="btn btn--secondary" onClick={() => handleCopy('first')}>
              <Clipboard size={15} />
              Copy {summary.firstCutoff.label}
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => handleCopy('second')}>
              <Clipboard size={15} />
              Copy {summary.secondCutoff.label}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Bell} title="Daily reminder" description="Get nudged to log your hours before the day ends.">
          <div className="settings-row">
            <div>
              <div className="settings-row__label">
                {settings.reminder.enabled ? `Reminder set for ${settings.reminder.time}` : 'No reminder set'}
              </div>
              <div className="settings-row__sublabel">
                {settings.reminder.enabled ? 'Enabled' : 'Disabled'} · requires this tab to stay open
              </div>
            </div>
            <button type="button" className="btn btn--secondary" onClick={() => setShowReminderModal(true)}>
              Configure
            </button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Info} title="About">
          <div className="about-grid">
            <div className="about-row">
              <span className="about-row__label">App name</span>
              <span className="about-row__value">{settings.appName}</span>
            </div>
            <div className="about-row">
              <span className="about-row__label">Version</span>
              <span className="about-row__value">{APP_VERSION}</span>
            </div>
            <div className="about-row">
              <span className="about-row__label">Developer</span>
              <span className="about-row__value">Christian</span>
            </div>
            <div className="about-row">
              <span className="about-row__label">Data storage</span>
              <span className="about-row__value">Local device only</span>
            </div>
            <div className="about-row">
              <span className="about-row__label">Today</span>
              <span className="about-row__value">{format(new Date(), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </SettingsSection>
      </div>

      {showReminderModal && (
        <ReminderModal
          reminder={settings.reminder}
          onClose={() => setShowReminderModal(false)}
          onSave={(reminder) => {
            updateSettings({ reminder });
            setToast(reminder.enabled ? 'Daily reminder enabled.' : 'Daily reminder disabled.');
          }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
