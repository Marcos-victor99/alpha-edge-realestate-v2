// Teste direto dos hooks React simulando o ambiente
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdhxtlnadjejyyydmlit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHh0bG5hZGplanl5eWRtbGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODAzMDEsImV4cCI6MjA1Njc1NjMwMX0.TWzazmeto1Ic5cNAf7LrDjHcrbuaofCid_3xNiBnVkE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Simulando useFinancialAnalyticsSimple...');

// Simular a lógica do hook useFinancialAnalyticsSimple
async function simulateFinancialAnalyticsSimple() {
  try {
    console.log('\n📊 Carregando dados...');

    // Buscar dados como fazem os hooks
    const [faturamentoResult, inadimplenciaResult, movimentacoesResult, pagamentosResult] = await Promise.all([
      supabase.from('faturamento').select('*').limit(100),
      supabase.from('inadimplencia').select('*').limit(100), 
      supabase.from('movimentacoes_financeiras').select('*').limit(100),
      supabase.from('Pagamento_Empreendedor').select('*').limit(100)
    ]);

    console.log('📋 Resultados das consultas:');
    console.log('- Faturamento:', faturamentoResult.data?.length || 0, 'registros');
    console.log('- Inadimplência:', inadimplenciaResult.data?.length || 0, 'registros');  
    console.log('- Movimentações:', movimentacoesResult.data?.length || 0, 'registros');
    console.log('- Pagamentos:', pagamentosResult.data?.length || 0, 'registros');

    // Aplicar a mesma lógica do useFinancialAnalyticsSimple
    const rawData = {
      faturamento: faturamentoResult.data || [],
      inadimplencia: inadimplenciaResult.data || [],
      movimentacoes: movimentacoesResult.data || [],
      pagamentos: pagamentosResult.data || [],
    };

    // Cálculos KPIs (mesma lógica do hook)
    const totalPortfolioValue = rawData.faturamento.reduce((sum, item) => 
      sum + (item.valortotalfaturado || 0), 0
    );

    const totalReceivables = rawData.faturamento.reduce((sum, item) => 
      sum + (item.valortotalaberto || 0), 0
    );

    const totalPaid = rawData.faturamento.reduce((sum, item) => 
      sum + (item.valortotalpago || 0), 0
    );

    const totalDefaultAmount = rawData.inadimplencia.reduce((sum, item) => 
      sum + (item.Inadimplencia || 0), 0
    );

    const defaultRate = totalReceivables > 0 ? (totalDefaultAmount / totalReceivables) * 100 : 0;

    // NOI básico
    const totalRevenue = rawData.movimentacoes
      .filter(item => item.Credito > 0)
      .reduce((sum, item) => sum + (item.Credito || 0), 0);

    const totalExpenses = rawData.movimentacoes
      .filter(item => item.Debito > 0)
      .reduce((sum, item) => sum + (item.Debito || 0), 0);

    const noi = totalRevenue - totalExpenses;
    const noiYield = totalRevenue > 0 ? (noi / totalRevenue) * 100 : 0;

    // Taxa de ocupação
    const totalTenants = new Set(rawData.faturamento.map(item => item.locatario)).size;
    const activeTenants = new Set(
      rawData.faturamento
        .filter(item => item.valortotalfaturado > 0)
        .map(item => item.locatario)
    ).size;
    
    const occupancyRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

    const kpis = {
      portfolioValue: totalPortfolioValue,
      noiYield,
      occupancyRate,
      riskAdjustedReturn: noiYield * 0.8,
      defaultRate,
      noi,
      totalRevenue,
      totalExpenses,
    };

    console.log('\n💰 KPIs Calculados:');
    console.log('- Portfolio Value:', kpis.portfolioValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('- NOI Yield:', kpis.noiYield.toFixed(2) + '%');
    console.log('- Occupancy Rate:', kpis.occupancyRate.toFixed(1) + '%');
    console.log('- Risk Adjusted Return:', kpis.riskAdjustedReturn.toFixed(2) + '%');
    console.log('- Default Rate:', kpis.defaultRate.toFixed(2) + '%');

    // Dados para gráficos (mesma estrutura do hook)
    const result = {
      kpis,
      performanceData: [
        { month: 'Jan', noi: noiYield, portfolio: noiYield * 1.1, benchmark: 3.5 },
        { month: 'Fev', noi: noiYield * 0.9, portfolio: noiYield * 1.2, benchmark: 3.6 },
        { month: 'Mar', noi: noiYield * 1.1, portfolio: noiYield * 1.0, benchmark: 3.4 }
      ],
      portfolioComposition: [
        { name: 'Varejo', value: 40 },
        { name: 'Alimentação', value: 30 },
        { name: 'Serviços', value: 20 },
        { name: 'Outros', value: 10 }
      ],
      trendsAnalysis: {
        monthlyGrowth: 2.5,
        yearOverYear: 8.3,
      }
    };

    console.log('\n✅ Hook simulation completed successfully!');
    console.log('📊 Performance Data length:', result.performanceData.length);
    console.log('🥧 Portfolio Composition length:', result.portfolioComposition.length);

    return result;

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return null;
  }
}

simulateFinancialAnalyticsSimple();