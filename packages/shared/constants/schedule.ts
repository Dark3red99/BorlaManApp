// Fixed pickup windows — matches how collectors plan rounds; a full
// time picker isn't needed for the mock.
export const PICKUP_SLOT_HOURS = [8, 10, 12, 14, 16];

export function slotLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

// Indexed by JS Date#getDay (0 = Sunday).
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Monday-first display order for weekday pickers and calendars.
export const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];
