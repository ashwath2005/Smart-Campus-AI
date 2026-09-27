/**
 * Text and Number Formatting Utilities
 */

export function capitalize(str = '') {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatPercentage(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Number(val).toFixed(decimals)}%`;
}

export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function truncateText(text = '', maxLength = 50, ellipsis = '...') {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}${ellipsis}`;
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
