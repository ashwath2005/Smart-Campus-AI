/**
 * Global Application Constants
 */
export const APP_CONFIG = {
  NAME: 'Smart Campus AI',
  TAGLINE: 'Autonomous Academic & Operations Platform',
  VERSION: '1.0.0',
  DEFAULT_TIMEOUT_MS: 30000,
  STORAGE_KEYS: {
    USER: 'campus_user',
    THEME: 'campus_theme',
    SIDEBAR_COLLAPSED: 'campus_sidebar_collapsed',
  },
  THEMES: {
    DARK: 'dark',
    LIGHT: 'light',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
};

export default APP_CONFIG;
