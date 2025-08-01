// Teste simples de conectividade Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vdhxtlnadjejyyydmlit.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHh0bG5hZGplanl5eWRtbGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODAzMDEsImV4cCI6MjA1Njc1NjMwMX0.TWzazmeto1Ic5cNAf7LrDjHcrbuaofCid_3xNiBnVkE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔍 Testando conectividade Supabase...');
  
  try {
    // Testar tabela faturamento
    console.log('\n📊 Testando tabela faturamento:');
    const { data: faturamento, error: faturamentoError } = await supabase
      .from('faturamento')
      .select('*')
      .limit(5);
    
    if (faturamentoError) {
      console.error('❌ Erro faturamento:', faturamentoError);
    } else {
      console.log('✅ Faturamento funcionando:', faturamento?.length, 'registros');
      console.log('Sample:', faturamento?.[0]);
    }

    // Testar tabela movimentacoes_financeiras
    console.log('\n💰 Testando tabela movimentacoes_financeiras:');
    const { data: movimentacoes, error: movimentacoesError } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .limit(5);
    
    if (movimentacoesError) {
      console.error('❌ Erro movimentações:', movimentacoesError);
    } else {
      console.log('✅ Movimentações funcionando:', movimentacoes?.length, 'registros');
      console.log('Sample:', movimentacoes?.[0]);
    }

    // Testar tabela inadimplencia
    console.log('\n⚠️ Testando tabela inadimplencia:');
    const { data: inadimplencia, error: inadimplenciaError } = await supabase
      .from('inadimplencia')
      .select('*')
      .limit(5);
    
    if (inadimplenciaError) {
      console.error('❌ Erro inadimplência:', inadimplenciaError);
    } else {
      console.log('✅ Inadimplência funcionando:', inadimplencia?.length, 'registros');
      console.log('Sample:', inadimplencia?.[0]);
    }

    console.log('\n🎉 Teste de conectividade concluído!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testConnection();