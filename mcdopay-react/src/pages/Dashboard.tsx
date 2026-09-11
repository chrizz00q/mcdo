import { format } from 'date-fns';
import { CalendarDays, Clock, RotateCcw, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Calendar } from '../components/Calendar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntryModal } from '../components/EntryModal';
import { Header } from '../components/Header';
import { RateLegend } from '../components/RateLegend';
import { SummaryCard } from '../components/SummaryCard';
import { Toast } from '../components/Toast';
import { useAppData } from '../context/AppDataContext';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { computeMonthSummary, dateKey, formatCurrency, formatHours } from '../utils/calculations';

export function Dashboard() {
  const { entries, saveEntry, removeEntry, settings, resetAllData } = useAppData();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useDailyReminder(settings.reminder, settings.appName);

  const summary = useMemo(
    () => computeMonthSummary(entries, monthDate, settings.hourlyRate),
    [entries, monthDate, settings.hourlyRate],
  );

  const selectedEntry = selectedDay ? entries[dateKey(selectedDay)] : undefined;

  const handleReset = () => {
    resetAllData();
    setConfirmReset(false);
    setToast('All data has been reset.');
  };

  return (
    <div className="app-shell">
      <Header subtitle={`${format(monthDate, 'MMMM yyyy')} · payroll overview`} />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="summary-grid">
            <SummaryCard
              icon={Wallet}
              label="Monthly earnings"
              value={formatCurrency(summary.totalPay)}
              meta={`${summary.daysWorked} day${summary.daysWorked === 1 ? '' : 's'} logged`}
              accent="accent"
            />
            <SummaryCard
              icon={Clock}
              label="Total hours"
              value={`${formatHours(summary.totalHours)}h`}
              meta={`Base rate ${formatCurrency(settings.hourlyRate)}/hr`}
            />
            <SummaryCard
              icon={CalendarDays}
              label="Days worked"
              value={`${summary.daysWorked}`}
              meta={format(monthDate, 'MMMM yyyy')}
            />
          </div>

          <div className="card">
            <Calendar
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              entries={entries}
              onSelectDay={setSelectedDay}
            />
          </div>

          <div className="cutoff-grid">
            <div className="card card--tight">
              <div className="section-heading">
                <h2>{summary.firstCutoff.label}</h2>
              </div>
              <div className="summary-card__value tabular" style={{ fontSize: '1.25rem' }}>
                {formatCurrency(summary.firstCutoff.totalPay)}
              </div>
              <div className="summary-card__label">{formatHours(summary.firstCutoff.totalHours)}h logged</div>
            </div>
            <div className="card card--tight">
              <div className="section-heading">
                <h2>{summary.secondCutoff.label}</h2>
              </div>
              <div className="summary-card__value tabular" style={{ fontSize: '1.25rem' }}>
                {formatCurrency(summary.secondCutoff.totalPay)}
              </div>
              <div className="summary-card__label">{formatHours(summary.secondCutoff.totalHours)}h logged</div>
            </div>
          </div>
        </div>

        <div className="dashboard-side">
          <RateLegend hourlyRate={settings.hourlyRate} />

          <div className="card card--tight">
            <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} />
              Reset all data
            </button>
          </div>
        </div>
      </div>

      {selectedDay && (
        <EntryModal
          date={selectedDay}
          entry={selectedEntry}
          hourlyRate={settings.hourlyRate}
          onClose={() => setSelectedDay(null)}
          onSave={saveEntry}
          onClear={removeEntry}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset all data?"
          message="This permanently deletes every logged entry, your hourly rate, theme, and reminder settings from this device. This cannot be undone."
          confirmLabel="Reset everything"
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
