export type RateType = 'normal' | 'night';

export type PayModifier = 'none' | 'holiday' | 'double';

export type QuickLabel = 'restday' | 'excused' | null;

export interface DayEntry {
  date: string; // yyyy-MM-dd
  normalHours: number;
  overtimeHours: number;
  rateType: RateType;
  modifier: PayModifier;
  notes: string;
  quickLabel: QuickLabel;
}

export type EntryMap = Record<string, DayEntry>;

export type ThemeMode = 'dark' | 'light';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
}

export interface AppSettings {
  appName: string;
  hourlyRate: number;
  theme: ThemeMode;
  reminder: ReminderSettings;
}

export interface DayComputation {
  hours: number;
  pay: number;
  rateMultiplier: number;
  state: DayState;
}

export type DayState =
  | 'empty'
  | 'normal'
  | 'night'
  | 'holiday'
  | 'double'
  | 'restday'
  | 'excused';

export interface CutoffSummary {
  label: string;
  startDay: number;
  endDay: number;
  totalHours: number;
  totalPay: number;
  daysWorked: number;
}

export interface MonthSummary {
  totalHours: number;
  totalPay: number;
  daysWorked: number;
  firstCutoff: CutoffSummary;
  secondCutoff: CutoffSummary;
}
