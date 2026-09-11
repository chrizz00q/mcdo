'use strict';

/* =========================================================
   CONSTANTS
========================================================= */
const STORAGE_KEY_SETTINGS = 'mcdopay_settings_v1';
const STORAGE_KEY_ENTRIES = 'mcdopay_entries_v1';
const STORAGE_KEY_SEEDED = 'mcdopay_seeded_v1';

const RATE_TYPE_MULTIPLIER = { normal: 1, night: 1.10 };
const MODIFIER_MULTIPLIER = { none: 1, holiday: 1.30, double: 2.0 };
const OVERTIME_MULTIPLIER = 1.25;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DEFAULT_SETTINGS = {
  hourlyRate: 75,
  theme: 'dark',
  reminderEnabled: false,
  reminderTime: '18:00',
  lastNotifiedDate: null
};

/* =========================================================
   STATE
========================================================= */
let settings = loadSettings();
let entries = loadEntries();

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0-indexed

let activeEntryDate = null;   // 'YYYY-MM-DD' currently open in the modal
let draftEntry = null;        // working copy of the entry being edited
let pendingClearDay = false;

/* =========================================================
   PERSISTENCE HELPERS
========================================================= */
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
}

/* =========================================================
   DATE HELPERS
========================================================= */
function pad2(n) { return String(n).padStart(2, '0'); }

function dateKey(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function daysInMonth(year, month) {
  // month is 0-indexed; day 0 of next month = last day of this month.
  // This correctly accounts for leap years via the JS Date engine.
  return new Date(year, month + 1, 0).getDate();
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatMoney(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatHours(hrs) {
  const value = Number.isFinite(hrs) ? hrs : 0;
  return (Math.round(value * 100) / 100).toString().replace(/\.00$/, '.0');
}

function formatLongDate(year, month, day) {
  const d = new Date(year, month, day);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday}, ${MONTH_LABELS[month]} ${day}`;
}

/* =========================================================
   ENTRY MODEL
   entries[dateKey] = {
     normalHours, extendedHours, rateType, modifier, note, status
   }
   status: 'work' | 'rest' | 'absent'
========================================================= */
function emptyEntry() {
  return { normalHours: 0, extendedHours: 0, rateType: 'normal', modifier: 'none', note: '', status: 'work' };
}

function getEntry(key) {
  return entries[key] || null;
}

function isEntryEmpty(entry) {
  if (!entry) return true;
  return entry.status === 'work' && entry.normalHours === 0 && entry.extendedHours === 0 && !entry.note;
}

function computeDailyPay(entry, hourlyRate) {
  if (!entry || entry.status !== 'work') return 0;
  const rateMult = RATE_TYPE_MULTIPLIER[entry.rateType] ?? 1;
  const modMult = MODIFIER_MULTIPLIER[entry.modifier] ?? 1;
  const normalPay = entry.normalHours * hourlyRate * rateMult * modMult;
  const extendedPay = entry.extendedHours * hourlyRate * rateMult * modMult * OVERTIME_MULTIPLIER;
  return normalPay + extendedPay;
}

function computeDailyHours(entry) {
  if (!entry || entry.status !== 'work') return 0;
  return (entry.normalHours || 0) + (entry.extendedHours || 0);
}

/* =========================================================
   SAMPLE DATA (first launch only)
========================================================= */
function seedSampleDataIfNeeded() {
  const alreadySeeded = localStorage.getItem(STORAGE_KEY_SEEDED);
  if (alreadySeeded) return;

  const y = today.getFullYear();
  const m = today.getMonth();
  const lastDay = daysInMonth(y, m);
  const sample = {};

  for (let day = 1; day <= Math.min(lastDay, today.getDate()); day++) {
    const d = new Date(y, m, day);
    const dow = d.getDay(); // 0 = Sunday, 6 = Saturday
    const key = dateKey(y, m, day);

    if (dow === 0) {
      sample[key] = { normalHours: 0, extendedHours: 0, rateType: 'normal', modifier: 'none', note: '', status: 'rest' };
    } else if (day === 6) {
      sample[key] = { normalHours: 0, extendedHours: 0, rateType: 'normal', modifier: 'none', note: 'Family emergency', status: 'absent' };
    } else if (day === 12) {
      sample[key] = { normalHours: 8, extendedHours: 0, rateType: 'normal', modifier: 'holiday', note: 'Special non-working holiday', status: 'work' };
    } else if (day === 15) {
      sample[key] = { normalHours: 8, extendedHours: 2, rateType: 'night', modifier: 'none', note: 'Covered graveyard shift', status: 'work' };
    } else if (day === 20) {
      sample[key] = { normalHours: 8, extendedHours: 4, rateType: 'normal', modifier: 'double', note: 'Client deadline', status: 'work' };
    } else {
      sample[key] = { normalHours: 8, extendedHours: 0, rateType: 'normal', modifier: 'none', note: '', status: 'work' };
    }
  }

  entries = sample;
  saveEntries();
  localStorage.setItem(STORAGE_KEY_SEEDED, '1');
}

/* =========================================================
   DOM REFERENCES
========================================================= */
const els = {
  currentMonthLabel: document.getElementById('currentMonthLabel'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  settingsBtn: document.getElementById('settingsBtn'),

  monthlyEarnings: document.getElementById('monthlyEarnings'),
  monthlyHours: document.getElementById('monthlyHours'),
  monthlyHoursSub: document.getElementById('monthlyHoursSub'),
  cutoff1Salary: document.getElementById('cutoff1Salary'),
  cutoff1Hours: document.getElementById('cutoff1Hours'),
  cutoff2Salary: document.getElementById('cutoff2Salary'),
  cutoff2Hours: document.getElementById('cutoff2Hours'),
  cutoff2Range: document.getElementById('cutoff2Range'),

  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  todayBtn: document.getElementById('todayBtn'),
  calendarGrid: document.getElementById('calendarGrid'),

  legendNormalRate: document.getElementById('legendNormalRate'),
  resetDataBtn: document.getElementById('resetDataBtn'),

  entryOverlay: document.getElementById('entryOverlay'),
  entryModal: document.getElementById('entryModal'),
  entryModalDate: document.getElementById('entryModalDate'),
  closeEntryBtn: document.getElementById('closeEntryBtn'),
  normalHoursInput: document.getElementById('normalHoursInput'),
  extendedHoursInput: document.getElementById('extendedHoursInput'),
  rateTypeGroup: document.getElementById('rateTypeGroup'),
  modifierGroup: document.getElementById('modifierGroup'),
  payPreviewValue: document.getElementById('payPreviewValue'),
  noteInput: document.getElementById('noteInput'),
  restDayBtn: document.getElementById('restDayBtn'),
  excusedBtn: document.getElementById('excusedBtn'),
  clearDayBtn: document.getElementById('clearDayBtn'),
  cancelEntryBtn: document.getElementById('cancelEntryBtn'),
  saveEntryBtn: document.getElementById('saveEntryBtn'),

  settingsOverlay: document.getElementById('settingsOverlay'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  hourlyRateInput: document.getElementById('hourlyRateInput'),
  lightThemeSwitch: document.getElementById('lightThemeSwitch'),
  reminderSwitch: document.getElementById('reminderSwitch'),
  reminderTimeInput: document.getElementById('reminderTimeInput'),
  reminderStatus: document.getElementById('reminderStatus'),
  copyCutoff1Btn: document.getElementById('copyCutoff1Btn'),
  copyCutoff2Btn: document.getElementById('copyCutoff2Btn'),

  confirmOverlay: document.getElementById('confirmOverlay'),
  confirmCancelBtn: document.getElementById('confirmCancelBtn'),
  confirmResetBtn: document.getElementById('confirmResetBtn'),

  toast: document.getElementById('toast')
};

/* =========================================================
   THEME
========================================================= */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  els.lightThemeSwitch.checked = settings.theme === 'light';
}

function toggleTheme() {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
  applyTheme();
}

/* =========================================================
   TOAST
========================================================= */
let toastTimer = null;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2400);
}

/* =========================================================
   RENDER: CALENDAR
========================================================= */
function renderCalendar() {
  els.currentMonthLabel.textContent = `${MONTH_LABELS[viewMonth]} ${viewYear}`;
  els.calendarGrid.innerHTML = '';

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);

  // Leading blanks so day 1 lands in the correct weekday column.
  for (let i = 0; i < firstDow; i++) {
    const blank = document.createElement('div');
    blank.className = 'day-cell is-empty';
    els.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day++) {
    const key = dateKey(viewYear, viewMonth, day);
    const entry = getEntry(key);
    const cell = buildDayCell(day, key, entry);
    els.calendarGrid.appendChild(cell);
  }
}

function buildDayCell(day, key, entry) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'day-cell';
  cell.dataset.date = key;
  cell.setAttribute('role', 'gridcell');
  cell.setAttribute('aria-label', formatLongDate(viewYear, viewMonth, day));

  const cellDate = new Date(viewYear, viewMonth, day);
  if (isSameDate(cellDate, today)) cell.classList.add('is-today');
  if (activeEntryDate === key) cell.classList.add('is-selected');

  if (entry) {
    if (entry.status === 'rest') cell.classList.add('is-rest');
    if (entry.status === 'absent') cell.classList.add('is-absent');
    if (entry.status === 'work') {
      if (entry.rateType === 'night') cell.classList.add('has-night');
      if (entry.modifier === 'holiday') cell.classList.add('has-holiday');
      if (entry.modifier === 'double') cell.classList.add('has-double');
    }
  }

  const num = document.createElement('span');
  num.className = 'day-cell__num';
  num.textContent = String(day);
  cell.appendChild(num);

  const badges = document.createElement('span');
  badges.className = 'day-cell__badges';
  if (entry) {
    if (entry.status === 'rest') badges.appendChild(makeBadge('Rest', 'rest'));
    if (entry.status === 'absent') badges.appendChild(makeBadge('Absent', 'absent'));
    if (entry.status === 'work') {
      if (entry.rateType === 'night') badges.appendChild(makeBadge('Night', 'night'));
      if (entry.modifier === 'holiday') badges.appendChild(makeBadge('Hol', 'holiday'));
      if (entry.modifier === 'double') badges.appendChild(makeBadge('2×', 'double'));
    }
    if (entry.note) badges.appendChild(makeBadge('Note', 'note'));
  }
  cell.appendChild(badges);

  const hoursEl = document.createElement('span');
  hoursEl.className = 'day-cell__hours';
  const hrs = computeDailyHours(entry);
  hoursEl.textContent = hrs > 0 ? `${formatHours(hrs)}h` : '';
  cell.appendChild(hoursEl);

  cell.addEventListener('click', () => openEntryModal(viewYear, viewMonth, day));
  return cell;
}

function makeBadge(text, kind) {
  const span = document.createElement('span');
  span.className = `badge badge--${kind}`;
  span.textContent = text;
  return span;
}

/* =========================================================
   RENDER: SUMMARY
========================================================= */
function renderSummary() {
  const totalDays = daysInMonth(viewYear, viewMonth);
  const hourlyRate = settings.hourlyRate;

  let monthPay = 0, monthHours = 0;
  let c1Pay = 0, c1Hours = 0;
  let c2Pay = 0, c2Hours = 0;

  for (let day = 1; day <= totalDays; day++) {
    const key = dateKey(viewYear, viewMonth, day);
    const entry = getEntry(key);
    if (!entry) continue;

    const pay = computeDailyPay(entry, hourlyRate);
    const hrs = computeDailyHours(entry);

    monthPay += pay;
    monthHours += hrs;

    if (day <= 15) { c1Pay += pay; c1Hours += hrs; }
    else { c2Pay += pay; c2Hours += hrs; }
  }

  animateValue(els.monthlyEarnings, formatMoney(monthPay));
  animateValue(els.monthlyHours, formatHours(monthHours));
  els.monthlyHoursSub.textContent = `${formatHours(monthHours)} hrs logged`;
  animateValue(els.cutoff1Salary, formatMoney(c1Pay));
  els.cutoff1Hours.textContent = `${formatHours(c1Hours)} hrs`;
  animateValue(els.cutoff2Salary, formatMoney(c2Pay));
  els.cutoff2Hours.textContent = `${formatHours(c2Hours)} hrs`;
  els.cutoff2Range.textContent = `16–${totalDays}`;
}

function animateValue(el, newText) {
  if (el.textContent === newText) return;
  el.textContent = newText;
  el.classList.remove('bump');
  // Force reflow so the animation can restart.
  void el.offsetWidth;
  el.classList.add('bump');
}

function renderLegend() {
  els.legendNormalRate.textContent = `${formatMoney(settings.hourlyRate)}/hr`;
}

function renderAll() {
  renderCalendar();
  renderSummary();
  renderLegend();
}

/* =========================================================
   OVERLAY MANAGEMENT
   Only one overlay (entry modal / settings / confirm) may be
   visible at a time. Every "open" path below closes the others
   first so overlays can never stack on top of each other.
========================================================= */
function closeAllOverlays() {
  els.entryOverlay.hidden = true;
  els.settingsOverlay.hidden = true;
  els.confirmOverlay.hidden = true;
  activeEntryDate = null;
  draftEntry = null;
  pendingClearDay = false;
}

/* =========================================================
   ENTRY MODAL
========================================================= */
function openEntryModal(year, month, day) {
  closeAllOverlays();
  const key = dateKey(year, month, day);
  activeEntryDate = key;
  const existing = getEntry(key);
  draftEntry = existing ? { ...existing } : emptyEntry();
  pendingClearDay = false;

  els.entryModalDate.textContent = formatLongDate(year, month, day);
  els.normalHoursInput.value = draftEntry.normalHours;
  els.extendedHoursInput.value = draftEntry.extendedHours;
  els.noteInput.value = draftEntry.note || '';
  setActiveSegment(els.rateTypeGroup, 'rate', draftEntry.rateType);
  setActiveSegment(els.modifierGroup, 'modifier', draftEntry.modifier);
  updateQuickLabelStates();
  updatePayPreview();

  els.entryOverlay.hidden = false;
  renderCalendar(); // reflect selection highlight
  els.normalHoursInput.focus({ preventScroll: true });
}

function closeEntryModal() {
  els.entryOverlay.hidden = true;
  activeEntryDate = null;
  draftEntry = null;
  renderCalendar();
}

function setActiveSegment(groupEl, attr, value) {
  groupEl.querySelectorAll('.segmented__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset[attr] === value);
  });
}

function updateQuickLabelStates() {
  els.restDayBtn.classList.toggle('is-active', draftEntry.status === 'rest');
  els.excusedBtn.classList.toggle('is-active', draftEntry.status === 'absent');
}

function updatePayPreview() {
  const pay = computeDailyPay(draftEntry, settings.hourlyRate);
  els.payPreviewValue.textContent = formatMoney(pay);
}

function readHoursInputsIntoDraft() {
  const n = parseFloat(els.normalHoursInput.value);
  const e = parseFloat(els.extendedHoursInput.value);
  draftEntry.normalHours = Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 0;
  draftEntry.extendedHours = Number.isFinite(e) && e > 0 ? Math.min(e, 24) : 0;
}

els.normalHoursInput.addEventListener('input', () => {
  if (!draftEntry) return;
  if (draftEntry.status !== 'work') draftEntry.status = 'work';
  readHoursInputsIntoDraft();
  updateQuickLabelStates();
  updatePayPreview();
});
els.extendedHoursInput.addEventListener('input', () => {
  if (!draftEntry) return;
  if (draftEntry.status !== 'work') draftEntry.status = 'work';
  readHoursInputsIntoDraft();
  updateQuickLabelStates();
  updatePayPreview();
});

els.rateTypeGroup.addEventListener('click', (evt) => {
  const btn = evt.target.closest('.segmented__btn');
  if (!btn || !draftEntry) return;
  draftEntry.rateType = btn.dataset.rate;
  setActiveSegment(els.rateTypeGroup, 'rate', draftEntry.rateType);
  updatePayPreview();
});

els.modifierGroup.addEventListener('click', (evt) => {
  const btn = evt.target.closest('.segmented__btn');
  if (!btn || !draftEntry) return;
  draftEntry.modifier = btn.dataset.modifier;
  setActiveSegment(els.modifierGroup, 'modifier', draftEntry.modifier);
  updatePayPreview();
});

els.noteInput.addEventListener('input', () => {
  if (!draftEntry) return;
  draftEntry.note = els.noteInput.value;
});

els.restDayBtn.addEventListener('click', () => {
  if (!draftEntry) return;
  draftEntry.status = draftEntry.status === 'rest' ? 'work' : 'rest';
  draftEntry.normalHours = 0;
  draftEntry.extendedHours = 0;
  els.normalHoursInput.value = 0;
  els.extendedHoursInput.value = 0;
  updateQuickLabelStates();
  updatePayPreview();
});

els.excusedBtn.addEventListener('click', () => {
  if (!draftEntry) return;
  draftEntry.status = draftEntry.status === 'absent' ? 'work' : 'absent';
  draftEntry.normalHours = 0;
  draftEntry.extendedHours = 0;
  els.normalHoursInput.value = 0;
  els.extendedHoursInput.value = 0;
  updateQuickLabelStates();
  updatePayPreview();
});

els.clearDayBtn.addEventListener('click', () => {
  pendingClearDay = true;
  draftEntry = emptyEntry();
  els.normalHoursInput.value = 0;
  els.extendedHoursInput.value = 0;
  els.noteInput.value = '';
  setActiveSegment(els.rateTypeGroup, 'rate', 'normal');
  setActiveSegment(els.modifierGroup, 'modifier', 'none');
  updateQuickLabelStates();
  updatePayPreview();
  showToast('Day cleared — press Save to confirm');
});

els.saveEntryBtn.addEventListener('click', () => {
  if (!activeEntryDate || !draftEntry) return;

  if (pendingClearDay || isEntryEmpty(draftEntry)) {
    delete entries[activeEntryDate];
  } else {
    entries[activeEntryDate] = { ...draftEntry };
  }
  saveEntries();
  closeEntryModal();
  renderSummary();
  renderCalendar();
  showToast('Entry saved');
});

els.cancelEntryBtn.addEventListener('click', closeEntryModal);
els.closeEntryBtn.addEventListener('click', closeEntryModal);
els.entryOverlay.addEventListener('click', (evt) => {
  if (evt.target === els.entryOverlay) closeEntryModal();
});

/* =========================================================
   MONTH NAVIGATION
========================================================= */
function goToPrevMonth() {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderAll();
}
function goToNextMonth() {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderAll();
}
function goToToday() {
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  renderAll();
}

els.prevMonthBtn.addEventListener('click', goToPrevMonth);
els.nextMonthBtn.addEventListener('click', goToNextMonth);
els.todayBtn.addEventListener('click', goToToday);

/* =========================================================
   SETTINGS PANEL
========================================================= */
function openSettings() {
  closeAllOverlays();
  els.hourlyRateInput.value = settings.hourlyRate;
  els.lightThemeSwitch.checked = settings.theme === 'light';
  els.reminderSwitch.checked = settings.reminderEnabled;
  els.reminderTimeInput.value = settings.reminderTime;
  updateReminderStatusText();
  els.settingsOverlay.hidden = false;
}
function closeSettings() {
  els.settingsOverlay.hidden = true;
}

els.settingsBtn.addEventListener('click', openSettings);
els.closeSettingsBtn.addEventListener('click', closeSettings);
els.settingsOverlay.addEventListener('click', (evt) => {
  if (evt.target === els.settingsOverlay) closeSettings();
});

els.hourlyRateInput.addEventListener('change', () => {
  const val = parseFloat(els.hourlyRateInput.value);
  settings.hourlyRate = Number.isFinite(val) && val >= 0 ? val : 0;
  els.hourlyRateInput.value = settings.hourlyRate;
  saveSettings();
  renderSummary();
  renderLegend();
});

els.lightThemeSwitch.addEventListener('change', () => {
  settings.theme = els.lightThemeSwitch.checked ? 'light' : 'dark';
  saveSettings();
  applyTheme();
});

els.themeToggleBtn.addEventListener('click', toggleTheme);

/* =========================================================
   REMINDERS
========================================================= */
function updateReminderStatusText() {
  if (!('Notification' in window)) {
    els.reminderStatus.textContent = 'Notifications are not supported in this browser.';
    return;
  }
  if (!settings.reminderEnabled) {
    els.reminderStatus.textContent = 'Notifications are off.';
  } else if (Notification.permission === 'granted') {
    els.reminderStatus.textContent = `You'll be reminded daily at ${settings.reminderTime}.`;
  } else if (Notification.permission === 'denied') {
    els.reminderStatus.textContent = 'Notifications are blocked in your browser settings.';
  } else {
    els.reminderStatus.textContent = 'Permission needed — enable below.';
  }
}

els.reminderSwitch.addEventListener('change', async () => {
  if (els.reminderSwitch.checked) {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser');
      els.reminderSwitch.checked = false;
      return;
    }
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      showToast('Notification permission was not granted');
      els.reminderSwitch.checked = false;
      settings.reminderEnabled = false;
    } else {
      settings.reminderEnabled = true;
    }
  } else {
    settings.reminderEnabled = false;
  }
  saveSettings();
  updateReminderStatusText();
});

els.reminderTimeInput.addEventListener('change', () => {
  settings.reminderTime = els.reminderTimeInput.value || '18:00';
  saveSettings();
  updateReminderStatusText();
});

function checkReminderTick() {
  if (!settings.reminderEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const nowKey = `${hh}:${mm}`;
  const todayStr = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  if (nowKey === settings.reminderTime && settings.lastNotifiedDate !== todayStr) {
    try {
      new Notification('Mcdopay reminder', {
        body: "Don't forget to log today's work hours.",
        tag: 'mcdopay-daily-reminder'
      });
    } catch (e) { /* notification construction can fail silently on some platforms */ }
    settings.lastNotifiedDate = todayStr;
    saveSettings();
  }
}
setInterval(checkReminderTick, 30 * 1000);

/* =========================================================
   COPY CUTOFF LOGS
========================================================= */
function buildCutoffLog(startDay, endDay) {
  const lines = [];
  const hourlyRate = settings.hourlyRate;
  let totalPay = 0, totalHours = 0;

  lines.push(`MCDOPAY — ${MONTH_LABELS[viewMonth]} ${viewYear} (days ${startDay}–${endDay})`);
  lines.push('-'.repeat(42));

  for (let day = startDay; day <= endDay; day++) {
    const key = dateKey(viewYear, viewMonth, day);
    const entry = getEntry(key);
    const label = formatLongDate(viewYear, viewMonth, day);

    if (!entry) {
      lines.push(`${label}: no entry`);
      continue;
    }
    if (entry.status === 'rest') {
      lines.push(`${label}: Rest day`);
      continue;
    }
    if (entry.status === 'absent') {
      lines.push(`${label}: Excused absence${entry.note ? ' — ' + entry.note : ''}`);
      continue;
    }

    const pay = computeDailyPay(entry, hourlyRate);
    const hrs = computeDailyHours(entry);
    totalPay += pay;
    totalHours += hrs;

    const tags = [];
    if (entry.rateType === 'night') tags.push('Night diff.');
    if (entry.modifier === 'holiday') tags.push('Holiday');
    if (entry.modifier === 'double') tags.push('Double pay');
    const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
    const noteStr = entry.note ? ` — note: ${entry.note}` : '';

    lines.push(`${label}: ${formatHours(hrs)}h${tagStr} → ${formatMoney(pay)}${noteStr}`);
  }

  lines.push('-'.repeat(42));
  lines.push(`Total hours: ${formatHours(totalHours)}`);
  lines.push(`Total pay: ${formatMoney(totalPay)}`);

  return lines.join('\n');
}

async function copyCutoffLog(startDay, endDay) {
  const text = buildCutoffLog(startDay, endDay);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Cutoff log copied to clipboard');
  } catch (e) {
    showToast('Could not copy — clipboard access denied');
  }
}

els.copyCutoff1Btn.addEventListener('click', () => copyCutoffLog(1, 15));
els.copyCutoff2Btn.addEventListener('click', () => copyCutoffLog(16, daysInMonth(viewYear, viewMonth)));

/* =========================================================
   RESET ALL DATA
========================================================= */
function openConfirmReset() {
  els.entryOverlay.hidden = true;
  els.settingsOverlay.hidden = true;
  els.confirmOverlay.hidden = false;
}
function closeConfirmReset() { els.confirmOverlay.hidden = true; }

els.resetDataBtn.addEventListener('click', openConfirmReset);
els.confirmCancelBtn.addEventListener('click', closeConfirmReset);
els.confirmOverlay.addEventListener('click', (evt) => {
  if (evt.target === els.confirmOverlay) closeConfirmReset();
});

els.confirmResetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY_ENTRIES);
  localStorage.removeItem(STORAGE_KEY_SETTINGS);
  localStorage.removeItem(STORAGE_KEY_SEEDED);
  entries = {};
  settings = { ...DEFAULT_SETTINGS };
  saveSettings();
  applyTheme();
  closeAllOverlays();
  goToToday();
  showToast('All data has been reset');
});

/* =========================================================
   KEYBOARD SUPPORT
========================================================= */
document.addEventListener('keydown', (evt) => {
  if (evt.key !== 'Escape') return;
  if (!els.entryOverlay.hidden) closeEntryModal();
  else if (!els.settingsOverlay.hidden) closeSettings();
  else if (!els.confirmOverlay.hidden) closeConfirmReset();
});

/* =========================================================
   INIT
========================================================= */
function init() {
  closeAllOverlays();
  seedSampleDataIfNeeded();
  applyTheme();
  renderAll();
}

init();

// If the browser restores this page from its back/forward cache, the DOM
// can come back exactly as it was left (including open overlays). Force a
// clean, single-overlay state whenever that happens.
window.addEventListener('pageshow', () => {
  closeAllOverlays();
});