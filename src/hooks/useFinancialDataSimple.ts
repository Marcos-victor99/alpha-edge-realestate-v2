import { useQuery } from '@tanstack/react-query';
import { useFaturamentoData, useInadimplenciaData, useMovimentacoesFinanceiras, usePagamentoEmpreendedor } from '@/hooks/useFinancialData';

/**
 * Versão simplificada do useFinancialAnalytics SEM Web Workers
 * Para diagnosticar se o problema está no Web Worker
 */
export const useFinancialAnalyticsSimple = () => {
  const faturamento = useFaturamentoData();
  const inadimplencia = useInadimplenciaData();
  const movimentacoes = useMovimentacoesFinanceiras();
  const pagamentos = usePagamentoEmpreendedor();

  return useQuery({
    queryKey: ['financial_analytics_simple', faturamento.data, inadimplencia.data, movimentacoes.data, pagamentos.data],
    queryFn: async () => {
      console.log('🧪 useFinancialAnalyticsSimple executando...');
      
      // Dados disponíveis
      const rawData = {
        faturamento: faturamento.data || [],
        inadimplencia: inadimplencia.data?.records || [],
        movimentacoes: movimentacoes.data || [],
        pagamentos: pagamentos.data || [],
      };
      
      console.log('📊 Dados recebidos:', {
        faturamento: rawData.faturamento.length,
        inadimplencia: rawData.inadimplencia.length,
        movimentacoes: rawData.movimentacoes.length,
        pagamentos: rawData.pagamentos.length
      });

      // Cálculos simples SEM Web Worker
      const totalPortfolioValue = rawData.faturamento.reduce((sum: number, item: any) => 
        sum + (item.valortotalfaturado || 0), 0
      );

      const totalReceivables = rawData.faturamento.reduce((sum: number, item: any) => 
        sum + (item.valortotalaberto || 0), 0
      );

      const totalPaid = rawData.faturamento.reduce((sum: number, item: any) => 
        sum + (item.valortotalpago || 0), 0
      );

      const totalDefaultAmount = rawData.inadimplencia.reduce((sum: number, item: any) => 
        sum + (item.Inadimplencia || 0), 0
      );

      const defaultRate = totalReceivables > 0 ? (totalDefaultAmount / totalReceivables) * 100 : 0;

      // NOI básico
      const totalRevenue = rawData.movimentacoes
        .filter((item: any) => item.Credito > 0)
        .reduce((sum: number, item: any) => sum + (item.Credito || 0), 0);

      const totalExpenses = rawData.movimentacoes
        .filter((item: any) => item.Debito > 0)
        .reduce((sum: number, item: any) => sum + (item.Debito || 0), 0);

      const noi = totalRevenue - totalExpenses;
      const noiYield = totalRevenue > 0 ? (noi / totalRevenue) * 100 : 0;

      // Taxa de ocupação
      const totalTenants = new Set(rawData.faturamento.map((item: any) => item.locatario)).size;
      const activeTenants = new Set(
        rawData.faturamento
          .filter((item: any) => item.valortotalfaturado > 0)
          .map((item: any) => item.locatario)
      ).size;
      
      const occupancyRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

      const kpis = {
        portfolioValue: totalPortfolioValue,
        noiYield,
        occupancyRate,
        riskAdjustedReturn: noiYield * 0.8, // Simulado
        defaultRate,
        noi,
        totalRevenue,
        totalExpenses,
      };

      console.log('✅ KPIs calculados:', kpis);

      return {
        kpis,
        // Dados mock para manter compatibilidade
        performanceData: [
          { month: 'Jan', noi: noiYield, portfolio: noiYield * 1.1, benchmark: 3.5 },
          { month: 'Fev', noi: noiYield * 0.9, portfolio: noiYield * 1.2, benchmark: 3.6 },
          { month: 'Mar', noi: noiYield * 1.1, portfolio: noiYield * 1.0, benchmark: 3.4 }
        ],
        portfolioComposition: [
          { name: 'Varejo', value: 40, color: 'hsl(var(--chart-1))' },
          { name: 'Alimentação', value: 30, color: 'hsl(var(--chart-2))' },
          { name: 'Serviços', value: 20, color: 'hsl(var(--chart-3))' },
          { name: 'Outros', value: 10, color: 'hsl(var(--chart-4))' }
        ],
        riskMetrics: {
          volatility: 15,
          sharpeRatio: 1.2,
          var95: 5,
          beta: 1.0,
          defaultRisk: defaultRate,
          creditQuality: defaultRate < 3 ? 'Excelente' : 'Boa'
        },
        alphaSignals: [
          {
            signal: "Test Signal",
            asset: "Shopping Park Botucatu",
            probability: "Test",
            impact: "Medium",
            type: "test",
            description: "Versão simplificada para diagnóstico"
          }
        ],
        cashFlowAnalysis: {
          operatingCashFlow: noi,
          freeCashFlow: noi * 0.8,
          cashConversionCycle: 30,
          daysReceivable: 45,
          daysPayable: 25,
          collectionEfficiency: (totalPaid / (totalPaid + totalReceivables)) * 100,
          operationalLiquidity: noiYield,
          cashFlowTrend: noi > 0 ? 'Positivo' : 'Negativo'
        },
        financialRatios: {
          currentRatio: 1.5,
          quickRatio: 1.2,
          debtToEquity: 0.6,
          returnOnAssets: noiYield,
          returnOnEquity: noiYield * 1.2,
          profitMargin: noiYield,
          liquidityHealth: 'Boa',
          profitabilityHealth: noiYield > 5 ? 'Boa' : 'Regular'
        },
        trendsAnalysis: {
          monthlyGrowth: 2.5,
          yearOverYear: 8.3,
          trendDirection: 'upward' as const,
          volatility: 12,
          growthHealth: 'Boa'
        }
      };
    },
    // Executar se pelo menos um hook tiver dados
    enabled: !!(faturamento.data || inadimplencia.data || movimentacoes.data || pagamentos.data),
    staleTime: 5 * 60 * 1000,
  });
};