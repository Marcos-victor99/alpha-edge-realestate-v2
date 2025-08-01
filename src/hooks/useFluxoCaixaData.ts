import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatarData } from '@/lib/formatters';

// Interfaces para análise de fluxo de caixa
export interface MovimentacaoFluxo {
  id: string;
  data: string;
  shopping: string;
  fornecedor: string | null;
  tipoDocumento: string | null;
  origem: string | null;
  debito: number;
  credito: number;
  valorLiquido: number; // Crédito - Débito
  categoria: string;
  descricao: string;
}

export interface FluxoCaixaDiario {
  data: string;
  entradas: number;
  saidas: number;
  saldoLiquido: number;
  saldoAcumulado: number;
  transacoes: number;
}

export interface FluxoCaixaMensal {
  mes: string;
  ano: number;
  entradas: number;
  saidas: number;
  saldoLiquido: number;
  crescimentoEntradas: number;
  crescimentoSaidas: number;
  indiceLiquidez: number;
}

export interface AnaliseFluxoCaixa {
  saldoAtual: number;
  totalEntradas: number;
  totalSaidas: number;
  fluxoMedio: number;
  volatilidade: number;
  tendencia: 'crescimento' | 'declinio' | 'estavel';
  diasComSaldoPositivo: number;
  diasComSaldoNegativo: number;
  maiorEntrada: MovimentacaoFluxo;
  maiorSaida: MovimentacaoFluxo;
  periodoMaiorLiquidez: FluxoCaixaDiario;
  periodoMenorLiquidez: FluxoCaixaDiario;
}

export interface FluxoPorCategoria {
  categoria: string;
  entradas: number;
  saidas: number;
  saldoLiquido: number;
  participacaoEntradas: number;
  participacaoSaidas: number;
  transacoes: number;
  cor: string;
}

export interface FiltrosFluxoCaixa {
  dataInicio?: string;
  dataFim?: string;
  shopping?: string;
  fornecedor?: string;
  tipoMovimentacao?: 'entradas' | 'saidas' | 'todas';
  valorMinimo?: number;
  valorMaximo?: number;
  periodo?: string; // Suporte a períodos como '7d', '30d', '90d'
}

// Função utilitária para criar filtros baseados em período
export function criarFiltrosPorPeriodo(periodo: string, outrosFiltros: Omit<FiltrosFluxoCaixa, 'periodo' | 'dataInicio' | 'dataFim'> = {}): FiltrosFluxoCaixa {
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

// Hook principal para análise de fluxo de caixa
export const useFluxoCaixaData = (filtros: FiltrosFluxoCaixa = {}) => {
  // Processar filtros para conversão automática de período
  const filtrosProcessados = (() => {
    if (filtros.periodo && !filtros.dataInicio && !filtros.dataFim) {
      // Se período fornecido sem datas explícitas, converter automaticamente
      return criarFiltrosPorPeriodo(filtros.periodo, filtros);
    }
    return filtros;
  })();

  return useQuery({
    queryKey: ['fluxo_caixa_analytics', filtrosProcessados],
    queryFn: async (): Promise<{
      movimentacoes: MovimentacaoFluxo[];
      fluxoDiario: FluxoCaixaDiario[];
      fluxoMensal: FluxoCaixaMensal[];
      analise: AnaliseFluxoCaixa;
      porCategoria: FluxoPorCategoria[];
    }> => {
      try {
        // Query base com filtros
        let query = supabase
          .from('movimentacoes_financeiras')
          .select(`
            id,
            Data,
            Shopping,
            Fornecedor,
            TipoDocumento,
            Origem,
            Debito,
            Credito,
            Valor,
            Historico
          `)
          .not('Data', 'is', null)
          .order('Data', { ascending: false });

        // Aplicar filtros (usar filtrosProcessados que já tem datas convertidas)
        if (filtrosProcessados.dataInicio) {
          query = query.gte('Data', filtrosProcessados.dataInicio);
        }
        if (filtrosProcessados.dataFim) {
          query = query.lte('Data', filtrosProcessados.dataFim);
        }
        if (filtros.shopping) {
          query = query.eq('Shopping', filtros.shopping);
        }
        if (filtros.fornecedor) {
          query = query.eq('Fornecedor', filtros.fornecedor);
        }

        const { data: rawData, error } = await query.limit(2000);

        if (error) {
          console.error('❌ Erro ao buscar dados de fluxo de caixa:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            filtros: filtrosProcessados,
            timestamp: new Date().toISOString()
          });
          
          // Fallback graceful: retornar dados vazios
          console.warn('🔄 Ativando fallback para fluxo de caixa');
          return {
            movimentacoes: [],
            fluxoDiario: [],
            fluxoMensal: [],
            analise: criarAnaliseVazia(),
            porCategoria: []
          };
        }

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn('⚠️ Nenhuma movimentação financeira encontrada', {
            filtros: filtrosProcessados,
            rawDataType: typeof rawData,
            isArray: Array.isArray(rawData),
            length: rawData?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          return {
            movimentacoes: [],
            fluxoDiario: [],
            fluxoMensal: [],
            analise: criarAnaliseVazia(),
            porCategoria: []
          };
        }

        // Processar dados
        const movimentacoesPProcessadas = processarMovimentacoes(rawData, filtros);
        const fluxoDiario = calcularFluxoDiario(movimentacoesPProcessadas);
        const fluxoMensal = calcularFluxoMensal(movimentacoesPProcessadas);
        const analise = calcularAnaliseFluxo(movimentacoesPProcessadas, fluxoDiario);
        const porCategoria = agruparPorCategoria(movimentacoesPProcessadas);

        console.log(`✅ Fluxo de caixa processado: ${movimentacoesPProcessadas.length} movimentações`);

        return {
          movimentacoes: movimentacoesPProcessadas,
          fluxoDiario,
          fluxoMensal,
          analise,
          porCategoria
        };

      } catch (error) {
        console.error('💥 Erro crítico no fluxo de caixa:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          filtros: filtrosProcessados,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
        });
        
        // Fallback final com dados vazios
        console.warn('🚨 Tentando fallback final para fluxo de caixa');
        try {
          return {
            movimentacoes: [],
            fluxoDiario: [],
            fluxoMensal: [],
            analise: criarAnaliseVazia(),
            porCategoria: []
          };
        } catch (fallbackError) {
          console.error('💀 Falha total no fallback de fluxo de caixa:', fallbackError);
          throw new Error('Erro crítico no sistema de fluxo de caixa. Contate o suporte.');
        }
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutos (dados mais dinâmicos)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook para análise de liquidez em tempo real
export const useLiquidezRealTime = () => {
  return useQuery({
    queryKey: ['liquidez_realtime'],
    queryFn: async () => {
      // Buscar movimentações dos últimos 7 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 7);

      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select('Data, Debito, Credito, Valor')
        .gte('Data', dataLimite.toISOString().split('T')[0])
        .order('Data', { ascending: false });

      if (error) throw error;

      return calcularIndicadoresLiquidez(data || []);
    },
    staleTime: 30 * 1000, // 30 segundos para dados em tempo real
    refetchInterval: 60 * 1000, // Atualizar a cada minuto
  });
};

// Hook para projeções de fluxo de caixa
export const useProjecaoFluxoCaixa = (diasProjecao: number = 30) => {
  return useQuery({
    queryKey: ['projecao_fluxo', diasProjecao],
    queryFn: async () => {
      // Buscar dados históricos para projeção
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 90); // 90 dias históricos

      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select('Data, Debito, Credito')
        .gte('Data', dataInicio.toISOString().split('T')[0])
        .order('Data', { ascending: true });

      if (error) throw error;

      return calcularProjecoes(data || [], diasProjecao);
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

// Funções auxiliares para processamento
function processarMovimentacoes(rawData: any[], filtros: FiltrosFluxoCaixa): MovimentacaoFluxo[] {
  return rawData
    .map((item) => {
      const debito = Number(item.Debito) || 0;
      const credito = Number(item.Credito) || 0;
      const valorLiquido = credito - debito;

      // Aplicar filtros adicionais
      if (filtros.tipoMovimentacao === 'entradas' && credito <= 0) return null;
      if (filtros.tipoMovimentacao === 'saidas' && debito <= 0) return null;
      if (filtros.valorMinimo && Math.abs(valorLiquido) < filtros.valorMinimo) return null;
      if (filtros.valorMaximo && Math.abs(valorLiquido) > filtros.valorMaximo) return null;

      return {
        id: item.id?.toString() || Math.random().toString(),
        data: item.Data,
        shopping: item.Shopping || 'N/A',
        fornecedor: item.Fornecedor,
        tipoDocumento: item.TipoDocumento,
        origem: item.Origem,
        debito,
        credito,
        valorLiquido,
        categoria: categorizarMovimentacao(item),
        descricao: item.Historico || 'Sem descrição'
      };
    })
    .filter(Boolean) as MovimentacaoFluxo[];
}

function calcularFluxoDiario(movimentacoes: MovimentacaoFluxo[]): FluxoCaixaDiario[] {
  // Agrupar por data
  const grupos = movimentacoes.reduce((acc, mov) => {
    const data = mov.data.split('T')[0]; // Pegar apenas a data (YYYY-MM-DD)
    
    if (!acc[data]) {
      acc[data] = {
        data,
        entradas: 0,
        saidas: 0,
        saldoLiquido: 0,
        transacoes: 0
      };
    }

    acc[data].entradas += mov.credito;
    acc[data].saidas += mov.debito;
    acc[data].saldoLiquido += mov.valorLiquido;
    acc[data].transacoes += 1;

    return acc;
  }, {} as Record<string, any>);

  // Converter para array e calcular saldo acumulado
  const fluxoDiario = Object.values(grupos)
    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());

  let saldoAcumulado = 0;
  return fluxoDiario.map((dia: any) => {
    saldoAcumulado += dia.saldoLiquido;
    return {
      ...dia,
      saldoAcumulado
    };
  });
}

function calcularFluxoMensal(movimentacoes: MovimentacaoFluxo[]): FluxoCaixaMensal[] {
  // Agrupar por mês/ano
  const grupos = movimentacoes.reduce((acc, mov) => {
    const data = new Date(mov.data);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[chave]) {
      acc[chave] = {
        mes: String(data.getMonth() + 1).padStart(2, '0'),
        ano: data.getFullYear(),
        entradas: 0,
        saidas: 0,
        saldoLiquido: 0
      };
    }

    acc[chave].entradas += mov.credito;
    acc[chave].saidas += mov.debito;
    acc[chave].saldoLiquido += mov.valorLiquido;

    return acc;
  }, {} as Record<string, any>);

  // Converter para array e calcular crescimentos
  const meses = Object.values(grupos)
    .sort((a: any, b: any) => {
      const dataA = new Date(a.ano, parseInt(a.mes) - 1);
      const dataB = new Date(b.ano, parseInt(b.mes) - 1);
      return dataA.getTime() - dataB.getTime();
    });

  return meses.map((mes: any, index: number) => {
    const mesAnterior = meses[index - 1];
    
    const crescimentoEntradas = mesAnterior && mesAnterior.entradas > 0 ?
      ((mes.entradas - mesAnterior.entradas) / mesAnterior.entradas) * 100 : 0;
    
    const crescimentoSaidas = mesAnterior && mesAnterior.saidas > 0 ?
      ((mes.saidas - mesAnterior.saidas) / mesAnterior.saidas) * 100 : 0;

    const indiceLiquidez = mes.saidas > 0 ? mes.entradas / mes.saidas : 0;

    return {
      ...mes,
      crescimentoEntradas: Math.max(-100, Math.min(500, crescimentoEntradas)),
      crescimentoSaidas: Math.max(-100, Math.min(500, crescimentoSaidas)),
      indiceLiquidez: Math.max(0, Math.min(10, indiceLiquidez))
    };
  });
}

function calcularAnaliseFluxo(movimentacoes: MovimentacaoFluxo[], fluxoDiario: FluxoCaixaDiario[]): AnaliseFluxoCaixa {
  if (movimentacoes.length === 0) return criarAnaliseVazia();

  const saldoAtual = fluxoDiario[fluxoDiario.length - 1]?.saldoAcumulado || 0;
  const totalEntradas = movimentacoes.reduce((sum, mov) => sum + mov.credito, 0);
  const totalSaidas = movimentacoes.reduce((sum, mov) => sum + mov.debito, 0);
  const fluxoMedio = movimentacoes.reduce((sum, mov) => sum + mov.valorLiquido, 0) / movimentacoes.length;

  // Calcular volatilidade
  const mediaValorLiquido = movimentacoes.reduce((sum, mov) => sum + mov.valorLiquido, 0) / movimentacoes.length;
  const variancia = movimentacoes.reduce((sum, mov) => 
    sum + Math.pow(mov.valorLiquido - mediaValorLiquido, 2), 0) / movimentacoes.length;
  const volatilidade = Math.sqrt(variancia);

  // Determinar tendência
  const ultimosTresMeses = fluxoDiario.slice(-90); // Últimos 90 dias
  const primeirosTresMeses = fluxoDiario.slice(0, 90);
  
  let tendencia: 'crescimento' | 'declinio' | 'estavel' = 'estavel';
  if (ultimosTresMeses.length > 0 && primeirosTresMeses.length > 0) {
    const saldoRecente = ultimosTresMeses[ultimosTresMeses.length - 1]?.saldoLiquido || 0;
    const saldoAntigo = primeirosTresMeses[primeirosTresMeses.length - 1]?.saldoLiquido || 0;
    
    if (saldoRecente > saldoAntigo * 1.05) tendencia = 'crescimento';
    else if (saldoRecente < saldoAntigo * 0.95) tendencia = 'declinio';
  }

  // Contar dias com saldo positivo/negativo
  const diasComSaldoPositivo = fluxoDiario.filter(dia => dia.saldoLiquido > 0).length;
  const diasComSaldoNegativo = fluxoDiario.filter(dia => dia.saldoLiquido < 0).length;

  // Encontrar maiores movimentações
  const maiorEntrada = movimentacoes.reduce((max, mov) => 
    mov.credito > max.credito ? mov : max, movimentacoes[0]);
  
  const maiorSaida = movimentacoes.reduce((max, mov) => 
    mov.debito > max.debito ? mov : max, movimentacoes[0]);

  // Períodos de maior e menor liquidez
  const periodoMaiorLiquidez = fluxoDiario.reduce((max, dia) => 
    dia.saldoLiquido > max.saldoLiquido ? dia : max, fluxoDiario[0]);
  
  const periodoMenorLiquidez = fluxoDiario.reduce((min, dia) => 
    dia.saldoLiquido < min.saldoLiquido ? dia : min, fluxoDiario[0]);

  return {
    saldoAtual,
    totalEntradas,
    totalSaidas,
    fluxoMedio,
    volatilidade,
    tendencia,
    diasComSaldoPositivo,
    diasComSaldoNegativo,
    maiorEntrada,
    maiorSaida,
    periodoMaiorLiquidez,
    periodoMenorLiquidez
  };
}

function agruparPorCategoria(movimentacoes: MovimentacaoFluxo[]): FluxoPorCategoria[] {
  const grupos = movimentacoes.reduce((acc, mov) => {
    if (!acc[mov.categoria]) {
      acc[mov.categoria] = {
        categoria: mov.categoria,
        entradas: 0,
        saidas: 0,
        saldoLiquido: 0,
        transacoes: 0
      };
    }

    acc[mov.categoria].entradas += mov.credito;
    acc[mov.categoria].saidas += mov.debito;
    acc[mov.categoria].saldoLiquido += mov.valorLiquido;
    acc[mov.categoria].transacoes += 1;

    return acc;
  }, {} as Record<string, any>);

  const totalEntradas = Object.values(grupos).reduce((sum: number, grupo: any) => sum + grupo.entradas, 0);
  const totalSaidas = Object.values(grupos).reduce((sum: number, grupo: any) => sum + grupo.saidas, 0);

  // Cores para categorias
  const coresCategorias: Record<string, string> = {
    'Receitas Operacionais': 'hsl(var(--chart-1))',
    'Pagamentos Fornecedores': 'hsl(var(--chart-2))',
    'Despesas Administrativas': 'hsl(var(--chart-3))',
    'Impostos e Taxas': 'hsl(var(--chart-4))',
    'Investimentos': 'hsl(var(--chart-5))',
    'Financiamentos': 'hsl(var(--chart-bull))',
    'Outros': 'hsl(var(--chart-neutral))'
  };

  return Object.entries(grupos)
    .map(([categoria, grupo]: [string, any]) => ({
      categoria,
      entradas: grupo.entradas,
      saidas: grupo.saidas,
      saldoLiquido: grupo.saldoLiquido,
      participacaoEntradas: totalEntradas > 0 ? (grupo.entradas / totalEntradas) * 100 : 0,
      participacaoSaidas: totalSaidas > 0 ? (grupo.saidas / totalSaidas) * 100 : 0,
      transacoes: grupo.transacoes,
      cor: coresCategorias[categoria] || coresCategorias['Outros']
    }))
    .sort((a, b) => Math.abs(b.saldoLiquido) - Math.abs(a.saldoLiquido));
}

function categorizarMovimentacao(item: any): string {
  const historico = (item.Historico || '').toLowerCase();
  const fornecedor = (item.Fornecedor || '').toLowerCase();
  const origem = (item.Origem || '').toLowerCase();

  // Categorizar baseado no histórico, fornecedor e origem
  if (historico.includes('receita') || origem.includes('recebimento') || item.Credito > item.Debito) {
    return 'Receitas Operacionais';
  }
  if (fornecedor.includes('fornecedor') || historico.includes('pagamento fornecedor')) {
    return 'Pagamentos Fornecedores';
  }
  if (historico.includes('imposto') || historico.includes('taxa') || fornecedor.includes('prefeitura')) {
    return 'Impostos e Taxas';
  }
  if (historico.includes('investimento') || historico.includes('obras') || historico.includes('reforma')) {
    return 'Investimentos';
  }
  if (historico.includes('financiamento') || historico.includes('empréstimo') || fornecedor.includes('banco')) {
    return 'Financiamentos';
  }
  if (historico.includes('administrativ') || historico.includes('escritório')) {
    return 'Despesas Administrativas';
  }

  return 'Outros';
}

function calcularIndicadoresLiquidez(movimentacoes: any[]) {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const movimentacoesHoje = movimentacoes.filter(mov => 
    new Date(mov.Data).toDateString() === hoje.toDateString());
  
  const movimentacoesOntem = movimentacoes.filter(mov => 
    new Date(mov.Data).toDateString() === ontem.toDateString());

  const saldoHoje = movimentacoesHoje.reduce((sum, mov) => 
    sum + (Number(mov.Credito) || 0) - (Number(mov.Debito) || 0), 0);
  
  const saldoOntem = movimentacoesOntem.reduce((sum, mov) => 
    sum + (Number(mov.Credito) || 0) - (Number(mov.Debito) || 0), 0);

  const variacao = saldoOntem !== 0 ? ((saldoHoje - saldoOntem) / Math.abs(saldoOntem)) * 100 : 0;

  return {
    saldoHoje,
    saldoOntem,
    variacao,
    status: saldoHoje > 0 ? 'positivo' : 'negativo',
    tendencia: variacao > 5 ? 'crescimento' : variacao < -5 ? 'declinio' : 'estavel'
  };
}

function calcularProjecoes(historico: any[], diasProjecao: number) {
  // Implementar lógica de projeção baseada em médias móveis e tendências
  const mediaDiaria = historico.reduce((sum, mov) => 
    sum + (Number(mov.Credito) || 0) - (Number(mov.Debito) || 0), 0) / historico.length;

  const projecoes = [];
  let saldoProjetado = 0;

  for (let i = 0; i < diasProjecao; i++) {
    const data = new Date();
    data.setDate(data.getDate() + i + 1);
    
    saldoProjetado += mediaDiaria;
    
    projecoes.push({
      data: data.toISOString().split('T')[0],
      saldoProjetado,
      fluxoEsperado: mediaDiaria,
      confianca: Math.max(0.3, 0.9 - (i / diasProjecao) * 0.6) // Diminui confiança com o tempo
    });
  }

  return projecoes;
}

function criarAnaliseVazia(): AnaliseFluxoCaixa {
  return {
    saldoAtual: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    fluxoMedio: 0,
    volatilidade: 0,
    tendencia: 'estavel',
    diasComSaldoPositivo: 0,
    diasComSaldoNegativo: 0,
    maiorEntrada: {} as MovimentacaoFluxo,
    maiorSaida: {} as MovimentacaoFluxo,
    periodoMaiorLiquidez: {} as FluxoCaixaDiario,
    periodoMenorLiquidez: {} as FluxoCaixaDiario
  };
}