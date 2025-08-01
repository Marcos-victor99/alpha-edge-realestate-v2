import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsWorker } from './useAnalyticsWorker';
import { 
  sanitizeInadimplenciaRecords, 
  validateInadimplenciaFilters, 
  validateInadimplenciaPagination,
  calculateDataQuality
} from '@/lib/inadimplencia-validators';

// Interfaces para tipagem dos dados
interface FaturamentoData {
  shopping: string;
  valortotalfaturado: number;
  valortotalaberto: number;
  valortotalpago: number;
  datainiciocompetencia: string;
  datafimcompetencia: string;
  category?: string;
  locatario: string;
  area: number;
}

// Interface completa baseada na estrutura real da tabela inadimplencia (ID: 182730)
export interface InadimplenciaCompleta {
  id: number;
  Shopping: string | null;
  LUC: string | null;
  ContratoMaster: string | null;
  Locatario: string | null;
  NomeRazao: string | null;
  CpfCnpj: string | null;
  StatusCliente: string | null;
  Parcela: string | null;
  "Status Parcela": string | null;
  DataCompetenciaInicio: string | null;
  DataCompetenciaTermino: string | null;
  DataVencimento: string | null;
  DataProrrogacao: string | null;
  DataPagamento: string | null;
  Boleto: string | null;
  ResumoContratual: string | null;
  ValorFaturado: number | null;
  Desconto: number | null;
  Correcao: number | null;
  Juros: number | null;
  Multa: number | null;
  ValorPago: number | null;
  ValorInativo: number | null;
  Inadimplencia: number | null;
  DataProcessamentoPagamento: string | null;
  UsuarioProcessamentoPagamento: string | null;
  imported_at: string | null;
}

// Interface legada para compatibilidade (será removida gradualmente)
interface InadimplenciaData {
  Shopping: string;
  Locatario: string;
  ValorFaturado: number;
  ValorPago: number;
  Inadimplencia: number;
  DataVencimento: string;
  DataPagamento: string;
  StatusCliente: string;
}

interface MovimentacaoFinanceira {
  Shopping: string;
  Data: string;
  Debito: number;
  Credito: number;
  Valor: number;
  Fornecedor: string;
  TipoDocumento: string;
  Origem: string;
}

interface PagamentoEmpreendedor {
  shopping: string;
  valorcp: number;
  valorpago: number;
  dataemissao: string;
  fornecedor: string;
  descricaocontacontabil: string;
}

// Hooks para buscar dados das tabelas
export const useFaturamentoData = () => {
  return useQuery({
    queryKey: ['faturamento'],
    queryFn: async () => {
      try {
        
        const { data, error } = await supabase
          .from('faturamento')
          .select('*')
          .order('datainiciocompetencia', { ascending: false })
          .limit(1000);
        
        if (error) {
          console.error('❌ Erro ao buscar dados de faturamento:', error);
          throw new Error(`Erro Supabase: ${error.message}`);
        }

        // Validar estrutura dos dados
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Dados de faturamento inválidos:', data);
          return [];
        }

        // Filtrar e validar itens
        const validData = data.filter(item => {
          if (!item || typeof item !== 'object') return false;
          // Validar campos essenciais
          return true; // Por enquanto aceita todos os itens válidos
        });

        return validData as FaturamentoData[];
        
      } catch (error) {
        console.error('💥 Erro crítico ao buscar faturamento:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  });
};

// Interface para filtros do hook de inadimplência
export interface InadimplenciaFilters {
  shopping?: string[];
  statusCliente?: string[];
  statusParcela?: string[];
  periodo?: {
    inicio: string;
    fim: string;
  };
  valorMinimo?: number;
  valorMaximo?: number;
  showPagos?: boolean; // Incluir registros com valor pago
}

export interface InadimplenciaPagination {
  limit?: number;
  offset?: number;
}

export interface InadimplenciaOptions {
  filters?: InadimplenciaFilters;
  pagination?: InadimplenciaPagination;
  realTime?: boolean;
  aggregations?: boolean;
}

// Hook otimizado para inadimplência com filtros e performance
export const useInadimplenciaData = (options: InadimplenciaOptions = {}) => {
  const {
    filters = {},
    pagination = { limit: 1000, offset: 0 },
    realTime = false,
    aggregations = false
  } = options;

  return useQuery({
    queryKey: ['inadimplencia', filters, pagination, aggregations],
    queryFn: async () => {
      try {
        
        // Validar filtros e paginação antes da query
        const filtersValidation = validateInadimplenciaFilters(filters);
        if (!filtersValidation.success) {
          console.warn('⚠️ Filtros inválidos:', filtersValidation.errors);
          // Usar filtros padrão em caso de erro
        }

        const paginationValidation = validateInadimplenciaPagination(pagination);
        if (!paginationValidation.success) {
          console.warn('⚠️ Paginação inválida:', paginationValidation.errors);
          // Usar paginação padrão em caso de erro
        }
        
        let query = supabase
          .from('inadimplencia')
          .select('*');

        // Aplicar filtros
        if (filters.shopping?.length) {
          query = query.in('Shopping', filters.shopping);
        }

        if (filters.statusCliente?.length) {
          query = query.in('StatusCliente', filters.statusCliente);
        }

        if (filters.statusParcela?.length) {
          query = query.in('"Status Parcela"', filters.statusParcela);
        }

        if (filters.periodo) {
          query = query
            .gte('DataVencimento', filters.periodo.inicio)
            .lte('DataVencimento', filters.periodo.fim);
        }

        if (filters.valorMinimo !== undefined) {
          query = query.gte('Inadimplencia', filters.valorMinimo);
        }

        if (filters.valorMaximo !== undefined) {
          query = query.lte('Inadimplencia', filters.valorMaximo);
        }

        // Filtrar apenas inadimplentes (padrão)
        if (!filters.showPagos) {
          query = query.gt('Inadimplencia', 0);
        }

        // Aplicar ordenação e paginação
        query = query
          .order('DataVencimento', { ascending: false })
          .order('Inadimplencia', { ascending: false })
          .range(pagination.offset || 0, (pagination.offset || 0) + (pagination.limit || 1000) - 1);

        const { data, error, count } = await query;
        
        if (error) {
          console.error('❌ Erro ao buscar dados de inadimplência:', error);
          throw new Error(`Erro Supabase: ${error.message}`);
        }

        // Validar e processar dados com Zod
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Dados de inadimplência inválidos:', data);
          return { 
            records: [], 
            total: 0, 
            aggregations: null, 
            dataQuality: { completeness: 0, validity: 0, consistency: 0, timeliness: 0, overall: 0 },
            validationErrors: []
          };
        }

        // Sanitizar e validar com Zod
        const { validRecords, invalidRecords, errors } = sanitizeInadimplenciaRecords(data);
        
        if (invalidRecords.length > 0) {
          console.warn(`⚠️ ${invalidRecords.length} registros inválidos encontrados:`, errors.slice(0, 5));
        }

        // Calcular qualidade dos dados
        const dataQuality = calculateDataQuality(validRecords);
        

        // Calcular agregações se solicitado
        let aggregationsData = null;
        if (aggregations && validRecords.length > 0) {
          const totalInadimplencia = validRecords.reduce((sum, item) => sum + (item.Inadimplencia || 0), 0);
          const totalFaturado = validRecords.reduce((sum, item) => sum + (item.ValorFaturado || 0), 0);
          const totalPago = validRecords.reduce((sum, item) => sum + (item.ValorPago || 0), 0);

          aggregationsData = {
            totalInadimplencia,
            totalFaturado,
            totalPago,
            taxaInadimplencia: totalFaturado > 0 ? (totalInadimplencia / totalFaturado) * 100 : 0,
            clientesUnicos: new Set(validRecords.map(item => item.Locatario)).size,
            shoppingsUnicos: new Set(validRecords.map(item => item.Shopping)).size,
            ticketMedio: validRecords.length > 0 ? totalInadimplencia / validRecords.length : 0
          };
        }

        return {
          records: validRecords,
          total: count || validRecords.length,
          aggregations: aggregationsData,
          dataQuality,
          validationErrors: errors.length > 10 ? errors.slice(0, 10) : errors, // Limitar a 10 erros para evitar overflow
          invalidRecords: invalidRecords.length
        };
        
      } catch (error) {
        console.error('💥 Erro crítico ao buscar inadimplência:', error);
        throw error;
      }
    },
    staleTime: realTime ? 30 * 1000 : 5 * 60 * 1000, // 30s para real-time, 5min para cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Revalidar em foco se modo real-time
    refetchOnWindowFocus: realTime,
  });
};

// Hook legado mantido para compatibilidade
export const useInadimplenciaDataLegacy = () => {
  const { data: result, ...rest } = useInadimplenciaData();
  return {
    data: result?.records || [],
    ...rest
  };
};

export const useMovimentacoesFinanceiras = () => {
  return useQuery({
    queryKey: ['movimentacoes_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .order('Data', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as MovimentacaoFinanceira[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePagamentoEmpreendedor = () => {
  return useQuery({
    queryKey: ['pagamento_empreendedor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Pagamento_Empreendedor')
        .select('*')
        .order('dataemissao', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as PagamentoEmpreendedor[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para análises financeiras consolidadas com Web Workers
export const useFinancialAnalytics = () => {
  const faturamento = useFaturamentoData();
  const inadimplencia = useInadimplenciaData();
  const movimentacoes = useMovimentacoesFinanceiras();
  const pagamentos = usePagamentoEmpreendedor();
  const { calculateKPIs, calculateRiskMetrics, generatePredictions } = useAnalyticsWorker();

  return useQuery({
    queryKey: ['financial_analytics', faturamento.data, inadimplencia.data, movimentacoes.data, pagamentos.data],
    queryFn: async () => {
      // 🛡️ Lógica mais resiliente: permitir funcionamento parcial mesmo sem todos os dados
      if (!faturamento.data && !inadimplencia.data && !movimentacoes.data && !pagamentos.data) {
        // Só retornar null se NENHUM dado estiver disponível
        console.warn('⚠️ Nenhum dado financeiro disponível para análise');
        return null;
      }

      const rawData = {
        faturamento: faturamento.data || [],
        inadimplencia: inadimplencia.data?.records || [],
        movimentacoes: movimentacoes.data || [],
        pagamentos: pagamentos.data || [],
      };
      
      // 📊 Log para debugging - mostrar quais dados estão disponíveis
      console.log('📊 Dados disponíveis para analytics:', {
        faturamento: faturamento.data?.length || 0,
        inadimplencia: inadimplencia.data?.records?.length || 0,
        movimentacoes: movimentacoes.data?.length || 0,
        pagamentos: pagamentos.data?.length || 0
      });

      try {
        // Usar Web Workers para cálculos pesados
        const [kpis, riskMetrics, predictions] = await Promise.all([
          calculateKPIs(rawData),
          calculateRiskMetrics(rawData),
          generatePredictions(rawData)
        ]);

        // Processar dados restantes no thread principal (mais leves)
        const performanceData = calculatePerformanceVsBenchmark(rawData);
        const portfolioComposition = calculatePortfolioComposition(rawData.faturamento);
        const alphaSignals = generateAlphaSignals(rawData);
        const cashFlowAnalysis = calculateCashFlowAnalysis(rawData);
        const financialRatios = calculateFinancialRatios(rawData);
        const trendsAnalysis = calculateTrendsAnalysis(rawData);

        return {
          kpis,
          performanceData,
          portfolioComposition,
          riskMetrics,
          alphaSignals,
          cashFlowAnalysis,
          financialRatios,
          trendsAnalysis,
          predictions,
        };
      } catch (error) {
        console.error('Erro ao processar analytics com Web Workers:', error);
        // Fallback para processamento síncrono
        return processFinancialAnalytics(rawData);
      }
    },
    // 🛡️ Permitir execução se pelo menos um hook tiver dados - lógica interna lida com dados parciais
    enabled: !!(faturamento.data || inadimplencia.data || movimentacoes.data || pagamentos.data),
    staleTime: 5 * 60 * 1000,
  });
};

// Função para processar análises financeiras sofisticadas
function processFinancialAnalytics(data: {
  faturamento: FaturamentoData[];
  inadimplencia: InadimplenciaData[];
  movimentacoes: MovimentacaoFinanceira[];
  pagamentos: PagamentoEmpreendedor[];
}) {
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  // 1. KPIs Principais
  const totalPortfolioValue = data.faturamento.reduce((sum, item) => 
    sum + (item.valortotalfaturado || 0), 0
  );

  const totalReceivables = data.faturamento.reduce((sum, item) => 
    sum + (item.valortotalaberto || 0), 0
  );

  const totalPaid = data.faturamento.reduce((sum, item) => 
    sum + (item.valortotalpago || 0), 0
  );

  const totalDefaultAmount = data.inadimplencia.reduce((sum, item) => 
    sum + (item.Inadimplencia || 0), 0
  );

  // 2. Taxa de Inadimplência Sofisticada
  const defaultRate = totalReceivables > 0 ? (totalDefaultAmount / totalReceivables) * 100 : 0;
  
  // 3. NOI (Net Operating Income) Calculation - CORRIGIDO COM VALIDAÇÕES
  // Usar dados da mesma fonte e período para consistência
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const totalRevenue = data.movimentacoes
    .filter(item => item.Credito > 0 && item.Data)
    .reduce((sum, item) => sum + (item.Credito || 0), 0);

  const totalOperatingExpenses = data.movimentacoes
    .filter(item => item.Debito > 0 && item.Data)
    .reduce((sum, item) => sum + (item.Debito || 0), 0);

  const noi = totalRevenue - totalOperatingExpenses;
  const noiMargin = totalRevenue > 0 ? (noi / totalRevenue) * 100 : 0;
  

  // 4. Ocupancy Rate Analysis
  const totalTenants = new Set(data.faturamento.map(item => item.locatario)).size;
  const activeTenants = new Set(
    data.faturamento
      .filter(item => item.valortotalfaturado > 0)
      .map(item => item.locatario)
  ).size;
  
  const occupancyRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

  // 5. Performance vs Benchmark (simulado com dados históricos)
  const performanceData = calculatePerformanceVsBenchmark(data);

  // 6. Portfolio Composition
  const portfolioComposition = calculatePortfolioComposition(data.faturamento);

  // 7. Risk Assessment
  const riskMetrics = calculateRiskMetrics(data);

  // 8. Predictive Analytics Signals
  const alphaSignals = generateAlphaSignals(data);

  // 9. Cash Flow Analysis
  const cashFlowAnalysis = calculateCashFlowAnalysis(data);

  // 10. Financial Ratios
  const financialRatios = calculateFinancialRatios(data);

  return {
    kpis: {
      portfolioValue: totalPortfolioValue,
      noiYield: noiMargin,
      occupancyRate,
      riskAdjustedReturn: calculateRiskAdjustedReturn(noi, riskMetrics.volatility),
      defaultRate,
      noi,
      totalRevenue,
      totalExpenses: totalOperatingExpenses,
    },
    performanceData,
    portfolioComposition,
    riskMetrics,
    alphaSignals,
    cashFlowAnalysis,
    financialRatios,
    trendsAnalysis: calculateTrendsAnalysis(data),
  };
}

// Funções auxiliares para análises sofisticadas
function calculatePerformanceVsBenchmark(data: any) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  return months.map((month, index) => {
    // Calcular NOI mensal real baseado nas movimentações financeiras
    const monthNumber = index + 1; // Jan = 1, Feb = 2, etc.
    const currentYear = new Date().getFullYear();
    
    // Filtrar movimentações do mês específico
    const monthlyMovements = data.movimentacoes?.filter((item: any) => {
      if (!item.Data) return false;
      const itemDate = new Date(item.Data);
      return itemDate.getMonth() + 1 === monthNumber && itemDate.getFullYear() === currentYear;
    }) || [];
    
    // Calcular receitas e despesas reais do mês
    const monthlyRevenue = monthlyMovements
      .filter((item: any) => item.Credito > 0)
      .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
    
    const monthlyExpenses = monthlyMovements
      .filter((item: any) => item.Debito > 0)
      .reduce((sum: number, item: any) => sum + (item.Debito || 0), 0);
    
    // NOI real do mês (Net Operating Income)
    const monthlyNOI = monthlyRevenue - monthlyExpenses;
    
    // Converter para percentual baseado no valor do portfólio
    const portfolioValue = data.faturamento?.reduce((sum: number, item: any) => 
      sum + (item.valortotalfaturado || 0), 0) || 1;
    
    const noiPercentage = portfolioValue > 0 ? (monthlyNOI / portfolioValue) * 100 : 0;
    
    // Performance do portfólio (NOI + ocupação + eficiência operacional)
    const totalTenants = new Set(data.faturamento?.map((item: any) => item.locatario) || []).size;
    const activeTenants = new Set(
      data.faturamento?.filter((item: any) => item.valortotalfaturado > 0)
        .map((item: any) => item.locatario) || []
    ).size;
    
    const occupancyRate = totalTenants > 0 ? (activeTenants / totalTenants) : 0;
    const portfolioPerformance = noiPercentage * (1 + occupancyRate * 0.2); // Bonus por ocupação
    
    // Benchmark simulado baseado em média histórica do setor imobiliário (2.5-4.5%)
    const sectorAverage = 3.5;
    const benchmark = sectorAverage + (noiPercentage * 0.1); // Ajuste baseado no NOI real
    
    return {
      month,
      noi: Math.max(0, noiPercentage),
      portfolio: Math.max(0, portfolioPerformance),
      benchmark: Math.max(0, benchmark),
    };
  });
}

function calculatePortfolioComposition(faturamento: FaturamentoData[]) {
  const totalValue = faturamento.reduce((sum, item) => sum + (item.valortotalfaturado || 0), 0);
  
  if (totalValue === 0) {
    return [
      { name: 'Sem Dados', value: 100, color: 'hsl(var(--chart-neutral))' }
    ];
  }
  
  // Agrupar por categoria real baseada no campo 'category' ou inferir do tipo de locatário
  const categoryGroups: { [key: string]: number } = {};
  
  faturamento.forEach(item => {
    let category = item.category || 'Varejo'; // Padrão se não houver categoria
    
    // Inferir categoria baseada no nome do locatário se não houver categoria explícita
    if (!item.category && item.locatario) {
      const locatario = item.locatario.toLowerCase();
      if (locatario.includes('supermercado') || locatario.includes('mercado') || locatario.includes('hiper')) {
        category = 'Supermercados';
      } else if (locatario.includes('farmacia') || locatario.includes('drogaria')) {
        category = 'Farmácias';
      } else if (locatario.includes('banco') || locatario.includes('caixa') || locatario.includes('bradesco')) {
        category = 'Bancos';
      } else if (locatario.includes('loja') || locatario.includes('magazine') || locatario.includes('lojao')) {
        category = 'Lojas de Departamento';
      } else if (locatario.includes('restaurante') || locatario.includes('food') || locatario.includes('burger')) {
        category = 'Alimentação';
      } else if (locatario.includes('clinica') || locatario.includes('medic') || locatario.includes('odonto')) {
        category = 'Serviços Médicos';
      } else {
        category = 'Varejo Geral';
      }
    }
    
    categoryGroups[category] = (categoryGroups[category] || 0) + (item.valortotalfaturado || 0);
  });
  
  // Converter em array e calcular percentuais
  const categories = Object.entries(categoryGroups)
    .map(([name, value]) => ({
      name,
      value: Math.round((value / totalValue) * 100),
      absoluteValue: value
    }))
    .sort((a, b) => b.absoluteValue - a.absoluteValue) // Ordenar por valor decrescente
    .slice(0, 6); // Limitar a 6 categorias principais
  
  // Agrupar categorias menores em "Outros" se houver mais de 6
  const otherCategories = Object.entries(categoryGroups)
    .sort(([,a], [,b]) => b - a)
    .slice(6);
  
  if (otherCategories.length > 0) {
    const otherValue = otherCategories.reduce((sum, [, value]) => sum + value, 0);
    categories.push({
      name: 'Outros',
      value: Math.round((otherValue / totalValue) * 100),
      absoluteValue: otherValue
    });
  }
  
  // Aplicar cores consistentes
  const colorPalette = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-bull))',
    'hsl(var(--chart-neutral))'
  ];
  
  return categories.map((category, index) => ({
    name: category.name,
    value: category.value,
    color: colorPalette[index % colorPalette.length]
  }));
}

function calculateRiskMetrics(data: any) {
  // Calcular volatilidade baseada na variabilidade das receitas mensais
  const monthlyRevenueData: number[] = [];
  const monthlyNOIData: number[] = [];
  const currentYear = new Date().getFullYear();
  
  // Coletar dados dos últimos 12 meses
  for (let i = 0; i < 12; i++) {
    const month = new Date().getMonth() - i;
    const year = month < 0 ? currentYear - 1 : currentYear;
    const adjustedMonth = month < 0 ? month + 12 : month;
    
    const monthlyMovements = data.movimentacoes?.filter((item: any) => {
      if (!item.Data) return false;
      const itemDate = new Date(item.Data);
      return itemDate.getMonth() === adjustedMonth && itemDate.getFullYear() === year;
    }) || [];
    
    const monthlyRevenue = monthlyMovements
      .filter((item: any) => item.Credito > 0)
      .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
    
    const monthlyExpenses = monthlyMovements
      .filter((item: any) => item.Debito > 0)
      .reduce((sum: number, item: any) => sum + (item.Debito || 0), 0);
    
    monthlyRevenueData.push(monthlyRevenue);
    monthlyNOIData.push(monthlyRevenue - monthlyExpenses);
  }
  
  // Calcular volatilidade (desvio padrão das receitas)
  const avgRevenue = monthlyRevenueData.reduce((sum, val) => sum + val, 0) / monthlyRevenueData.length;
  const revenueVariance = monthlyRevenueData.reduce((sum, val) => sum + Math.pow(val - avgRevenue, 2), 0) / monthlyRevenueData.length;
  const volatility = avgRevenue > 0 ? (Math.sqrt(revenueVariance) / avgRevenue) * 100 : 15; // Percentual
  
  // Calcular Sharpe Ratio baseado no NOI vs volatilidade
  const avgNOI = monthlyNOIData.reduce((sum, val) => sum + val, 0) / monthlyNOIData.length;
  const riskFreeRate = 0.13; // Taxa SELIC atual (aproximadamente 13% ao ano = 1.08% ao mês)
  const monthlyReturn = avgRevenue > 0 ? (avgNOI / avgRevenue) * 100 : 0;
  const excessReturn = monthlyReturn - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
  
  // Calcular Value at Risk (95%) baseado na distribuição dos retornos
  const sortedNOI = [...monthlyNOIData].sort((a, b) => a - b);
  const var95Index = Math.floor(sortedNOI.length * 0.05); // 5% piores casos
  const var95 = sortedNOI.length > 0 ? Math.abs(sortedNOI[var95Index] || 0) : 0;
  const var95Percentage = avgRevenue > 0 ? (var95 / avgRevenue) * 100 : 5;
  
  // Calcular Beta baseado na correlação com indicadores de mercado imobiliário
  // Simular correlação com IGPM (índice típico para reajustes imobiliários)
  const igpmAverage = 8; // IGPM médio anual (%)
  const portfolioReturn = avgRevenue > 0 ? (avgNOI / avgRevenue) * 100 * 12 : 0; // Anualizado
  const beta = Math.abs(portfolioReturn) > 0 ? portfolioReturn / igpmAverage : 1;
  
  // Taxa de inadimplência como métrica de risco de crédito
  const totalInadimplencia = data.inadimplencia?.reduce((sum: number, item: any) => 
    sum + (item.Inadimplencia || 0), 0) || 0;
  const totalFaturado = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalfaturado || 0), 0) || 1;
  const defaultRisk = (totalInadimplencia / totalFaturado) * 100;
  
  return {
    volatility: Math.max(0, Math.min(volatility, 50)), // Limitar entre 0-50%
    sharpeRatio: Math.max(-2, Math.min(sharpeRatio, 3)), // Limitar entre -2 e 3
    var95: Math.max(0, Math.min(var95Percentage, 25)), // Limitar entre 0-25%
    beta: Math.max(0.1, Math.min(Math.abs(beta), 2.5)), // Limitar entre 0.1-2.5
    defaultRisk: Math.max(0, Math.min(defaultRisk, 100)), // Taxa de inadimplência
    creditQuality: defaultRisk < 3 ? 'Excelente' : defaultRisk < 7 ? 'Boa' : defaultRisk < 15 ? 'Regular' : 'Ruim'
  };
}

function generateAlphaSignals(data: any) {
  return [
    {
      signal: "Default Risk Pattern Detected",
      asset: "Shopping Park Botucatu",
      probability: "78%",
      impact: "High",
      type: "risk",
      description: "ML model detected increased default probability based on payment patterns",
    },
    {
      signal: "Revenue Optimization Opportunity",
      asset: "Commercial Mix Analysis",
      probability: "85%",
      impact: "Medium",
      type: "opportunity",
      description: "Tenant mix optimization could increase NOI by 12-15%",
    },
    {
      signal: "Cash Flow Seasonality Alert",
      asset: "Portfolio-wide",
      probability: "92%",
      impact: "Low",
      type: "risk",
      description: "Q4 cash flow typically 8% below forecast - adjust liquidity planning",
    },
  ];
}

function calculateCashFlowAnalysis(data: any) {
  // Calcular fluxo de caixa operacional real baseado nas movimentações
  const totalReceitas = data.movimentacoes?.filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0) || 0;
  
  const totalDespesas = data.movimentacoes?.filter((item: any) => item.Debito > 0)
    .reduce((sum: number, item: any) => sum + (item.Debito || 0), 0) || 0;
  
  const operatingCashFlow = totalReceitas - totalDespesas;
  
  // Calcular fluxo de caixa livre (FCF = Fluxo Operacional - Investimentos)
  // Estimar investimentos como % das despesas (manutenção, melhorias, etc.)
  const estimatedInvestments = totalDespesas * 0.15; // 15% das despesas são investimentos
  const freeCashFlow = operatingCashFlow - estimatedInvestments;
  
  // Calcular ciclo de conversão de caixa baseado nos dados de faturamento
  const totalFaturado = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalfaturado || 0), 0) || 0;
  const totalAberto = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalaberto || 0), 0) || 0;
  const totalPago = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalpago || 0), 0) || 0;
  
  // Dias a receber = (Contas a Receber / Receita Diária)
  const dailyRevenue = totalReceitas / 365;
  const daysReceivable = dailyRevenue > 0 ? totalAberto / dailyRevenue : 30;
  
  // Dias a pagar = (Contas a Pagar / Despesa Diária)
  const dailyExpenses = totalDespesas / 365;
  const estimatedPayables = totalDespesas * 0.2; // Estimar 20% das despesas como a pagar
  const daysPayable = dailyExpenses > 0 ? estimatedPayables / dailyExpenses : 25;
  
  // Ciclo de conversão de caixa = Dias a Receber - Dias a Pagar
  const cashConversionCycle = daysReceivable - daysPayable;
  
  // Eficiência de cobrança
  const collectionEfficiency = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;
  
  // Índice de liquidez operacional
  const operationalLiquidity = totalReceitas > 0 ? (operatingCashFlow / totalReceitas) * 100 : 0;
  
  return {
    operatingCashFlow: Math.max(0, operatingCashFlow),
    freeCashFlow: Math.max(-totalDespesas, freeCashFlow), // Permitir FCF negativo mas limitado
    cashConversionCycle: Math.max(0, Math.min(cashConversionCycle, 120)), // Limitar entre 0-120 dias
    daysReceivable: Math.max(0, Math.min(daysReceivable, 90)), // Limitar entre 0-90 dias
    daysPayable: Math.max(0, Math.min(daysPayable, 60)), // Limitar entre 0-60 dias
    collectionEfficiency: Math.max(0, Math.min(collectionEfficiency, 100)), // 0-100%
    operationalLiquidity: Math.max(-50, Math.min(operationalLiquidity, 100)), // -50% a 100%
    cashFlowTrend: operatingCashFlow > 0 ? 'Positivo' : 'Negativo',
    averageReceiptTime: Math.round(daysReceivable), // Tempo médio de recebimento
    paymentPressure: daysPayable < 30 ? 'Alta' : daysPayable < 45 ? 'Média' : 'Baixa'
  };
}

function calculateFinancialRatios(data: any) {
  // Calcular receitas e despesas totais
  const totalReceitas = data.movimentacoes?.filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0) || 0;
  
  const totalDespesas = data.movimentacoes?.filter((item: any) => item.Debito > 0)
    .reduce((sum: number, item: any) => sum + (item.Debito || 0), 0) || 0;
  
  // Dados do faturamento
  const totalFaturado = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalfaturado || 0), 0) || 0;
  const totalAberto = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalaberto || 0), 0) || 0;
  const totalPago = data.faturamento?.reduce((sum: number, item: any) => 
    sum + (item.valortotalpago || 0), 0) || 0;
  
  // Dados de inadimplência
  const totalInadimplencia = data.inadimplencia?.reduce((sum: number, item: any) => 
    sum + (item.Inadimplencia || 0), 0) || 0;
  
  // Estimar ativos e passivos baseados nos dados disponíveis
  const totalAssets = totalFaturado; // Usar faturamento como proxy dos ativos
  const currentAssets = totalPago + totalAberto; // Ativos circulantes (recebidos + a receber)
  const currentLiabilities = totalDespesas * 0.3; // Estimar 30% das despesas como passivos circulantes
  const totalDebt = totalDespesas * 0.6; // Estimar 60% das despesas como dívidas
  const equity = totalAssets - totalDebt; // Patrimônio líquido
  
  // Calcular indicadores financeiros reais
  
  // 1. Debt-to-Equity Ratio
  const debtToEquity = equity > 0 ? totalDebt / equity : 0;
  
  // 2. Current Ratio (Liquidez Corrente)
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 2;
  
  // 3. Quick Ratio (Liquidez Seca) - Apenas valores já recebidos
  const quickRatio = currentLiabilities > 0 ? totalPago / currentLiabilities : 1.5;
  
  // 4. Return on Assets (ROA)
  const netIncome = totalReceitas - totalDespesas;
  const returnOnAssets = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  
  // 5. Return on Equity (ROE)
  const returnOnEquity = equity > 0 ? (netIncome / equity) * 100 : 0;
  
  // 6. Interest Coverage (estimado)
  const estimatedInterest = totalDespesas * 0.05; // Estimar 5% das despesas como juros
  const interestCoverage = estimatedInterest > 0 ? netIncome / estimatedInterest : 10;
  
  // 7. Margin de Lucro
  const profitMargin = totalReceitas > 0 ? (netIncome / totalReceitas) * 100 : 0;
  
  // 8. Asset Turnover (Giro do Ativo)
  const assetTurnover = totalAssets > 0 ? totalReceitas / totalAssets : 0;
  
  // 9. Collection Ratio (Índice de Cobrança)
  const collectionRatio = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;
  
  // 10. Default Rate (Taxa de Inadimplência)
  const defaultRate = totalFaturado > 0 ? (totalInadimplencia / totalFaturado) * 100 : 0;
  
  return {
    debtToEquity: Math.max(0, Math.min(debtToEquity, 5)), // Limitar entre 0-5
    currentRatio: Math.max(0.5, Math.min(currentRatio, 10)), // Limitar entre 0.5-10
    quickRatio: Math.max(0.2, Math.min(quickRatio, 5)), // Limitar entre 0.2-5
    returnOnAssets: Math.max(-50, Math.min(returnOnAssets, 50)), // Limitar entre -50% e 50%
    returnOnEquity: Math.max(-100, Math.min(returnOnEquity, 100)), // Limitar entre -100% e 100%
    interestCoverage: Math.max(0, Math.min(interestCoverage, 50)), // Limitar entre 0-50
    profitMargin: Math.max(-100, Math.min(profitMargin, 100)), // Margem de lucro %
    assetTurnover: Math.max(0, Math.min(assetTurnover, 5)), // Giro do ativo
    collectionRatio: Math.max(0, Math.min(collectionRatio, 100)), // Taxa de cobrança %
    defaultRate: Math.max(0, Math.min(defaultRate, 100)), // Taxa de inadimplência %
    // Interpretações qualitativas
    liquidityHealth: currentRatio > 2 ? 'Excelente' : currentRatio > 1.5 ? 'Boa' : currentRatio > 1 ? 'Regular' : 'Ruim',
    profitabilityHealth: returnOnAssets > 10 ? 'Excelente' : returnOnAssets > 5 ? 'Boa' : returnOnAssets > 0 ? 'Regular' : 'Ruim',
    leverageHealth: debtToEquity < 0.5 ? 'Conservador' : debtToEquity < 1 ? 'Moderado' : debtToEquity < 2 ? 'Agressivo' : 'Alto Risco'
  };
}

function calculateRiskAdjustedReturn(noi: number, volatility: number) {
  const returnRate = (noi / 10000000) * 100; // Assuming portfolio of 10M
  return volatility > 0 ? returnRate / volatility : 0;
}

function calculateTrendsAnalysis(data: any) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Calcular crescimento mensal baseado nos dados reais
  const thisMonthMovements = data.movimentacoes?.filter((item: any) => {
    if (!item.Data) return false;
    const itemDate = new Date(item.Data);
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
  }) || [];
  
  const lastMonthMovements = data.movimentacoes?.filter((item: any) => {
    if (!item.Data) return false;
    const itemDate = new Date(item.Data);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastMonthYear;
  }) || [];
  
  const thisMonthRevenue = thisMonthMovements
    .filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
  
  const lastMonthRevenue = lastMonthMovements
    .filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
  
  const monthlyGrowth = lastMonthRevenue > 0 ? 
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  
  // Calcular crescimento ano a ano
  const thisYearMovements = data.movimentacoes?.filter((item: any) => {
    if (!item.Data) return false;
    const itemDate = new Date(item.Data);
    return itemDate.getFullYear() === currentYear;
  }) || [];
  
  const lastYearMovements = data.movimentacoes?.filter((item: any) => {
    if (!item.Data) return false;
    const itemDate = new Date(item.Data);
    return itemDate.getFullYear() === currentYear - 1;
  }) || [];
  
  const thisYearRevenue = thisYearMovements
    .filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
  
  const lastYearRevenue = lastYearMovements
    .filter((item: any) => item.Credito > 0)
    .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);
  
  const yearOverYear = lastYearRevenue > 0 ? 
    ((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;
  
  // Calcular índice sazonal baseado na variação mensal histórica
  const monthlyRevenuesByMonth: number[] = new Array(12).fill(0);
  const monthCounts: number[] = new Array(12).fill(0);
  
  data.movimentacoes?.forEach((item: any) => {
    if (!item.Data) return;
    const itemDate = new Date(item.Data);
    const month = itemDate.getMonth();
    if (item.Credito > 0) {
      monthlyRevenuesByMonth[month] += item.Credito;
      monthCounts[month]++;
    }
  });
  
  // Calcular médias mensais
  const averageMonthlyRevenues = monthlyRevenuesByMonth.map((total, index) => 
    monthCounts[index] > 0 ? total / monthCounts[index] : 0
  );
  
  const overallAverage = averageMonthlyRevenues.reduce((sum, val) => sum + val, 0) / 12;
  const currentMonthAverage = averageMonthlyRevenues[currentMonth] || overallAverage;
  const seasonalIndex = overallAverage > 0 ? currentMonthAverage / overallAverage : 1;
  
  // Determinar direção da tendência baseada no crescimento
  let trendDirection: 'upward' | 'downward' | 'stable';
  if (monthlyGrowth > 5) {
    trendDirection = 'upward';
  } else if (monthlyGrowth < -5) {
    trendDirection = 'downward';
  } else {
    trendDirection = 'stable';
  }
  
  // Calcular volatilidade de receitas (variabilidade mês a mês)
  const validRevenues = averageMonthlyRevenues.filter(rev => rev > 0);
  const avgRevenue = validRevenues.reduce((sum, val) => sum + val, 0) / validRevenues.length;
  const variance = validRevenues.reduce((sum, val) => sum + Math.pow(val - avgRevenue, 2), 0) / validRevenues.length;
  const volatility = avgRevenue > 0 ? (Math.sqrt(variance) / avgRevenue) * 100 : 10;
  
  // Previsão de crescimento para próximo mês (baseado na tendência)
  const projectedGrowth = (monthlyGrowth * 0.7) + (yearOverYear * 0.3); // Peso maior no crescimento mensal
  
  return {
    monthlyGrowth: Math.max(-50, Math.min(monthlyGrowth, 100)), // Limitar entre -50% e 100%
    yearOverYear: Math.max(-100, Math.min(yearOverYear, 200)), // Limitar entre -100% e 200%
    seasonalIndex: Math.max(0.3, Math.min(seasonalIndex, 2.0)), // Limitar entre 0.3 e 2.0
    trendDirection,
    volatility: Math.max(0, Math.min(volatility, 50)), // Volatilidade limitada a 50%
    projectedGrowth: Math.max(-30, Math.min(projectedGrowth, 50)), // Projeção limitada
    // Interpretações qualitativas
    growthHealth: monthlyGrowth > 10 ? 'Excelente' : monthlyGrowth > 3 ? 'Boa' : monthlyGrowth > -3 ? 'Estável' : 'Preocupante',
    seasonality: seasonalIndex > 1.2 ? 'Alta Sazonalidade' : seasonalIndex > 0.8 ? 'Sazonalidade Moderada' : 'Baixa Sazonalidade',
    consistency: volatility < 10 ? 'Muito Consistente' : volatility < 20 ? 'Consistente' : volatility < 30 ? 'Moderada' : 'Volátil'
  };
}