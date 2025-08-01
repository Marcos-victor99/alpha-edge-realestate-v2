import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários específicos para o dashboard Tremor

// Função para determinar a cor baseada no tipo de variação
export function getVariationColor(tipo: 'positivo' | 'negativo' | 'neutro'): string {
  switch (tipo) {
    case 'positivo':
      return 'text-tremor-positive';
    case 'negativo':
      return 'text-tremor-negative';
    case 'neutro':
    default:
      return 'text-tremor-info';
  }
}

// Função para determinar cores de background para indicadores
export function getIndicatorBgColor(tipo: 'positivo' | 'negativo' | 'neutro'): string {
  switch (tipo) {
    case 'positivo':
      return 'bg-emerald-50 dark:bg-emerald-950';
    case 'negativo':
      return 'bg-red-50 dark:bg-red-950';
    case 'neutro':
    default:
      return 'bg-blue-50 dark:bg-blue-950';
  }
}

// Função para calcular contraste de texto
export function getTextContrast(backgroundColor: string): string {
  // Implementação simples baseada na cor de fundo
  const darkColors = ['bg-gray-900', 'bg-black', 'dark:bg-'];
  const isDark = darkColors.some(color => backgroundColor.includes(color));
  return isDark ? 'text-white' : 'text-gray-900';
}

// Função para gerar cores para gráficos
export function getChartColors(count: number): string[] {
  const baseColors = [
    'blue', 'emerald', 'violet', 'amber', 'rose', 
    'cyan', 'orange', 'pink', 'indigo', 'teal'
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Se precisar de mais cores, repete o padrão
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

// Função para determinar ícone baseado no tipo de KPI
export function getKpiIcon(tipo: string): string {
  const iconMap: Record<string, string> = {
    'receita': '💰',
    'despesa': '💸',
    'lucro': '📈',
    'prejuizo': '📉',
    'ocupacao': '🏢',
    'inadimplencia': '⚠️',
    'roi': '🎯',
    'performance': '📊',
    'risco': '🚨',
    'oportunidade': '🌟',
  };
  
  return iconMap[tipo.toLowerCase()] || '📋';
}

// Função para debounce (útil para filtros)
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Função para calcular diferença percentual
export function calcularDiferencaPercentual(valorAtual: number, valorAnterior: number): number {
  if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
  return ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
}

// Função para agrupar dados por período
export function agruparPorPeriodo<T>(
  dados: T[], 
  getCampoData: (item: T) => string | Date,
  periodo: 'dia' | 'mes' | 'ano' = 'mes'
): Record<string, T[]> {
  return dados.reduce((acc, item) => {
    const data = new Date(getCampoData(item));
    let chave: string;
    
    switch (periodo) {
      case 'dia':
        chave = data.toISOString().split('T')[0];
        break;
      case 'ano':
        chave = data.getFullYear().toString();
        break;
      case 'mes':
      default:
        chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    if (!acc[chave]) {
      acc[chave] = [];
    }
    acc[chave].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// Função para validar se uma data está dentro de um range
export function isDataNoRange(
  data: string | Date, 
  inicio: string | Date, 
  fim: string | Date
): boolean {
  const dataObj = new Date(data);
  const inicioObj = new Date(inicio);
  const fimObj = new Date(fim);
  
  return dataObj >= inicioObj && dataObj <= fimObj;
}
