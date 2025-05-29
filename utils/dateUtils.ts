/**
 * Gets the current date in local timezone as YYYY-MM-DD string
 * @param date Optional date to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string to a Date object in local timezone
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Note: month is 0-indexed in JavaScript Date
  return new Date(year, month - 1, day);
}
