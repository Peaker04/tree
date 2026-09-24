export const TASK_DEADLINE_TIMES = ['08:00', '10:00', '12:00', '14:00', '17:00'] as const;
export const CALENDAR_WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

export const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameLocalDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const createDefaultTaskDeadline = (now = new Date()) => {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(17, 0, 0, 0);
  return date;
};

export const createCalendarCells = (month: Date) => {
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
};

export const isTaskDeadlineDateSelectable = (date: Date, now = new Date()) =>
  startOfLocalDay(date) > startOfLocalDay(now);

export const formatTaskDeadline = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
