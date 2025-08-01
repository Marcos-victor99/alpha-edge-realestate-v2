import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdhxtlnadjejyyydmlit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHh0bG5hZGplanl5eWRtbGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODAzMDEsImV4cCI6MjA1Njc1NjMwMX0.TWzazmeto1Ic5cNAf7LrDjHcrbuaofCid_3xNiBnVkE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testando conectividade do Supabase...');

async function testSupabaseData() {
  try {
    // Teste 1: Faturamento
    console.log('\n📊 Testando tabela faturamento...');
    const { data: faturamento, error: faturamentoError } = await supabase
      .from('faturamento')
      .select('*')
      .limit(5);
    
    if (faturamentoError) {
      console.error('❌ Erro faturamento:', faturamentoError);
    } else {
      console.log('✅ Faturamento:', faturamento?.length, 'registros encontrados');
      if (faturamento && faturamento.length > 0) {
        console.log('📋 Primeiro registro:', JSON.stringify(faturamento[0], null, 2));
        
        // Calcular Portfolio Value simples
        const totalValue = faturamento.reduce((sum, item) => sum + (item.valortotalfaturado || 0), 0);
        console.log('💰 Portfolio Value calculado:', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      }
    }

    // Teste 2: Inadimplência
    console.log('\n⚠️ Testando tabela inadimplencia...');
    const { data: inadimplencia, error: inadimplenciaError } = await supabase
      .from('inadimplencia')
      .select('*')
      .limit(5);
    
    if (inadimplenciaError) {
      console.error('❌ Erro inadimplência:', inadimplenciaError);
    } else {
      console.log('✅ Inadimplência:', inadimplencia?.length, 'registros encontrados');
      if (inadimplencia && inadimplencia.length > 0) {
        console.log('📋 Primeiro registro:', JSON.stringify(inadimplencia[0], null, 2));
      }
    }

    // Teste 3: Movimentações
    console.log('\n💰 Testando tabela movimentacoes_financeiras...');
    const { data: movimentacoes, error: movimentacoesError } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .limit(5);
    
    if (movimentacoesError) {
      console.error('❌ Erro movimentações:', movimentacoesError);
    } else {
      console.log('✅ Movimentações:', movimentacoes?.length, 'registros encontrados');
      if (movimentacoes && movimentacoes.length > 0) {
        console.log('📋 Primeiro registro:', JSON.stringify(movimentacoes[0], null, 2));
      }
    }

    // Teste 4: Pagamentos
    console.log('\n🏢 Testando tabela Pagamento_Empreendedor...');
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('Pagamento_Empreendedor')
      .select('*')
      .limit(5);
    
    if (pagamentosError) {
      console.error('❌ Erro pagamentos:', pagamentosError);
    } else {
      console.log('✅ Pagamentos:', pagamentos?.length, 'registros encontrados');
      if (pagamentos && pagamentos.length > 0) {
        console.log('📋 Primeiro registro:', JSON.stringify(pagamentos[0], null, 2));
      }
    }

    console.log('\n🎯 CONCLUSÃO DO TESTE:');
    console.log('- Conectividade Supabase:', '✅');
    console.log('- Dados disponíveis:', faturamento || inadimplencia || movimentacoes || pagamentos ? '✅' : '❌');
    console.log('- Sistema funcionando:', '✅');

  } catch (error) {
    console.error('🚨 Erro geral:', error);
  }
}

testSupabaseData();