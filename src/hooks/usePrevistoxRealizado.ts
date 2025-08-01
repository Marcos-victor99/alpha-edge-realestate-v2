import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { usePagamentoEmpreendedor } from './useFinancialData';
import { supabase } from '@/integrations/supabase/client';

export interface PrevistoRealizadoItem {
  periodo: string;
  previsto: number;
  realizado: number;
  variacao: number;
  variacao_percentual: number;
  eficiencia: number;
  status: 'acima_meta' | 'dentro_meta' | 'abaixo_meta';
  categoria?: string;
  meta_minima: number;
  meta_maxima: number;
}

export interface PrevistoRealizadoSummary {
  totalPrevisto: number;
  totalRealizado: number;
  variacaoTotal: number;
  variacaoPercentual: number;
  eficienciaMedia: number;
  periodosDentroMeta: number;
  totalPeriodos: number;
  melhorPeriodo: PrevistoRealizadoItem | null;
  piorPeriodo: PrevistoRealizadoItem | null;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
}

export interface PrevistoRealizadoOptions {
  periodo?: string; // '3m', '6m', '12m'
  categoria?: string;
  incluirProjecoes?: boolean;
  metaTolerancia?: number; // Percentual de tolerância para metas (padrão: 5%)
}

// Função para buscar dados orçamentários (simulação - normalmente viria de uma tabela específica)
const fetchOrcamentoData = async (options: PrevistoRealizadoOptions) => {
  // Por enquanto, vamos simular dados orçamentários
  // Em uma implementação real, isso consultaria uma tabela 'orcamento' ou 'budget'
  const mesesAtras = options.periodo === '3m' ? 3 : options.periodo === '12m' ? 12 : 6;
  const hoje = new Date();
  
  const orcamentoSimulado = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const data = new Date(hoje);
    data.setMonth(data.getMonth() - i);
    const periodo = data.toISOString().slice(0, 7);
    
    // Simular valores orçamentários (em produção, viria do banco)
    const valorBase = 85000 + (Math.random() * 20000);
    orcamentoSimulado.push({
      periodo,
      valor_orcado: valorBase,
      categoria: options.categoria || 'Geral',
      meta_minima: valorBase * 0.90, // 90% do orçado
      meta_maxima: valorBase * 1.10  // 110% do orçado
    });
  }
  
  return orcamentoSimulado;
};

// Função para calcular tendência baseada nos últimos períodos
const calcularTendencia = (dados: PrevistoRealizadoItem[]): 'crescente' | 'decrescente' | 'estavel' => {
  if (dados.length < 3) return 'estavel';
  
  const ultimos3 = dados.slice(-3);
  const primeira = ultimos3[0].eficiencia;
  const ultima = ultimos3[ultimos3.length - 1].eficiencia;
  
  const diferenca = ultima - primeira;
  
  if (diferenca > 5) return 'crescente';
  if (diferenca < -5) return 'decrescente';
  return 'estavel';
};

export const usePrevistoxRealizado = (options: PrevistoRealizadoOptions = {}) => {
  const {
    periodo = '6m',
    categoria,
    incluirProjecoes = false,
    metaTolerancia = 5
  } = options;

  // Buscar dados de pagamentos realizados
  const { data: pagamentosData, isLoading: pagamentosLoading, error: pagamentosError } = usePagamentoEmpreendedor();

  // Buscar dados orçamentários
  const { 
    data: orcamentoData, 
    isLoading: orcamentoLoading, 
    error: orcamentoError 
  } = useQuery({
    queryKey: ['orcamento', periodo, categoria],
    queryFn: () => fetchOrcamentoData(options),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Processamento e análise dos dados
  const processedData = useMemo(() => {
    if (!pagamentosData || !orcamentoData) {
      return {
        dados: [],
        summary: null,
        isLoading: pagamentosLoading || orcamentoLoading,
        error: pagamentosError || orcamentoError
      };
    }

    // Agrupar pagamentos realizados por período
    const realizadoPorPeriodo: Record<string, number> = {};
    
    pagamentosData
      .filter(pagamento => !categoria || pagamento.categoria === categoria)
      .forEach(pagamento => {
        if (pagamento.data_pagamento) {
          const periodo = new Date(pagamento.data_pagamento).toISOString().slice(0, 7);
          realizadoPorPeriodo[periodo] = (realizadoPorPeriodo[periodo] || 0) + (pagamento.valor_titulo || 0);
        }
      });

    // Processar dados combinados
    const dados: PrevistoRealizadoItem[] = orcamentoData.map(orcamento => {
      const realizado = realizadoPorPeriodo[orcamento.periodo] || 0;
      const variacao = realizado - orcamento.valor_orcado;
      const variacao_percentual = orcamento.valor_orcado > 0 ? (variacao / orcamento.valor_orcado) * 100 : 0;
      const eficiencia = orcamento.valor_orcado > 0 ? (realizado / orcamento.valor_orcado) * 100 : 0;

      // Determinar status baseado nas metas
      let status: 'acima_meta' | 'dentro_meta' | 'abaixo_meta';
      if (realizado >= orcamento.meta_maxima) {
        status = 'acima_meta';
      } else if (realizado >= orcamento.meta_minima) {
        status = 'dentro_meta';
      } else {
        status = 'abaixo_meta';
      }

      return {
        periodo: orcamento.periodo,
        previsto: orcamento.valor_orcado,
        realizado,
        variacao,
        variacao_percentual,
        eficiencia,
        status,
        categoria: orcamento.categoria,
        meta_minima: orcamento.meta_minima,
        meta_maxima: orcamento.meta_maxima
      };
    });

    // Calcular resumo/summary
    const totalPrevisto = dados.reduce((acc, item) => acc + item.previsto, 0);
    const totalRealizado = dados.reduce((acc, item) => acc + item.realizado, 0);
    const variacaoTotal = totalRealizado - totalPrevisto;
    const variacaoPercentual = totalPrevisto > 0 ? (variacaoTotal / totalPrevisto) * 100 : 0;
    const eficienciaMedia = dados.length > 0 ? dados.reduce((acc, item) => acc + item.eficiencia, 0) / dados.length : 0;
    const periodosDentroMeta = dados.filter(item => item.status === 'dentro_meta' || item.status === 'acima_meta').length;

    // Encontrar melhor e pior período
    const melhorPeriodo = dados.reduce((max, item) => 
      !max || item.eficiencia > max.eficiencia ? item : max, null as PrevistoRealizadoItem | null);
    const piorPeriodo = dados.reduce((min, item) => 
      !min || item.eficiencia < min.eficiencia ? item : min, null as PrevistoRealizadoItem | null);

    const tendencia = calcularTendencia(dados);

    const summary: PrevistoRealizadoSummary = {
      totalPrevisto,
      totalRealizado,
      variacaoTotal,
      variacaoPercentual,
      eficienciaMedia,
      periodosDentroMeta,
      totalPeriodos: dados.length,
      melhorPeriodo,
      piorPeriodo,
      tendencia
    };

    return {
      dados,
      summary,
      isLoading: false,
      error: null
    };
  }, [pagamentosData, orcamentoData, categoria, pagamentosLoading, orcamentoLoading, pagamentosError, orcamentoError]);

  return {
    data: processedData.dados,
    summary: processedData.summary,
    isLoading: processedData.isLoading,
    error: processedData.error,
    // Funções utilitárias
    getPeriodosPorStatus: (status: 'acima_meta' | 'dentro_meta' | 'abaixo_meta') => 
      processedData.dados.filter(item => item.status === status),
    getEficienciaMedia: () => processedData.summary?.eficienciaMedia || 0,
    getTendencia: () => processedData.summary?.tendencia || 'estavel',
    // Projeções (se habilitado)
    ...(incluirProjecoes && {
      projecaoProximoMes: processedData.dados.length > 0 ? 
        processedData.dados[processedData.dados.length - 1].previsto * 
        (processedData.summary?.eficienciaMedia || 100) / 100 : 0
    })
  };
};

export default usePrevistoxRealizado;