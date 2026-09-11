import {
  endOfMonth,
  format,
  getDate,
} from 'date-fns';
import type {
  CutoffSummary,
  DayEntry,
  DayState,
  EntryMap,
  MonthSummary,
} from '../types';
import { combinedMultiplier } from './rates';

export function dateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function emptyEntry(dateStr: string): DayEntry {
  return {
    date: dateStr,
    normalHours: 0,
    overtimeHours: 0,
    rateType: 'normal',
    modifier: 'none',
    notes: '',
    quickLabel: null,
  };
}

/** Total hours logged for a single entry. */
export function entryHours(entry: DayEntry | undefined): number {
  if (!entry) return 0;
  return (entry.normalHours || 0) + (entry.overtimeHours || 0);
}

/** Pay for a single entry given the current base hourly rate. */
export function entryPay(entry: DayEntry | undefined, hourlyRate: number): number {
  if (!entry) return 0;
  if (entry.quickLabel === 'restday' || entry.quickLabel === 'excused') {
    // Quick labels represent no worked hours by default; any manually
    // entered hours on top are still paid at the selected rate.
  }
  const hours = entryHours(entry);
  if (hours <= 0) return 0;
  const multiplier = combinedMultiplier(entry.rateType, entry.modifier);
  return hours * hourlyRate * multiplier;
}

/** Determines what color/state a calendar cell should render as. */
export function dayState(entry: DayEntry | undefined): DayState {
  if (!entry) return 'empty';
  if (entry.quickLabel === 'restday') return 'restday';
  if (entry.quickLabel === 'excused') return 'excused';
  const hours = entryHours(entry);
  if (hours <= 0) return 'empty';
  if (entry.modifier === 'double') return 'double';
  if (entry.modifier === 'holiday') return 'holiday';
  if (entry.rateType === 'night') return 'night';
  return 'normal';
}

function summarizeRange(
  entries: EntryMap,
  monthDate: Date,
  startDay: number,
  endDay: number,
  label: string,
  hourlyRate: number,
): CutoffSummary {
  let totalHours = 0;
  let totalPay = 0;
  let daysWorked = 0;

  Object.values(entries).forEach((entry) => {
    const entryDate = new Date(entry.date + 'T00:00:00');
    if (
      entryDate.getFullYear() !== monthDate.getFullYear() ||
      entryDate.getMonth() !== monthDate.getMonth()
    ) {
      return;
    }
    const day = getDate(entryDate);
    if (day < startDay || day > endDay) return;
    const hours = entryHours(entry);
    if (hours > 0) {
      totalHours += hours;
      totalPay += entryPay(entry, hourlyRate);
      daysWorked += 1;
    }
  });

  return { label, startDay, endDay, totalHours, totalPay, daysWorked };
}

export function computeMonthSummary(
  entries: EntryMap,
  monthDate: Date,
  hourlyRate: number,
): MonthSummary {
  const lastDay = getDate(endOfMonth(monthDate));
  const firstCutoff = summarizeRange(entries, monthDate, 1, 15, '1st Cutoff (1–15)', hourlyRate);
  const secondCutoff = summarizeRange(
    entries,
    monthDate,
    16,
    lastDay,
    `2nd Cutoff (16–${lastDay})`,
    hourlyRate,
  );

  return {
    totalHours: firstCutoff.totalHours + secondCutoff.totalHours,
    totalPay: firstCutoff.totalPay + secondCutoff.totalPay,
    daysWorked: firstCutoff.daysWorked + secondCutoff.daysWorked,
    firstCutoff,
    secondCutoff,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded}`;
}

export function buildCutoffLog(
  entries: EntryMap,
  monthDate: Date,
  cutoff: CutoffSummary,
  hourlyRate: number,
  appName: string,
): string {
  const rows: string[] = [];
  const monthLabel = format(monthDate, 'MMMM yyyy');
  rows.push(`${appName} — ${monthLabel} — ${cutoff.label}`);
  rows.push('-'.repeat(48));

  const dayEntries = Object.values(entries)
    .filter((entry) => {
      const d = new Date(entry.date + 'T00:00:00');
      if (d.getFullYear() !== monthDate.getFullYear() || d.getMonth() !== monthDate.getMonth()) {
        return false;
      }
      const day = getDate(d);
      return day >= cutoff.startDay && day <= cutoff.endDay;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (dayEntries.length === 0) {
    rows.push('No entries logged for this period.');
  } else {
    dayEntries.forEach((entry) => {
      const d = new Date(entry.date + 'T00:00:00');
      const dateLabel = format(d, 'EEE, MMM d');
      const hours = entryHours(entry);
      if (entry.quickLabel === 'restday') {
        rows.push(`${dateLabel} — Rest Day`);
        return;
      }
      if (entry.quickLabel === 'excused') {
        rows.push(`${dateLabel} — Excused Absence`);
        return;
      }
      if (hours <= 0) return;
      const pay = entryPay(entry, hourlyRate);
      const tags = [
        entry.rateType === 'night' ? 'Night Diff' : 'Normal',
        entry.modifier !== 'none' ? (entry.modifier === 'holiday' ? 'Holiday' : 'Double Pay') : null,
      ].filter(Boolean);
      rows.push(
        `${dateLabel} — ${formatHours(hours)}h (${tags.join(', ')}) — ${formatCurrency(pay)}${
          entry.notes ? `  [${entry.notes}]` : ''
        }`,
      );
    });
  }

  rows.push('-'.repeat(48));
  rows.push(`Total Hours: ${formatHours(cutoff.totalHours)}`);
  rows.push(`Total Pay: ${formatCurrency(cutoff.totalPay)}`);

  return rows.join('\n');
}
