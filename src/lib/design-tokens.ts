/**
 * Sistema de Design Tokens Moderno
 * Paleta soft e atrativa inspirada no Ant Design Pro + Tailwind CSS v4
 * 
 * Características:
 * - Cores suaves com baixa saturação
 * - Contraste acessível (WCAG AA)
 * - Consistência visual
 * - Hierarquia clara
 */

// ===== PALETA DE CORES SOFT =====

export const softColors = {
  // Primária - Slate (Profissional e suave)
  primary: {
    50: '#f8fafc',
    100: '#f1f5f9', 
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },

  // Receitas - Emerald (Verde suave)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b'
  },

  // Despesas - Rose (Vermelho suave) 
  danger: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',  
    700: '#be185d',
    800: '#9d174d',
    900: '#831843'
  },

  // Neutros - Gray (Base clean)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5', 
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },

  // Acentos - Blue (Ações e interatividade)
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },

  // Warning - Amber (Alertas suaves)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  }
} as const;

// ===== TOKENS SEMÂNTICOS =====

export const semanticTokens = {
  // Backgrounds
  background: {
    primary: softColors.neutral[50],
    secondary: softColors.neutral[100],
    tertiary: softColors.neutral[200],
    elevated: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.5)'
  },

  // Surfaces (Cards, containers)
  surface: {
    primary: '#ffffff',
    secondary: softColors.neutral[50],
    tertiary: softColors.neutral[100],
    accent: softColors.primary[50],
    success: softColors.success[50],
    danger: softColors.danger[50],
    warning: softColors.warning[50]
  },

  // Borders
  border: {
    primary: softColors.neutral[200],
    secondary: softColors.neutral[300],
    accent: softColors.primary[200],
    success: softColors.success[200],
    danger: softColors.danger[200],
    warning: softColors.warning[200]
  },

  // Text
  text: {
    primary: softColors.neutral[900],
    secondary: softColors.neutral[600],
    tertiary: softColors.neutral[500],
    placeholder: softColors.neutral[400],
    inverse: '#ffffff',
    accent: softColors.accent[600],
    success: softColors.success[700],
    danger: softColors.danger[600],
    warning: softColors.warning[700]
  }
} as const;

// ===== SISTEMA DE SPACING =====

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px  
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
  '4xl': '4rem',    // 64px
  '5xl': '6rem',    // 96px
} as const;

// ===== SHADOW SYSTEM =====

export const shadows = {
  none: 'none',
  soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  elevated: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
} as const;

// ===== TYPOGRAPHY SCALE =====

export const typography = {
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px  
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500', 
    semibold: '600',
    bold: '700'
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625'
  }
} as const;

// ===== CHART COLORS (Paleta específica para gráficos) =====

export const chartColors = {
  // Sequência harmônica para gráficos múltiplos
  series: [
    softColors.accent[500],   // Azul principal
    softColors.success[500],  // Verde
    softColors.warning[500],  // Âmbar
    softColors.danger[400],   // Rosa
    softColors.primary[500],  // Slate
    softColors.accent[300],   // Azul claro
    softColors.success[300],  // Verde claro
    softColors.warning[300],  // Âmbar claro
  ],

  // Contextuais para métricas financeiras
  financial: {
    receita: softColors.success[500],
    despesa: softColors.danger[400], 
    lucro: softColors.accent[600],
    perda: softColors.danger[600],
    neutral: softColors.neutral[400],
    crescimento: softColors.success[400],
    queda: softColors.danger[400]
  },

  // Gradientes suaves
  gradients: {
    success: `linear-gradient(135deg, ${softColors.success[400]} 0%, ${softColors.success[600]} 100%)`,
    danger: `linear-gradient(135deg, ${softColors.danger[300]} 0%, ${softColors.danger[500]} 100%)`,
    accent: `linear-gradient(135deg, ${softColors.accent[400]} 0%, ${softColors.accent[600]} 100%)`,
    neutral: `linear-gradient(135deg, ${softColors.neutral[200]} 0%, ${softColors.neutral[400]} 100%)`
  }
} as const;

// ===== UTILITÁRIOS =====

/**
 * Gera variações de opacidade para uma cor
 */
export const withOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

/**
 * Retorna cor baseada no contexto semântico
 */
export const getSemanticColor = (
  type: 'success' | 'danger' | 'warning' | 'accent' | 'neutral',
  variant: '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' = '500'
) => {
  return softColors[type][variant];
};

/**
 * Retorna cor para gráficos baseada no índice
 */
export const getChartColor = (index: number) => {
  return chartColors.series[index % chartColors.series.length];
};