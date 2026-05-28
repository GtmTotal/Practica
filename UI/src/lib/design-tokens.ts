// Design System Tokens - Unified across all dashboards

export const tokens = {
  // ===== COLORS =====
  colors: {
    primary: '#1e3c72',
    'primary-light': '#2a4d8a',
    'primary-lighter': '#3a5e9a',
    'primary-dark': '#152942',
    
    success: '#10b981',
    'success-dark': '#059669',
    'success-light': '#d1fae5',
    
    danger: '#ef4444',
    'danger-light': '#fee2e2',
    'danger-dark': '#dc2626',
    
    warning: '#f59e0b',
    'warning-light': '#fef3c7',
    
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
    },
    
    background: {
      page: '#f5f5f0',
      elevated: '#ffffff',
      alt: '#ffffff',
      sidebar: '#1e3a5f',
    },
    
    accent: '#ffcc00',
  },

  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif",
    
    // Font sizes (px)
    fontSize: {
      xs: '12px',      // tiny labels
      sm: '13px',      // small text
      base: '14px',    // body
      md: '16px',      // normal
      lg: '18px',      // large
      xl: '20px',      // extra large
      '2xl': '24px',   // headings
      '3xl': '28px',   // large headings
      '4xl': '32px',   // display
    },
    
    // Font weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.5,
      loose: 1.75,
    },
  },

  // ===== SPACING =====
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },

  // ===== BORDER RADIUS =====
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // ===== SHADOWS =====
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // ===== TRANSITIONS =====
  transition: {
    fast: 'all 0.15s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },
} as const;

// ===== PRESET STYLES =====
export const presets = {
  // Buttons
  button: {
    base: {
      fontWeight: tokens.typography.fontWeight.semibold,
      fontSize: tokens.typography.fontSize.sm,
      padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
      borderRadius: tokens.radius.md,
      border: 'none',
      cursor: 'pointer',
      transition: tokens.transition.fast,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.sm,
    },
    primary: {
      background: tokens.colors.primary,
      color: '#ffffff',
      '&:hover': {
        background: tokens.colors['primary-dark'],
        boxShadow: `0 4px 12px rgba(30, 58, 95, 0.25)`,
        transform: 'translateY(-1px)',
      },
    },
    secondary: {
      background: tokens.colors.gray[100],
      color: tokens.colors.gray[800],
      border: `1px solid ${tokens.colors.gray[200]}`,
      '&:hover': {
        background: tokens.colors.gray[200],
      },
    },
    danger: {
      background: tokens.colors.danger,
      color: '#ffffff',
      '&:hover': {
        background: tokens.colors['danger-dark'],
      },
    },
    success: {
      background: tokens.colors.success,
      color: '#ffffff',
      '&:hover': {
        background: tokens.colors['success-dark'],
      },
    },
  },

  // Cards
  card: {
    base: {
      background: tokens.colors.background.elevated,
      border: `1px solid ${tokens.colors.gray[200]}`,
      borderRadius: tokens.radius.md,
      padding: tokens.spacing.lg,
      boxShadow: tokens.shadow.sm,
      transition: tokens.transition.base,
    },
    hover: {
      '&:hover': {
        boxShadow: tokens.shadow.md,
        transform: 'translateY(-2px)',
      },
    },
  },

  // Headers
  header: {
    h1: {
      fontSize: tokens.typography.fontSize['4xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.lineHeight.tight,
      margin: 0,
    },
    h2: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.lineHeight.normal,
      margin: 0,
    },
    h3: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.lineHeight.normal,
      margin: 0,
    },
  },

  // Text
  text: {
    body: {
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.gray[800],
      lineHeight: tokens.typography.lineHeight.normal,
    },
    caption: {
      fontSize: tokens.typography.fontSize.xs,
      color: tokens.colors.gray[600],
      fontWeight: tokens.typography.fontWeight.medium,
    },
    label: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.gray[700],
    },
  },

  // Badges
  badge: {
    base: {
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.semibold,
      padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
      borderRadius: tokens.radius.full,
      display: 'inline-flex',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    primary: {
      background: tokens.colors['primary-light'],
      color: '#ffffff',
    },
    success: {
      background: tokens.colors['success-light'],
      color: tokens.colors['success-dark'],
    },
    danger: {
      background: tokens.colors['danger-light'],
      color: tokens.colors['danger-dark'],
    },
    warning: {
      background: tokens.colors['warning-light'],
      color: tokens.colors.warning,
    },
    gray: {
      background: tokens.colors.gray[100],
      color: tokens.colors.gray[700],
    },
  },

  // Progress indicators
  progress: {
    base: {
      height: '4px',
      borderRadius: tokens.radius.full,
      background: tokens.colors.gray[200],
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      borderRadius: tokens.radius.full,
      transition: tokens.transition.slow,
    },
  },

  // Metrics (dashboard cards)
  metric: {
    label: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.gray[600],
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    value: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.extrabold,
      color: tokens.colors.primary,
      lineHeight: tokens.typography.lineHeight.tight,
    },
  },
};

export type DesignTokens = typeof tokens;
export type Presets = typeof presets;
