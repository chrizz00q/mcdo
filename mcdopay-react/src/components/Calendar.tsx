import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import type { EntryMap } from '../types';
import { dateKey, dayState, entryHours, formatHours } from '../utils/calculations';

interface CalendarProps {
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  entries: EntryMap;
  onSelectDay: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ monthDate, onMonthChange, entries, onSelectDay }: CalendarProps) {
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate));
    const end = endOfWeek(endOfMonth(monthDate));
    const cells: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      cells.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return cells;
  }, [monthDate]);

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <div className="calendar__nav-buttons">
          <button
            type="button"
            className="icon-toggle"
            aria-label="Previous month"
            onClick={() => onMonthChange(subMonths(monthDate, 1))}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="calendar__month-label">{format(monthDate, 'MMMM yyyy')}</div>
        <div className="calendar__nav-buttons">
          <button
            type="button"
            className="icon-toggle"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(monthDate, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      <div className="calendar__grid" role="grid" aria-label={format(monthDate, 'MMMM yyyy')}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthDate);
          const key = dateKey(day);
          const entry = entries[key];
          const state = dayState(entry);
          const hours = entryHours(entry);
          const isToday = isSameDay(day, today);

          const classNames = [
            'calendar__cell',
            !inMonth ? 'calendar__cell--outside' : '',
            state !== 'empty' ? `calendar__cell--${state}` : '',
            isToday ? 'calendar__cell--today' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={key}
              type="button"
              className={classNames}
              onClick={() => inMonth && onSelectDay(day)}
              disabled={!inMonth}
              aria-label={`${format(day, 'MMMM d, yyyy')}${hours ? `, ${formatHours(hours)} hours logged` : ''}`}
              role="gridcell"
            >
              <span className="calendar__date">{format(day, 'd')}</span>
              <span className="calendar__cell-footer">
                {hours > 0 && <span className="calendar__hours tabular">{formatHours(hours)}h</span>}
                {state !== 'empty' && <span className={`status-dot status-dot--${state}`} aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
