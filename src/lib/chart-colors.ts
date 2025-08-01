import { softColors, chartColors } from './design-tokens';

/**
 * Sistema de cores suaves e modernas para dashboards financeiros
 * Baseado nos Design Tokens modernos para máxima harmonia visual
 */

// 🎨 PALETA PRINCIPAL - Cores suaves e elegantes (usando design tokens)
export const SOFT_COLORS = {
  // Azuis - Para receitas e positivos
  primary: softColors.accent[500],        
  primaryLight: softColors.accent[300],   
  primaryDark: softColors.accent[700],    
  
  // Verdes - Para lucros e crescimento
  success: softColors.success[500],       
  successLight: softColors.success[300],  
  successDark: softColors.success[700],   
  
  // Laranjas - Para alertas e neutros
  warning: softColors.warning[400],      
  warningLight: softColors.warning[200], 
  warningDark: softColors.warning[600],  
  
  // Vermelhos - Para perdas e negativos
  danger: softColors.danger[400],          
  dangerLight: softColors.danger[200],     
  dangerDark: softColors.danger[600],      
  
  // Roxos - Para análises e insights
  insight: softColors.primary[400],      
  insightLight: softColors.primary[200], 
  insightDark: softColors.primary[600],  
  
  // Cianos - Para dados e informações
  info: softColors.accent[400],           
  infoLight: softColors.accent[200],      
  infoDark: softColors.accent[600],       
};

// 📊 PALETAS SIMPLIFICADAS PARA GRÁFICOS

/** Paleta SIMPLIFICADA para gráficos financeiros (apenas 3 cores principais) */
export const SIMPLE_FINANCIAL_PALETTE = [
  SOFT_COLORS.success,      // Verde - Positivo/Receitas
  SOFT_COLORS.danger,       // Vermelho - Negativo/Despesas  
  SOFT_COLORS.primary,      // Azul - Neutro/Saldo
];

/** Paleta MUITO SIMPLES para categorias (4 cores harmoniosas) */
export const SIMPLE_CATEGORY_PALETTE = [
  SOFT_COLORS.primary,      // Azul principal
  SOFT_COLORS.success,      // Verde suave
  SOFT_COLORS.warning,      // Laranja suave
  SOFT_COLORS.info,         // Ciano suave
];

/** Paleta para gráficos financeiros (receitas/despesas) - VERSÃO COMPLETA */
export const FINANCIAL_PALETTE = [
  SOFT_COLORS.success,      // Verde - Receitas
  SOFT_COLORS.danger,       // Vermelho - Despesas
  SOFT_COLORS.primary,      // Azul - Resultado
  SOFT_COLORS.warning,      // Laranja - Provisões
  SOFT_COLORS.info,         // Ciano - Investimentos
  SOFT_COLORS.insight,      // Roxo - Outros
];

/** Paleta para categorias (mais variada) - usando chartColors */
export const CATEGORY_PALETTE = chartColors.series;

/** Paleta para fluxo de caixa (3 categorias principais) */
export const CASH_FLOW_PALETTE = [
  softColors.success[500],     // Créditos (entradas)
  softColors.danger[400],      // Débitos (saídas)
  softColors.accent[500],      // Saldo operacional
];

/** Paleta para performance (comparações) */
export const PERFORMANCE_PALETTE = [
  softColors.accent[500],      // Portfólio
  softColors.success[500],     // Benchmark positivo
  softColors.warning[500],     // Benchmark médio
  softColors.danger[400],      // Benchmark negativo
];

/** Paleta para fornecedores/clientes */
export const SUPPLIER_CLIENT_PALETTE = [
  softColors.accent[400],      // Fornecedores
  softColors.primary[400],     // Clientes
  softColors.success[400],     // Parceiros
  softColors.warning[400],     // Outros
];

// 🎨 CONFIGURAÇÕES DE GRADIENTES SUAVES
export const GRADIENTS = {
  primary: chartColors.gradients.accent,
  success: chartColors.gradients.success,
  warning: chartColors.gradients.neutral,
  danger: chartColors.gradients.danger,
  insight: chartColors.gradients.neutral,
  info: chartColors.gradients.accent,
};

// 🔧 CONFIGURAÇÕES PADRÃO PARA GRÁFICOS RECHARTS
export const DEFAULT_CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  animationDuration: 750,
  animationEasing: 'ease-out',
  fontSize: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  gridStroke: '#f0f0f0',
  axisStroke: '#d9d9d9',
  tooltipStyle: {
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    fontSize: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  legendStyle: {
    fontSize: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
};

// 🌈 FUNÇÃO PARA GERAR CORES AUTOMÁTICAS
export const getColorByIndex = (index: number, palette = CATEGORY_PALETTE): string => {
  return palette[index % palette.length];
};

// 💡 FUNÇÃO PARA CORES BASEADAS EM VALOR (positivo/negativo)
export const getColorByValue = (value: number): string => {
  if (value > 0) return SOFT_COLORS.success;
  if (value < 0) return SOFT_COLORS.danger;
  return SOFT_COLORS.primary;
};

// 📈 FUNÇÃO PARA CORES DE PERFORMANCE
export const getPerformanceColor = (value: number, benchmark: number): string => {
  const ratio = value / benchmark;
  if (ratio >= 1.1) return SOFT_COLORS.success;    // +10% ou mais
  if (ratio >= 0.9) return SOFT_COLORS.primary;    // Entre -10% e +10%
  return SOFT_COLORS.warning;                       // Abaixo de -10%
};