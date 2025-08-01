import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Advisor } from '@antv/ava';
import { useFaturamentoData, useInadimplenciaData, useMovimentacoesFinanceiras, usePagamentoEmpreendedor } from './useFinancialData';

// Tipos para insights financeiros
export interface FinancialInsight {
  id: string;
  title: string;
  score: number;
  type: 'trend' | 'outlier' | 'correlation' | 'forecast' | 'anomaly';
  category: 'receita' | 'inadimplencia' | 'despesas' | 'fluxo_caixa' | 'performance';
  description: string;
  recommendation?: string;
  data?: unknown;
  chartConfig?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  metricValue?: number;
  formattedValue?: string;
  change?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
}

// Configuração AVA para métricas financeiras brasileiras
const FINANCIAL_AVA_CONFIG = {
  language: 'pt-BR',
  currency: 'BRL',
  measures: [
    {
      name: 'valortotalfaturado',
      displayName: 'Faturamento Total',
      type: 'monetary',
      aggregation: 'sum',
      format: 'currency'
    },
    {
      name: 'valortotalaberto',
      displayName: 'Valores em Aberto',
      type: 'monetary',
      aggregation: 'sum',
      format: 'currency'
    },
    {
      name: 'inadimplencia',
      displayName: 'Inadimplência',
      type: 'monetary',
      aggregation: 'sum',
      format: 'currency'
    },
    {
      name: 'noi',
      displayName: 'NOI',
      type: 'monetary',
      aggregation: 'sum',
      format: 'currency'
    },
    {
      name: 'occupancy_rate',
      displayName: 'Taxa de Ocupação',
      type: 'percentage',
      aggregation: 'avg',
      format: 'percentage'
    }
  ],
  dimensions: [
    {
      name: 'shopping',
      displayName: 'Shopping Center',
      type: 'nominal'
    },
    {
      name: 'locatario',
      displayName: 'Locatário',
      type: 'nominal'
    },
    {
      name: 'categoria',
      displayName: 'Categoria',
      type: 'nominal'
    },
    {
      name: 'periodo',
      displayName: 'Período',
      type: 'temporal'
    }
  ],
  insightTypes: [
    'trend',
    'outlier',
    'correlation',
    'seasonality',
    'changepoint',
    'ranking',
    'proportion'
  ],
  thresholds: {
    significance: 0.8,
    confidence: 0.75,
    minDataPoints: 10
  }
};

/**
 * Hook para gerar insights financeiros automáticos usando AVA
 */
export const useFinancialInsights = () => {
  const { data: faturamento, isLoading: faturamentoLoading } = useFaturamentoData();
  const { data: inadimplenciaResult, isLoading: inadimplenciaLoading } = useInadimplenciaData({
    aggregations: true,
    pagination: { limit: 2000 },
    filters: { showPagos: false }
  });
  const { data: movimentacoes, isLoading: movimentacoesLoading } = useMovimentacoesFinanceiras();
  const { data: pagamentos, isLoading: pagamentosLoading } = usePagamentoEmpreendedor();

  // Extrair dados da nova estrutura com verificação robusta
  const inadimplencia = useMemo(() => {
    if (!inadimplenciaResult?.records || !Array.isArray(inadimplenciaResult.records)) {
      return [];
    }
    return inadimplenciaResult.records;
  }, [inadimplenciaResult]);

  // Consolidar dados para análise AVA
  const consolidatedData = useMemo(() => {
    if (!faturamento || !movimentacoes || !pagamentos) {
      return null;
    }

    // Transformar dados para formato AVA
    const avaData = faturamento.map(item => ({
      shopping: item.shopping || 'N/A',
      locatario: item.locatario || 'N/A',
      categoria: item.category || 'Varejo',
      periodo: item.datainiciocompetencia || new Date().toISOString().slice(0, 7),
      valortotalfaturado: item.valortotalfaturado || 0,
      valortotalaberto: item.valortotalaberto || 0,
      valortotalpago: item.valortotalpago || 0,
      area: item.area || 0
    }));

    // Adicionar dados de inadimplência
    const inadimplenciaMap = new Map();
    if (inadimplencia && Array.isArray(inadimplencia) && inadimplencia.length > 0) {
      inadimplencia.forEach(item => {
        const key = `${item.Shopping}_${item.Locatario}`;
        inadimplenciaMap.set(key, item.Inadimplencia || 0);
      });
    }

    // Enriquecer dados com inadimplência
    avaData.forEach(item => {
      const key = `${item.shopping}_${item.locatario}`;
      item.inadimplencia = inadimplenciaMap.get(key) || 0;
    });

    // Calcular métricas adicionais
    avaData.forEach(item => {
      // Taxa de inadimplência (%)
      item.taxa_inadimplencia = item.valortotalfaturado > 0 
        ? (item.inadimplencia / item.valortotalfaturado) * 100 
        : 0;
      
      // Receita por m²
      item.receita_por_m2 = item.area > 0 
        ? item.valortotalfaturado / item.area 
        : 0;
      
      // Performance de pagamento (%)
      item.performance_pagamento = item.valortotalfaturado > 0 
        ? (item.valortotalpago / item.valortotalfaturado) * 100 
        : 0;
    });

    return avaData;
  }, [faturamento, inadimplencia, movimentacoes, pagamentos]);

  // Gerar insights usando AVA
  const insightsQuery = useQuery({
    queryKey: ['financial_insights', consolidatedData],
    queryFn: async (): Promise<FinancialInsight[]> => {
      if (!consolidatedData || consolidatedData.length === 0) {
        return [];
      }

      try {
        // Inicializar AVA Advisor
        const advisor = new Advisor({
          ...FINANCIAL_AVA_CONFIG,
          // Configurações específicas para análise financeira brasileira
          insights: {
            ...FINANCIAL_AVA_CONFIG.insightTypes.reduce((acc, type) => {
              acc[type] = { enable: true };
              return acc;
            }, {}),
            // Configurações específicas para detecção de anomalias financeiras
            outlier: {
              enable: true,
              algorithm: 'isolation_forest',
              threshold: 0.1
            },
            trend: {
              enable: true,
              algorithm: 'regression',
              seasonality: true
            },
            correlation: {
              enable: true,
              threshold: 0.6
            }
          }
        });

        // Gerar insights automáticos usando a API correta do AVA
        const insights = advisor.advise({ data: consolidatedData });
        
        if (!insights || !Array.isArray(insights)) {
          throw new Error('AVA retornou formato de dados inválido');
        }

        // Processar e traduzir insights para português brasileiro
        const processedInsights: FinancialInsight[] = insights
          .filter(insight => insight.score >= FINANCIAL_AVA_CONFIG.thresholds.significance)
          .map((insight, index) => {
            const processedInsight = processInsight(insight, index);
            return processedInsight;
          })
          .sort((a, b) => b.score - a.score) // Ordenar por relevância
          .slice(0, 10); // Limitar a 10 insights mais relevantes

        return processedInsights;

      } catch (error) {
        console.error('❌ Erro ao gerar insights com AVA:', error);
        
        // Fallback: gerar insights básicos manualmente
        return generateFallbackInsights(consolidatedData);
      }
    },
    enabled: !!consolidatedData,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  });

  return {
    insights: insightsQuery.data || [],
    isLoading: faturamentoLoading || inadimplenciaLoading || movimentacoesLoading || pagamentosLoading || insightsQuery.isLoading,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
    // Insights categorizados para UI
    categorizedInsights: useMemo(() => {
      if (!insightsQuery.data) return {};
      
      return insightsQuery.data.reduce((acc, insight) => {
        if (!acc[insight.category]) acc[insight.category] = [];
        acc[insight.category].push(insight);
        return acc;
      }, {} as Record<string, FinancialInsight[]>);
    }, [insightsQuery.data]),
    // Top insights por prioridade
    criticalInsights: useMemo(() => {
      return insightsQuery.data?.filter(insight => insight.priority === 'critical') || [];
    }, [insightsQuery.data])
  };
};

/**
 * Processa insight bruto do AVA para formato brasileiro
 */
function processInsight(rawInsight: Record<string, unknown>, index: number): FinancialInsight {
  const insightId = `insight_${index}_${Date.now()}`;
  
  // Mapear tipos de insight
  const typeMapping = {
    'trend': 'trend',
    'outlier': 'outlier', 
    'correlation': 'correlation',
    'seasonality': 'trend',
    'changepoint': 'forecast',
    'ranking': 'outlier',
    'proportion': 'correlation'
  };

  // Mapear categorias baseado na medida
  const categoryMapping = {
    'valortotalfaturado': 'receita',
    'inadimplencia': 'inadimplencia',
    'valortotalaberto': 'receita',
    'noi': 'performance',
    'taxa_inadimplencia': 'inadimplencia',
    'receita_por_m2': 'performance',
    'performance_pagamento': 'fluxo_caixa'
  };

  // Determinar prioridade baseada na pontuação e tipo
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (rawInsight.score >= 0.9) priority = 'critical';
  else if (rawInsight.score >= 0.75) priority = 'high';
  else if (rawInsight.score >= 0.5) priority = 'medium';
  else priority = 'low';

  // Gerar título e descrição em português
  const { title, description, recommendation } = generateInsightContent(rawInsight);

  return {
    id: insightId,
    title,
    score: rawInsight.score || 0,
    type: typeMapping[rawInsight.type] || 'trend',
    category: categoryMapping[rawInsight.measure] || 'performance',
    description,
    recommendation,
    priority,
    confidence: rawInsight.confidence || rawInsight.score || 0,
    data: rawInsight.data,
    chartConfig: rawInsight.chartConfig,
    metricValue: rawInsight.value,
    formattedValue: formatInsightValue(rawInsight.value, rawInsight.measure),
    change: rawInsight.change ? {
      direction: rawInsight.change > 0 ? 'up' : rawInsight.change < 0 ? 'down' : 'stable',
      percentage: Math.abs(rawInsight.change * 100),
      period: rawInsight.period || 'último período'
    } : undefined
  };
}

/**
 * Gera conteúdo textual para insights em português brasileiro
 */
function generateInsightContent(insight: Record<string, unknown>): { title: string; description: string; recommendation?: string } {
  const measure = insight.measure || 'metric';
  const value = insight.value || 0;
  const change = insight.change || 0;
  
  // Templates baseados no tipo de insight
  switch (insight.type) {
    case 'trend':
      return {
        title: `Tendência ${change > 0 ? 'Crescente' : 'Decrescente'} em ${getMeasureDisplayName(measure)}`,
        description: `Detectada tendência ${change > 0 ? 'positiva' : 'negativa'} de ${Math.abs(change * 100).toFixed(1)}% no período analisado.`,
        recommendation: change > 0 
          ? 'Mantenha as estratégias atuais que estão impulsionando este crescimento.'
          : 'Revise as operações para identificar fatores que podem estar causando esta redução.'
      };
      
    case 'outlier':
      return {
        title: `Anomalia Detectada em ${getMeasureDisplayName(measure)}`,
        description: `Valor atípico identificado: ${formatInsightValue(value, measure)}. Este valor está significativamente fora do padrão esperado.`,
        recommendation: 'Investigue as causas desta anomalia para determinar se requer ação corretiva.'
      };
      
    case 'correlation':
      return {
        title: `Correlação Identificada em ${getMeasureDisplayName(measure)}`,
        description: `Forte correlação detectada entre variáveis. Coeficiente de correlação: ${(insight.correlation || 0).toFixed(2)}.`,
        recommendation: 'Aproveite esta correlação para otimizar estratégias e prever comportamentos futuros.'
      };
      
    default:
      return {
        title: `Insight de ${getMeasureDisplayName(measure)}`,
        description: `Padrão relevante detectado nos dados com confiança de ${((insight.confidence || 0) * 100).toFixed(0)}%.`,
        recommendation: 'Analise este padrão para identificar oportunidades de otimização.'
      };
  }
}

/**
 * Converte nomes técnicos para nomes amigáveis
 */
function getMeasureDisplayName(measure: string): string {
  const displayNames = {
    'valortotalfaturado': 'Faturamento Total',
    'inadimplencia': 'Inadimplência',
    'valortotalaberto': 'Valores em Aberto',
    'taxa_inadimplencia': 'Taxa de Inadimplência',
    'receita_por_m2': 'Receita por m²',
    'performance_pagamento': 'Performance de Pagamento',
    'noi': 'NOI (Net Operating Income)'
  };
  
  return displayNames[measure] || measure;
}

/**
 * Formata valores para exibição
 */
function formatInsightValue(value: number, measure: string): string {
  if (typeof value !== 'number') return 'N/A';
  
  if (measure.includes('taxa') || measure.includes('performance')) {
    return `${value.toFixed(1)}%`;
  }
  
  if (measure.includes('valor') || measure.includes('receita') || measure.includes('inadimplencia') || measure === 'noi') {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
  
  return value.toLocaleString('pt-BR');
}

/**
 * Gera insights básicos quando AVA falha
 */
function generateFallbackInsights(data: Record<string, unknown>[]): FinancialInsight[] {
  if (!data || data.length === 0) return [];
  
  const insights: FinancialInsight[] = [];
  
  // Insight 1: Total de faturamento
  const totalFaturamento = data.reduce((sum, item) => sum + (item.valortotalfaturado || 0), 0);
  insights.push({
    id: 'fallback_1',
    title: 'Análise de Faturamento Total',
    score: 0.8,
    type: 'trend',
    category: 'receita',
    description: `Faturamento total consolidado: ${formatInsightValue(totalFaturamento, 'valortotalfaturado')}`,
    priority: 'high',
    confidence: 0.9,
    metricValue: totalFaturamento,
    formattedValue: formatInsightValue(totalFaturamento, 'valortotalfaturado')
  });
  
  // Insight 2: Taxa de inadimplência média
  const inadimplenciaTotal = data.reduce((sum, item) => sum + (item.inadimplencia || 0), 0);
  const taxaMedia = totalFaturamento > 0 ? (inadimplenciaTotal / totalFaturamento) * 100 : 0;
  
  insights.push({
    id: 'fallback_2',
    title: 'Taxa de Inadimplência Consolidada',
    score: 0.75,
    type: 'outlier',
    category: 'inadimplencia',
    description: `Taxa média de inadimplência: ${taxaMedia.toFixed(1)}%`,
    priority: taxaMedia > 5 ? 'critical' : taxaMedia > 2 ? 'high' : 'medium',
    confidence: 0.85,
    metricValue: taxaMedia,
    formattedValue: `${taxaMedia.toFixed(1)}%`,
    recommendation: taxaMedia > 5 ? 'Taxa elevada - implemente estratégias de recuperação de crédito urgentemente.' : undefined
  });
  
  return insights;
}

export default useFinancialInsights;