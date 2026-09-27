/**
 * Date and Time Utilities
 */
import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns';

export function formatDate(date, formatPattern = 'dd MMM yyyy') {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? format(parsed, formatPattern) : '-';
  } catch {
    return '-';
  }
}

export function formatTime(date, formatPattern = 'hh:mm a') {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? format(parsed, formatPattern) : '-';
  } catch {
    return '-';
  }
}

export function formatRelativeTime(date) {
  if (!date) return '';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true }) : '';
  } catch {
    return '';
  }
}
