import { format, parse, isValid, addDays, endOfWeek, startOfWeek } from "date-fns";
import { DATE_FORMATS } from "./constants";

/**
 * Formats a date for display in the UI
 */
export function formatDateForDisplay(date: Date | string | undefined): string {
  if (!date) return "";
  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = parse(date, DATE_FORMATS.INPUT, new Date());
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return "";
  return format(dateObj, DATE_FORMATS.DISPLAY);
}

/**
 * Formats a date with weekday for display in the UI
 */
export function formatDateWithWeekday(date: Date | string | undefined): string {
  if (!date) return "";
  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = parse(date, DATE_FORMATS.INPUT, new Date());
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return "";
  return format(dateObj, DATE_FORMATS.DISPLAY_WITH_WEEKDAY);
}

/**
 * Formats a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return "";
  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = parse(date, DATE_FORMATS.INPUT, new Date());
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return "";
  return format(dateObj, DATE_FORMATS.INPUT);
}

/**
 * Format a date for API requests
 */
export function formatDateForAPI(date: Date | string): string {
  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = parse(date, DATE_FORMATS.INPUT, new Date());
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) throw new Error("Invalid date");
  return format(dateObj, DATE_FORMATS.API);
}

/**
 * Format a date for display in the UI (e.g. "Today at 10:45 AM" or "Yesterday at 3:20 PM" or "May 5, 2023 at 5:30 PM")
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  
  const dateToFormat = new Date(date);
  
  if (dateToFormat.getTime() >= today.getTime()) {
    return `Today at ${format(dateToFormat, "h:mm a")}`;
  } else if (dateToFormat.getTime() >= yesterday.getTime()) {
    return `Yesterday at ${format(dateToFormat, "h:mm a")}`;
  } else {
    return format(dateToFormat, "MMM d, yyyy 'at' h:mm a");
  }
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object
 */
export function parseInputDate(dateString: string): Date | null {
  if (!dateString) return null;
  const parsedDate = parse(dateString, DATE_FORMATS.INPUT, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

/**
 * Format a date as "May 12, 2023" for display
 */
export function formatDateDisplay(date: Date | string | undefined): string {
  if (!date) return "";
  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = parse(date, DATE_FORMATS.INPUT, new Date());
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return "";
  return format(dateObj, "MM/dd/yyyy");
}

/**
 * Get the end of the current week (Friday)
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  // First, get the start of the week (Sunday)
  const startOfCurrentWeek = startOfWeek(date);
  // Then add 5 days to get to Friday (0 = Sunday, 5 = Friday)
  return addDays(startOfCurrentWeek, 5);
}

/**
 * Get array of dates for the past N weeks' ending dates (Fridays)
 */
export function getPastWeekEndingDates(count: number): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const friday = getEndOfWeek(currentDate);
    dates.push(friday);
    currentDate = addDays(friday, -7); // Go back one week
  }
  
  return dates;
}

export function getPreviousFriday(date: Date = new Date()): Date {
  const lastWeek = addDays(date, -7);
  return getEndOfWeek(lastWeek);
}
