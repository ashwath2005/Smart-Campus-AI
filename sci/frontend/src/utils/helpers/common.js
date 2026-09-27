/**
 * Common Helper Functions
 */

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function debounce(fn, waitMs = 300) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, waitMs);
  };
}

export function throttle(fn, limitMs = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

export function safeJsonParse(jsonString, fallback = null) {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}
