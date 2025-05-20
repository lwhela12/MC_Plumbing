// Application constants

// Payroll status options
export const PAYROLL_STATUS = {
  DRAFT: "draft",
  FINALIZED: "finalized"
} as const;

// Markup multiplier for calculating adjusted costs
export const COST_MARKUP_MULTIPLIER = 1.25;

// Default commission rate for new plumbers
export const DEFAULT_COMMISSION_RATE = 30;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM d, yyyy",
  DISPLAY_WITH_WEEKDAY: "EEE, MMM d, yyyy",
  INPUT: "yyyy-MM-dd",
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
} as const;

// Report types
export const REPORT_TYPES = {
  WEEKLY_SUMMARY: "weekly-summary",
  PLUMBER_DETAIL: "plumber-detail",
  PAYROLL_HISTORY: "payroll-history"
} as const;

// Table page sizes
export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

// UI theme colors
export const THEME_COLORS = {
  PRIMARY: {
    LIGHT: "#42a5f5",
    DEFAULT: "#1976d2",
    DARK: "#1565c0"
  },
  SECONDARY: {
    LIGHT: "#4caf50",
    DEFAULT: "#2e7d32",
    DARK: "#1b5e20"
  },
  NEUTRAL: {
    LIGHT: "#f5f5f5",
    DEFAULT: "#e0e0e0",
    DARK: "#757575",
    DARKER: "#424242"
  },
  ERROR: {
    LIGHT: "#ef5350",
    DEFAULT: "#d32f2f",
    DARK: "#c62828"
  },
  WARNING: {
    LIGHT: "#ff9800",
    DEFAULT: "#ed6c02",
    DARK: "#e65100"
  }
} as const;
