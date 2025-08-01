import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para análise de fornecedores
export interface FornecedorAnalytics {
  id: number;
  nomefantasia: string;
  cpfcnpj: string;
  shopping: string;
  tipocp: string; // Tipo de conta a pagar
  fornecedor: string;
  valorcp: number; // Valor da conta a pagar
  valorpago: number;
  statuspagamento: string;
  dataemissao: string;
  datapagamento: string | null;
  datavencimento: string;
  contacontabil: string;
  descricaocontacontabil: string;
  diasAtraso: number;
  eficienciaPagamento: number; // % de pagamentos em dia
  categoria: string;
}

export interface RankingFornecedores {
  fornecedor: string;
  shopping: string;
  totalContratado: number;
  totalPago: number;
  totalPendente: number;
  numeroTransacoes: number;
  ticketMedio: number;
  percentualPago: number;
  diasMediosPagamento: number;
  statusGeral: 'excelente' | 'bom' | 'regular' | 'preocupante';
  categoria: string;
  ultimoPagamento: string | null;
  cor: string;
}

export interface AnaliseGastosCategoria {
  categoria: string;
  totalGasto: number;
  totalPago: number;
  totalPendente: number;
  participacao: number;
  fornecedores: number;
  crescimentoMensal: number;
  eficienciaPagamento: number;
  prazoMedioPagamento: number;
  cor: string;
}

export interface MetricasFornecedores {
  totalFornecedores: number;
  totalContratado: number;
  totalPago: number;
  totalPendente: number;
  taxaPagamento: number;
  prazoMedioPagamento: number;
  fornecedorMaiorGasto: RankingFornecedores;
  fornecedorMelhorPerformance: RankingFornecedores;
  categoriaComMaiorGasto: string;
  tendenciaPagamentos: 'crescimento' | 'declinio' | 'estavel';
  alertasVencimento: number;
  economia: number; // Descontos obtidos
}

export interface PagamentosTemporal {
  periodo: string;
  totalPago: number;
  totalVencimentos: number;
  pagamentosNoPrazo: number;
  pagamentosAtrasados: number;
  eficiencia: number;
  valorMedioTransacao: number;
}

export interface FiltrosFornecedores {
  shopping?: string;
  fornecedor?: string;
  status?: string[];
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  categoria?: string;
  ordenacao?: 'valor' | 'data' | 'fornecedor' | 'atraso';
  periodo?: string; // Suporte a períodos como '7d', '30d', '90d'
}

// Função utilitária para criar filtros baseados em período
export function criarFiltrosFornecedoresPorPeriodo(periodo: string, outrosFiltros: Omit<FiltrosFornecedores, 'periodo' | 'dataInicio' | 'dataFim'> = {}): FiltrosFornecedores {
  const hoje = new Date();
  let dataInicio: Date | null = null;
  
  // Converter período em datas
  if (periodo.endsWith('d')) {
    const dias = parseInt(periodo.replace('d', ''));
    if (!isNaN(dias)) {
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - dias);
    }
  }
  
  return {
    ...outrosFiltros,
    dataInicio: dataInicio?.toISOString().split('T')[0],
    dataFim: hoje.toISOString().split('T')[0],
    periodo
  };
}

// Hook principal para análise de fornecedores
export const useFornecedoresData = (filtros: FiltrosFornecedores = {}) => {
  // Processar filtros para conversão automática de período
  const filtrosProcessados = (() => {
    if (filtros.periodo && !filtros.dataInicio && !filtros.dataFim) {
      // Se período fornecido sem datas explícitas, converter automaticamente
      return criarFiltrosFornecedoresPorPeriodo(filtros.periodo, filtros);
    }
    return filtros;
  })();

  return useQuery({
    queryKey: ['fornecedores_analytics', filtrosProcessados],
    queryFn: async (): Promise<{
      fornecedores: FornecedorAnalytics[];
      ranking: RankingFornecedores[];
      porCategoria: AnaliseGastosCategoria[];
      metricas: MetricasFornecedores;
      temporal: PagamentosTemporal[];
    }> => {
      try {
        // Query otimizada com campos específicos
        let query = supabase
          .from('Pagamento_Empreendedor')
          .select(`
            idfichacp,
            nomefantasia,
            cpfcnpj,
            shopping,
            tipocp,
            fornecedor,
            dataemissao,
            valorcp,
            valorpago,
            statuspagamento,
            datapagamento,
            datavencimento,
            contacontabil,
            descricaocontacontabil,
            desconto,
            multa,
            juros
          `)
          .not('valorcp', 'is', null)
          .gt('valorcp', 0);

        // Aplicar filtros (usar filtrosProcessados que já tem datas convertidas)
        if (filtros.shopping) {
          query = query.eq('shopping', filtros.shopping);
        }
        if (filtros.fornecedor) {
          query = query.ilike('fornecedor', `%${filtros.fornecedor}%`);
        }
        if (filtros.status && filtros.status.length > 0) {
          query = query.in('statuspagamento', filtros.status);
        }
        if (filtrosProcessados.dataInicio) {
          query = query.gte('dataemissao', filtrosProcessados.dataInicio);
        }
        if (filtrosProcessados.dataFim) {
          query = query.lte('dataemissao', filtrosProcessados.dataFim);
        }
        if (filtros.valorMinimo) {
          query = query.gte('valorcp', filtros.valorMinimo);
        }
        if (filtros.valorMaximo) {
          query = query.lte('valorcp', filtros.valorMaximo);
        }

        // Aplicar ordenação
        switch (filtros.ordenacao) {
          case 'valor':
            query = query.order('valorcp', { ascending: false });
            break;
          case 'data':
            query = query.order('dataemissao', { ascending: false });
            break;
          case 'fornecedor':
            query = query.order('fornecedor', { ascending: true });
            break;
          default:
            query = query.order('dataemissao', { ascending: false });
        }

        const { data: rawData, error } = await query.limit(1000);

        if (error) {
          console.error('❌ Erro ao buscar dados de fornecedores:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            filtros: filtrosProcessados,
            timestamp: new Date().toISOString()
          });
          
          // Fallback graceful: retornar dados vazios
          console.warn('🔄 Ativando fallback para fornecedores');
          return {
            fornecedores: [],
            ranking: [],
            porCategoria: [],
            metricas: criarMetricasVazias(),
            temporal: []
          };
        }

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn('⚠️ Nenhum dado de fornecedor encontrado', {
            filtros: filtrosProcessados,
            rawDataType: typeof rawData,
            isArray: Array.isArray(rawData),
            length: rawData?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          return {
            fornecedores: [],
            ranking: [],
            porCategoria: [],
            metricas: criarMetricasVazias(),
            temporal: []
          };
        }

        // Processar dados
        const fornecedoresProcessados = processarDadosFornecedores(rawData);
        const ranking = calcularRankingFornecedores(fornecedoresProcessados);
        const porCategoria = analisarGastosPorCategoria(fornecedoresProcessados);
        const metricas = calcularMetricasFornecedores(fornecedoresProcessados, ranking);
        const temporal = analisarPagamentosTemporal(fornecedoresProcessados);

        console.log(`✅ Analytics de fornecedores processados: ${fornecedoresProcessados.length} registros`);

        return {
          fornecedores: fornecedoresProcessados,
          ranking,
          porCategoria,
          metricas,
          temporal
        };

      } catch (error) {
        console.error('💥 Erro crítico em analytics de fornecedores:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          filtros: filtrosProcessados,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
        });
        
        // Fallback final com dados vazios
        console.warn('🚨 Tentando fallback final para fornecedores');
        try {
          return {
            fornecedores: [],
            ranking: [],
            porCategoria: [],
            metricas: criarMetricasVazias(),
            temporal: []
          };
        } catch (fallbackError) {
          console.error('💀 Falha total no fallback de fornecedores:', fallbackError);
          throw new Error('Erro crítico no sistema de fornecedores. Contate o suporte.');
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook para análise específica de um fornecedor
export const useFornecedorEspecifico = (fornecedor: string) => {
  return useQuery({
    queryKey: ['fornecedor_especifico', fornecedor],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Pagamento_Empreendedor')
        .select('*')
        .eq('fornecedor', fornecedor)
        .order('dataemissao', { ascending: false });

      if (error) throw error;

      return {
        dados: data || [],
        historico: calcularHistoricoFornecedor(data || []),
        tendencia: calcularTendenciaFornecedor(data || [])
      };
    },
    enabled: !!fornecedor,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para alertas de vencimento
export const useAlertasVencimento = (diasAlerta: number = 7) => {
  return useQuery({
    queryKey: ['alertas_vencimento', diasAlerta],
    queryFn: async () => {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + diasAlerta);

      const { data, error } = await supabase
        .from('Pagamento_Empreendedor')
        .select('*')
        .lte('datavencimento', dataLimite.toISOString().split('T')[0])
        .in('statuspagamento', ['Pendente', 'Em Análise'])
        .order('datavencimento', { ascending: true });

      if (error) throw error;

      return processarAlertas(data || [], diasAlerta);
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

// Funções auxiliares para processamento
function processarDadosFornecedores(rawData: any[]): FornecedorAnalytics[] {
  return rawData.map((item) => {
    const valorcp = Number(item.valorcp) || 0;
    const valorpago = Number(item.valorpago) || 0;
    const dataemissao = item.dataemissao;
    const datavencimento = item.datavencimento;
    const datapagamento = item.datapagamento;

    // Calcular dias de atraso
    let diasAtraso = 0;
    if (datavencimento) {
      const hoje = new Date();
      const vencimento = new Date(datavencimento);
      
      if (datapagamento) {
        const pagamento = new Date(datapagamento);
        diasAtraso = Math.max(0, Math.floor((pagamento.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
      } else if (hoje > vencimento) {
        diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Calcular eficiência de pagamento
    const eficienciaPagamento = diasAtraso === 0 && datapagamento ? 100 : 
                               diasAtraso <= 5 ? 80 : 
                               diasAtraso <= 15 ? 60 : 30;

    return {
      id: item.idfichacp,
      nomefantasia: item.nomefantasia || 'N/A',
      cpfcnpj: item.cpfcnpj || 'N/A',
      shopping: item.shopping || 'N/A',
      tipocp: item.tipocp || 'Outros',
      fornecedor: item.fornecedor || 'N/A',
      valorcp,
      valorpago,
      statuspagamento: item.statuspagamento || 'Pendente',
      dataemissao,
      datapagamento,
      datavencimento,
      contacontabil: item.contacontabil || '',
      descricaocontacontabil: item.descricaocontacontabil || '',
      diasAtraso,
      eficienciaPagamento,
      categoria: categorizarFornecedor(item)
    };
  });
}

function calcularRankingFornecedores(fornecedores: FornecedorAnalytics[]): RankingFornecedores[] {
  // Agrupar por fornecedor
  const grupos = fornecedores.reduce((acc, item) => {
    if (!acc[item.fornecedor]) {
      acc[item.fornecedor] = {
        fornecedor: item.fornecedor,
        shopping: item.shopping,
        transacoes: [],
        categoria: item.categoria
      };
    }
    acc[item.fornecedor].transacoes.push(item);
    return acc;
  }, {} as Record<string, any>);

  // Cores para ranking
  const coresRanking = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-bull))',
    'hsl(var(--chart-neutral))'
  ];

  return Object.entries(grupos)
    .map(([fornecedor, grupo]: [string, any], index) => {
      const transacoes = grupo.transacoes;
      const totalContratado = transacoes.reduce((sum: number, t: any) => sum + t.valorcp, 0);
      const totalPago = transacoes.reduce((sum: number, t: any) => sum + t.valorpago, 0);
      const totalPendente = totalContratado - totalPago;
      const percentualPago = totalContratado > 0 ? (totalPago / totalContratado) * 100 : 0;

      // Calcular dias médios de pagamento
      const pagamentosComDias = transacoes.filter((t: any) => t.datapagamento && t.dataemissao);
      const diasMediosPagamento = pagamentosComDias.length > 0 ?
        pagamentosComDias.reduce((sum: number, t: any) => {
          const emissao = new Date(t.dataemissao);
          const pagamento = new Date(t.datapagamento);
          return sum + Math.floor((pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / pagamentosComDias.length : 0;

      // Determinar status geral
      let statusGeral: 'excelente' | 'bom' | 'regular' | 'preocupante';
      if (percentualPago >= 95 && diasMediosPagamento <= 30) statusGeral = 'excelente';
      else if (percentualPago >= 85 && diasMediosPagamento <= 45) statusGeral = 'bom';
      else if (percentualPago >= 70 && diasMediosPagamento <= 60) statusGeral = 'regular';
      else statusGeral = 'preocupante';

      // Último pagamento
      const ultimoPagamento = transacoes
        .filter((t: any) => t.datapagamento)
        .sort((a: any, b: any) => new Date(b.datapagamento).getTime() - new Date(a.datapagamento).getTime())[0]?.datapagamento || null;

      return {
        fornecedor,
        shopping: grupo.shopping,
        totalContratado,
        totalPago,
        totalPendente,
        numeroTransacoes: transacoes.length,
        ticketMedio: transacoes.length > 0 ? totalContratado / transacoes.length : 0,
        percentualPago: Math.min(100, Math.max(0, percentualPago)),
        diasMediosPagamento: Math.max(0, diasMediosPagamento),
        statusGeral,
        categoria: grupo.categoria,
        ultimoPagamento,
        cor: coresRanking[index % coresRanking.length]
      };
    })
    .sort((a, b) => b.totalContratado - a.totalContratado);
}

function analisarGastosPorCategoria(fornecedores: FornecedorAnalytics[]): AnaliseGastosCategoria[] {
  const grupos = fornecedores.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = {
        categoria: item.categoria,
        totalGasto: 0,
        totalPago: 0,
        totalPendente: 0,
        fornecedores: new Set(),
        transacoes: [],
        diasPagamento: []
      };
    }

    acc[item.categoria].totalGasto += item.valorcp;
    acc[item.categoria].totalPago += item.valorpago;
    acc[item.categoria].totalPendente += (item.valorcp - item.valorpago);
    acc[item.categoria].fornecedores.add(item.fornecedor);
    acc[item.categoria].transacoes.push(item);
    
    if (item.datapagamento && item.dataemissao) {
      const dias = Math.floor((new Date(item.datapagamento).getTime() - new Date(item.dataemissao).getTime()) / (1000 * 60 * 60 * 24));
      acc[item.categoria].diasPagamento.push(dias);
    }

    return acc;
  }, {} as Record<string, any>);

  const totalGeral = Object.values(grupos).reduce((sum, grupo: any) => sum + grupo.totalGasto, 0);

  // Cores para categorias
  const coresCategorias: Record<string, string> = {
    'Obras e Reformas': 'hsl(var(--chart-1))',
    'Serviços Profissionais': 'hsl(var(--chart-2))',
    'Manutenção': 'hsl(var(--chart-3))',
    'Fornecedores Operacionais': 'hsl(var(--chart-4))',
    'Tecnologia': 'hsl(var(--chart-5))',
    'Marketing': 'hsl(var(--chart-bull))',
    'Outros': 'hsl(var(--chart-neutral))'
  };

  return Object.entries(grupos)
    .map(([categoria, grupo]: [string, any]) => {
      const eficienciaPagamento = grupo.totalGasto > 0 ? (grupo.totalPago / grupo.totalGasto) * 100 : 0;
      const prazoMedioPagamento = grupo.diasPagamento.length > 0 ?
        grupo.diasPagamento.reduce((sum: number, dias: number) => sum + dias, 0) / grupo.diasPagamento.length : 0;

      // Simular crescimento mensal (seria calculado com dados históricos)
      const crescimentoMensal = Math.random() * 20 - 10; // -10% a +10%

      return {
        categoria,
        totalGasto: grupo.totalGasto,
        totalPago: grupo.totalPago,
        totalPendente: grupo.totalPendente,
        participacao: totalGeral > 0 ? (grupo.totalGasto / totalGeral) * 100 : 0,
        fornecedores: grupo.fornecedores.size,
        crescimentoMensal,
        eficienciaPagamento: Math.min(100, Math.max(0, eficienciaPagamento)),
        prazoMedioPagamento: Math.max(0, prazoMedioPagamento),
        cor: coresCategorias[categoria] || coresCategorias['Outros']
      };
    })
    .sort((a, b) => b.totalGasto - a.totalGasto);
}

function calcularMetricasFornecedores(fornecedores: FornecedorAnalytics[], ranking: RankingFornecedores[]): MetricasFornecedores {
  if (fornecedores.length === 0) return criarMetricasVazias();

  const totalFornecedores = new Set(fornecedores.map(f => f.fornecedor)).size;
  const totalContratado = fornecedores.reduce((sum, f) => sum + f.valorcp, 0);
  const totalPago = fornecedores.reduce((sum, f) => sum + f.valorpago, 0);
  const totalPendente = totalContratado - totalPago;
  const taxaPagamento = totalContratado > 0 ? (totalPago / totalContratado) * 100 : 0;

  // Calcular prazo médio de pagamento
  const pagamentosComPrazo = fornecedores.filter(f => f.datapagamento && f.dataemissao);
  const prazoMedioPagamento = pagamentosComPrazo.length > 0 ?
    pagamentosComPrazo.reduce((sum, f) => {
      const dias = Math.floor((new Date(f.datapagamento!).getTime() - new Date(f.dataemissao).getTime()) / (1000 * 60 * 60 * 24));
      return sum + dias;
    }, 0) / pagamentosComPrazo.length : 0;

  // Fornecedor com maior gasto e melhor performance
  const fornecedorMaiorGasto = ranking[0] || {} as RankingFornecedores;
  const fornecedorMelhorPerformance = ranking
    .filter(f => f.numeroTransacoes >= 3) // Mínimo de transações para ser relevante
    .sort((a, b) => b.percentualPago - a.percentualPago)[0] || {} as RankingFornecedores;

  // Categoria com maior gasto
  const gastosPorCategoria = fornecedores.reduce((acc, f) => {
    acc[f.categoria] = (acc[f.categoria] || 0) + f.valorcp;
    return acc;
  }, {} as Record<string, number>);
  
  const categoriaComMaiorGasto = Object.entries(gastosPorCategoria)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

  // Tendência de pagamentos (simulada - seria baseada em dados históricos)
  const tendenciaPagamentos: 'crescimento' | 'declinio' | 'estavel' = 
    taxaPagamento > 85 ? 'crescimento' : taxaPagamento < 70 ? 'declinio' : 'estavel';

  // Alertas de vencimento (próximos 7 dias)
  const hoje = new Date();
  const proximaSemana = new Date(hoje);
  proximaSemana.setDate(hoje.getDate() + 7);
  
  const alertasVencimento = fornecedores.filter(f => {
    if (!f.datavencimento || f.statuspagamento === 'Pago') return false;
    const vencimento = new Date(f.datavencimento);
    return vencimento <= proximaSemana;
  }).length;

  // Economia (descontos obtidos)
  const economia = 0; // Seria calculado se houvesse campo de desconto

  return {
    totalFornecedores,
    totalContratado,
    totalPago,
    totalPendente,
    taxaPagamento: Math.min(100, Math.max(0, taxaPagamento)),
    prazoMedioPagamento: Math.max(0, prazoMedioPagamento),
    fornecedorMaiorGasto,
    fornecedorMelhorPerformance,
    categoriaComMaiorGasto,
    tendenciaPagamentos,
    alertasVencimento,
    economia
  };
}

function analisarPagamentosTemporal(fornecedores: FornecedorAnalytics[]): PagamentosTemporal[] {
  // Agrupar por mês/ano
  const grupos = fornecedores.reduce((acc, item) => {
    const data = new Date(item.dataemissao);
    const periodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[periodo]) {
      acc[periodo] = {
        periodo,
        totalPago: 0,
        totalVencimentos: 0,
        pagamentos: [],
        vencimentos: []
      };
    }

    acc[periodo].totalPago += item.valorpago;
    acc[periodo].totalVencimentos += item.valorcp;
    
    if (item.datapagamento) {
      acc[periodo].pagamentos.push(item);
    }
    acc[periodo].vencimentos.push(item);

    return acc;
  }, {} as Record<string, any>);

  return Object.entries(grupos)
    .map(([periodo, grupo]: [string, any]) => {
      const pagamentosNoPrazo = grupo.pagamentos.filter((p: any) => p.diasAtraso <= 0).length;
      const pagamentosAtrasados = grupo.pagamentos.filter((p: any) => p.diasAtraso > 0).length;
      const eficiencia = grupo.pagamentos.length > 0 ? (pagamentosNoPrazo / grupo.pagamentos.length) * 100 : 0;
      const valorMedioTransacao = grupo.vencimentos.length > 0 ? grupo.totalVencimentos / grupo.vencimentos.length : 0;

      return {
        periodo,
        totalPago: grupo.totalPago,
        totalVencimentos: grupo.totalVencimentos,
        pagamentosNoPrazo,
        pagamentosAtrasados,
        eficiencia: Math.min(100, Math.max(0, eficiencia)),
        valorMedioTransacao
      };
    })
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

function categorizarFornecedor(item: any): string {
  const descricao = (item.descricaocontacontabil || '').toLowerCase();
  const fornecedor = (item.fornecedor || '').toLowerCase();
  const tipo = (item.tipocp || '').toLowerCase();

  if (descricao.includes('obra') || descricao.includes('reforma') || descricao.includes('construç')) {
    return 'Obras e Reformas';
  }
  if (descricao.includes('serviço') || fornecedor.includes('consultoria') || tipo.includes('serviço')) {
    return 'Serviços Profissionais';
  }
  if (descricao.includes('manutenç') || descricao.includes('reparo') || descricao.includes('conservaç')) {
    return 'Manutenção';
  }
  if (descricao.includes('tecnologia') || descricao.includes('software') || descricao.includes('sistema')) {
    return 'Tecnologia';
  }
  if (descricao.includes('marketing') || descricao.includes('publicidade') || descricao.includes('propaganda')) {
    return 'Marketing';
  }
  if (fornecedor.includes('fornecedor') || tipo.includes('operacional')) {
    return 'Fornecedores Operacionais';
  }

  return 'Outros';
}

function processarAlertas(dados: any[], diasAlerta: number) {
  const hoje = new Date();
  
  return dados.map(item => {
    const vencimento = new Date(item.datavencimento);
    const diasParaVencimento = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgencia: 'alta' | 'media' | 'baixa';
    if (diasParaVencimento < 0) urgencia = 'alta';
    else if (diasParaVencimento <= 3) urgencia = 'alta';
    else if (diasParaVencimento <= 7) urgencia = 'media';
    else urgencia = 'baixa';

    return {
      ...item,
      diasParaVencimento,
      urgencia,
      valorFormatado: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(item.valorcp)
    };
  });
}

function calcularHistoricoFornecedor(dados: any[]) {
  // Implementar análise histórica específica do fornecedor
  return {
    totalTransacoes: dados.length,
    valorTotal: dados.reduce((sum, item) => sum + (Number(item.valorcp) || 0), 0),
    eficienciaMedia: 85, // Placeholder
    tendencia: 'estavel' as const
  };
}

function calcularTendenciaFornecedor(dados: any[]) {
  // Implementar cálculo de tendência específica
  return {
    crescimento: 0,
    previsao: 'estavel' as const,
    confianca: 0.8
  };
}

function criarMetricasVazias(): MetricasFornecedores {
  return {
    totalFornecedores: 0,
    totalContratado: 0,
    totalPago: 0,
    totalPendente: 0,
    taxaPagamento: 0,
    prazoMedioPagamento: 0,
    fornecedorMaiorGasto: {} as RankingFornecedores,
    fornecedorMelhorPerformance: {} as RankingFornecedores,
    categoriaComMaiorGasto: 'N/A',
    tendenciaPagamentos: 'estavel',
    alertasVencimento: 0,
    economia: 0
  };
}