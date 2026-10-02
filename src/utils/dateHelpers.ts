/**
 * Helper utilities for DayFlow date and time manipulations.
 */

// Format date object to YYYY-MM-DD
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's ISO date string
export function getTodayISODate(): string {
  return toISODateString(new Date());
}

// Format ISO date (e.g. "2026-09-29") into "Tuesday, Sep 29, 2026"
export function formatFullDate(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format ISO date into "September 29, 2026"
export function formatMonthDayYear(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format 24-hr time "16:00" to "4:00 PM"
export function formatTimeTo12Hr(time24: string): string {
  if (!time24) return '12:00 PM';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

// Format 12-hr time "4:00 PM" to "16:00" for input[type="time"]
export function formatTimeTo24Hr(time12: string): string {
  if (!time12) return '12:00';
  if (!time12.includes('AM') && !time12.includes('PM')) return time12;
  const parts = time12.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  const ampm = parts[1] || 'AM';

  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

// Check if given date string is today
export function isDateToday(isoString: string): boolean {
  return isoString === getTodayISODate();
}

// Check if given date string is in the future
export function isDateUpcoming(isoString: string): boolean {
  return isoString > getTodayISODate();
}

// Check if given date is within the current week (Sunday - Saturday)
export function isDateThisWeek(isoString: string): boolean {
  if (!isoString) return false;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [y, m, d] = isoString.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return target >= startOfWeek && target <= endOfWeek;
}

// Generate calendar cells (including previous/next month days) for 7x5 or 7x6 grid
export interface CalendarDayCell {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getCalendarGridForMonth(year: number, monthIndex: number): CalendarDayCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarDayCell[] = [];
  const todayStr = getTodayISODate();

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, monthIndex - 1, dayNum);
    const dateStr = toISODateString(prevDate);
    cells.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const currentDate = new Date(year, monthIndex, dayNum);
    const dateStr = toISODateString(currentDate);
    cells.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month leading days to complete the 35 or 42 grid cells
  const remainingCells = (cells.length <= 35 ? 35 : 42) - cells.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextDate = new Date(year, monthIndex + 1, dayNum);
    const dateStr = toISODateString(nextDate);
    cells.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  return cells;
}

// Format ISO date into friendly short format "Sep 29" for buttons and headers
export function formatFriendlyMonthDay(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Format date into human-friendly relative or date representation (e.g. "Today", "Tomorrow", "Oct 14")
export function formatFriendlyTaskDate(isoString: string): string {
  if (!isoString) return '';
  const todayStr = getTodayISODate();
  if (isoString === todayStr) return 'Today';

  const [y, m, d] = isoString.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (toISODateString(tomorrow) === isoString) return 'Tomorrow';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (toISODateString(yesterday) === isoString) return 'Yesterday';

  const sameYear = targetDate.getFullYear() === now.getFullYear();
  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

// Return 7 days for the week containing the specified date (Sunday to Saturday)
export interface CalendarWeekDay {
  dateString: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  isSelected: boolean;
}

export function getWeekDaysForDate(isoString: string, selectedDateStr?: string): CalendarWeekDay[] {
  const [y, m, d] = (isoString || getTodayISODate()).split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay(); // 0 = Sun

  const sunday = new Date(current);
  sunday.setDate(current.getDate() - dayOfWeek);

  const todayStr = getTodayISODate();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(sunday);
    dayDate.setDate(sunday.getDate() + i);
    const dateStr = toISODateString(dayDate);

    return {
      dateString: dateStr,
      dayNumber: dayDate.getDate(),
      dayName: dayLabels[i],
      isToday: dateStr === todayStr,
      isSelected: dateStr === (selectedDateStr || isoString),
    };
  });
}

// Return dynamic, context-aware calendar insight based on real tasks on selected date
export function getCalendarContextualInsight(
  total: number,
  completed: number,
  isToday: boolean,
  friendlyDate: string
): string {
  const remaining = total - completed;

  if (total === 0) {
    return isToday
      ? 'Your calendar is open today.'
      : `Your calendar is open for ${friendlyDate}.`;
  }

  if (remaining === 0) {
    return isToday
      ? 'Everything scheduled for today is complete.'
      : `Everything scheduled for ${friendlyDate} is complete.`;
  }

  if (remaining === 1 && total > 1) {
    return "You're almost done — 1 task remaining.";
  }

  if (completed > 0 && completed >= total / 2) {
    return `Solid progress — ${completed} of ${total} tasks done.`;
  }

  return isToday
    ? `You have ${total} task${total === 1 ? '' : 's'} planned today.`
    : `You have ${total} task${total === 1 ? '' : 's'} planned for ${friendlyDate}.`;
}


