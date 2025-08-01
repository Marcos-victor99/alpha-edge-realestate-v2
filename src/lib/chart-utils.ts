import { Color } from '@tremor/react';
import { formatarMoeda, formatarMoedaCompacta, formatarPorcentagem, formatarData } from './formatters';

// Tipos para dados de gráficos
export interface BaseChartData {
  [key: string]: unknown;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface HierarchicalData {
  name: string;
  value: number;
  children?: HierarchicalData[];
  parent?: string;
  level?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkNode {
  id: string;
  label: string;
  value?: number;
  group?: string;
  color?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  value?: number;
  label?: string;
}

export interface DrilldownData extends BaseChartData {
  drilldownId?: string;
  parentId?: string;
  level?: number;
  hasChildren?: boolean;
}

// Paleta de cores otimizada para dashboards financeiros
export const FINANCIAL_COLORS: Color[] = [
  'blue',      // Receitas/Positivo
  'emerald',   // Lucro/Crescimento
  'rose',      // Despesas/Negativo
  'amber',     // Atenção/Neutro
  'violet',    // Secundário
  'cyan',      // Informativo
  'slate',     // Neutro
  'orange',    // Destaque
  'teal',      // Alternativo
  'indigo'     // Especial
];

// Cores semânticas para indicadores financeiros
export const SEMANTIC_COLORS = {
  positive: 'emerald' as Color,
  negative: 'rose' as Color,
  neutral: 'slate' as Color,
  warning: 'amber' as Color,
  info: 'blue' as Color,
  success: 'emerald' as Color,
  error: 'rose' as Color
} as const;

// Utilidades para transformação de dados

/**
 * Agrupa dados por uma chave específica
 */
export function groupByKey<T extends BaseChartData>(
  data: T[],
  key: keyof T,
  aggregateKey?: keyof T
): Array<{ name: string; value: number; data: T[] }> {
  const groups = data.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  return Object.entries(groups).map(([name, items]) => ({
    name,
    value: aggregateKey 
      ? items.reduce((sum, item) => sum + (Number(item[aggregateKey]) || 0), 0)
      : items.length,
    data: items
  }));
}

/**
 * Converte dados planos para estrutura hierárquica
 */
export function buildHierarchy<T extends BaseChartData>(
  data: T[],
  keyPath: string[],
  valueKey: keyof T
): HierarchicalData[] {
  // Validações de entrada
  if (!data || !Array.isArray(data)) {
    console.warn('buildHierarchy: dados inválidos ou vazios', { data, keyPath, valueKey });
    return [];
  }
  
  if (!keyPath || !Array.isArray(keyPath) || keyPath.length === 0) {
    console.warn('buildHierarchy: keyPath inválido', { keyPath });
    return [];
  }
  
  if (!valueKey) {
    console.warn('buildHierarchy: valueKey inválido', { valueKey });
    return [];
  }

  const hierarchy: Record<string, HierarchicalData> = {};

  data.forEach(item => {
    // Validar se o item existe e tem as propriedades necessárias
    if (!item || typeof item !== 'object') {
      console.warn('buildHierarchy: item inválido encontrado', { item });
      return;
    }

    let currentPath = '';
    let currentLevel = hierarchy;

    keyPath.forEach((key, index) => {
      // Validação adicional da chave
      if (!key || typeof key !== 'string') {
        console.warn('buildHierarchy: chave inválida encontrada', { key, index, keyPath });
        return;
      }
      
      const keyValue = String(item[key] || 'N/A');
      currentPath += (currentPath ? '.' : '') + keyValue;

      if (!currentLevel[currentPath]) {
        currentLevel[currentPath] = {
          name: keyValue,
          value: 0,
          children: [],
          level: index,
          parent: index > 0 ? currentPath.split('.').slice(0, -1).join('.') : undefined
        };
      }

      currentLevel[currentPath].value += Number(item[valueKey]) || 0;

      if (index < keyPath.length - 1) {
        currentLevel = currentLevel[currentPath].children!.reduce((acc, child) => {
          acc[currentPath + '.' + child.name] = child;
          return acc;
        }, {} as Record<string, HierarchicalData>);
      }
    });
  });

  return Object.values(hierarchy).filter(item => item.level === 0);
}

/**
 * Converte dados para formato Sankey
 */
export function buildSankeyData(
  data: BaseChartData[],
  sourceKey: string,
  targetKey: string,
  valueKey: string
): { nodes: string[]; links: Array<{ source: string; target: string; value: number }> } {
  const nodes = new Set<string>();
  const links: Array<{ source: string; target: string; value: number }> = [];

  data.forEach(item => {
    const source = String(item[sourceKey]);
    const target = String(item[targetKey]);
    const value = Number(item[valueKey]) || 0;

    nodes.add(source);
    nodes.add(target);

    const existingLink = links.find(link => 
      link.source === source && link.target === target
    );

    if (existingLink) {
      existingLink.value += value;
    } else {
      links.push({ source, target, value });
    }
  });

  return {
    nodes: Array.from(nodes),
    links
  };
}

/**
 * Gera série temporal com intervalos regulares
 */
export function generateTimeSeries(
  data: BaseChartData[],
  dateKey: string,
  valueKey: string,
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'
): TimeSeriesData[] {
  const grouped = groupByTimeInterval(data, dateKey, interval);
  
  return Object.entries(grouped)
    .map(([date, items]) => ({
      date,
      value: items.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Agrupa dados por intervalo de tempo
 */
function groupByTimeInterval(
  data: BaseChartData[],
  dateKey: string,
  interval: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Record<string, BaseChartData[]> {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateKey]);
    let key: string;

    switch (interval) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarter': {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      }
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, BaseChartData[]>);
}

/**
 * Calcula estatísticas básicas de um dataset
 */
export function calculateStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  return {
    sum,
    mean,
    median: sorted[Math.floor(sorted.length / 2)],
    min: Math.min(...values),
    max: Math.max(...values),
    range: Math.max(...values) - Math.min(...values),
    stdDev: Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    ),
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)]
  };
}

/**
 * Detecta outliers usando método IQR
 */
export function detectOutliers(values: number[], factor = 1.5) {
  const stats = calculateStatistics(values);
  const iqr = stats.q3 - stats.q1;
  const lowerBound = stats.q1 - factor * iqr;
  const upperBound = stats.q3 + factor * iqr;

  return {
    outliers: values.filter(v => v < lowerBound || v > upperBound),
    lowerBound,
    upperBound,
    cleanValues: values.filter(v => v >= lowerBound && v <= upperBound)
  };
}

/**
 * Formatadores específicos para diferentes tipos de gráfico
 */
export const chartFormatters = {
  currency: (value: number) => formatarMoedaCompacta(value),
  currencyFull: (value: number) => formatarMoeda(value),
  percentage: (value: number) => formatarPorcentagem(value),
  number: (value: number) => value.toLocaleString('pt-BR'),
  date: (value: string) => formatarData(value, 'MMM yyyy'),
  dateFull: (value: string) => formatarData(value),
  decimal: (value: number, decimals = 1) => value.toFixed(decimals),
  compact: (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(value);
  }
};

/**
 * Gera configuração de cores baseada no tipo de dados
 */
export function generateColorScheme(
  dataType: 'financial' | 'categorical' | 'sequential' | 'diverging',
  count: number
): Color[] {
  switch (dataType) {
    case 'financial':
      return FINANCIAL_COLORS.slice(0, count);
    
    case 'categorical': {
      // Distribuir cores uniformemente
      const step = Math.floor(FINANCIAL_COLORS.length / count);
      return Array.from({ length: count }, (_, i) => 
        FINANCIAL_COLORS[i * step % FINANCIAL_COLORS.length]
      );
    }
    
    case 'sequential':
      // Gradiente de azul
      return Array.from({ length: count }, () => 'blue');
    
    case 'diverging':
      // Verde para positivo, vermelho para negativo
      return count === 2 ? ['rose', 'emerald'] : 
             Array.from({ length: count }, (_, i) => 
               i < count / 2 ? 'rose' : 'emerald'
             );
    
    default:
      return FINANCIAL_COLORS.slice(0, count);
  }
}

/**
 * Calcula tendência usando regressão linear simples
 */
export function calculateTrend(data: Array<{ x: number; y: number }>) {
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
    strength: Math.abs(slope)
  };
}

/**
 * Suaviza dados usando média móvel
 */
export function smoothData(
  data: number[],
  windowSize = 3
): number[] {
  if (windowSize <= 1) return [...data];

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length, i + halfWindow + 1);
    const window = data.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothed.push(average);
  }

  return smoothed;
}

/**
 * Converte dados para formato de mapa de calor
 */
export function buildHeatmapData(
  data: BaseChartData[],
  xKey: string,
  yKey: string,
  valueKey: string
): Array<{ x: string; y: string; value: number }> {
  const heatmapData: Array<{ x: string; y: string; value: number }> = [];
  const grouped: Record<string, Record<string, number>> = {};

  // Agrupar dados
  data.forEach(item => {
    const x = String(item[xKey]);
    const y = String(item[yKey]);
    const value = Number(item[valueKey]) || 0;

    if (!grouped[x]) grouped[x] = {};
    if (!grouped[x][y]) grouped[x][y] = 0;
    grouped[x][y] += value;
  });

  // Converter para array
  Object.entries(grouped).forEach(([x, yData]) => {
    Object.entries(yData).forEach(([y, value]) => {
      heatmapData.push({ x, y, value });
    });
  });

  return heatmapData;
}

/**
 * Normaliza valores para um range específico
 */
export function normalizeValues(
  values: number[],
  min = 0,
  max = 1
): number[] {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;

  if (range === 0) return values.map(() => min);

  return values.map(value => 
    min + ((value - dataMin) / range) * (max - min)
  );
}