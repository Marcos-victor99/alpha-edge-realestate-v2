import React from 'react';
import { 
  useFaturamentoData, 
  useFinancialAnalytics, 
  useInadimplenciaData,
  useMovimentacoesFinanceiras,
  usePagamentoEmpreendedor
} from '@/hooks/useFinancialData';
import { useFinancialAnalyticsSimple } from '@/hooks/useFinancialDataSimple';

const TestDataComponent = () => {
  const { data: faturamentoData, isLoading: faturamentoLoading, error: faturamentoError } = useFaturamentoData();
  const { data: inadimplenciaData, isLoading: inadimplenciaLoading, error: inadimplenciaError } = useInadimplenciaData();
  const { data: movimentacoesData, isLoading: movimentacoesLoading, error: movimentacoesError } = useMovimentacoesFinanceiras();
  const { data: pagamentosData, isLoading: pagamentosLoading, error: pagamentosError } = usePagamentoEmpreendedor();
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useFinancialAnalytics();
  const { data: analyticsSimpleData, isLoading: analyticsSimpleLoading, error: analyticsSimpleError } = useFinancialAnalyticsSimple();

  console.log('🔍 TestDataComponent - Todos os Hooks:', {
    faturamento: { data: faturamentoData, loading: faturamentoLoading, error: faturamentoError },
    inadimplencia: { data: inadimplenciaData, loading: inadimplenciaLoading, error: inadimplenciaError },
    movimentacoes: { data: movimentacoesData, loading: movimentacoesLoading, error: movimentacoesError },
    pagamentos: { data: pagamentosData, loading: pagamentosLoading, error: pagamentosError },
    analytics: { data: analyticsData, loading: analyticsLoading, error: analyticsError },
    analyticsSimple: { data: analyticsSimpleData, loading: analyticsSimpleLoading, error: analyticsSimpleError }
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🧪 Teste de Dados</h2>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">📊 Faturamento</h3>
          <p><strong>Loading:</strong> {faturamentoLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {faturamentoError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Registros:</strong> {faturamentoData?.length || 0}</p>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">⚠️ Inadimplência</h3>
          <p><strong>Loading:</strong> {inadimplenciaLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {inadimplenciaError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Registros:</strong> {inadimplenciaData?.records?.length || 0}</p>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">💰 Movimentações</h3>
          <p><strong>Loading:</strong> {movimentacoesLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {movimentacoesError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Registros:</strong> {movimentacoesData?.length || 0}</p>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">🏢 Pagamentos</h3>
          <p><strong>Loading:</strong> {pagamentosLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {pagamentosError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Registros:</strong> {pagamentosData?.length || 0}</p>
        </div>

        <div className="border p-4 rounded bg-blue-50">
          <h3 className="font-semibold mb-2">📈 Analytics (com Web Worker)</h3>
          <p><strong>Loading:</strong> {analyticsLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {analyticsError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Dados:</strong> {analyticsData ? '✅ Disponíveis' : '❌ Indisponíveis'}</p>
          {analyticsData && (
            <div className="mt-2">
              <p><strong>KPIs disponíveis:</strong></p>
              <ul className="text-sm list-disc ml-4">
                <li>Portfolio Value: {analyticsData.kpis?.portfolioValue || 'N/A'}</li>
                <li>NOI Yield: {analyticsData.kpis?.noiYield || 'N/A'}</li>
                <li>Occupancy Rate: {analyticsData.kpis?.occupancyRate || 'N/A'}</li>
              </ul>
            </div>
          )}
        </div>

        <div className="border p-4 rounded bg-green-50">
          <h3 className="font-semibold mb-2">🧪 Analytics Simplificado (SEM Web Worker)</h3>
          <p><strong>Loading:</strong> {analyticsSimpleLoading ? '⏳ Sim' : '✅ Não'}</p>
          <p><strong>Error:</strong> {analyticsSimpleError ? '❌ Sim' : '✅ Nenhum'}</p>
          <p><strong>Dados:</strong> {analyticsSimpleData ? '✅ Disponíveis' : '❌ Indisponíveis'}</p>
          {analyticsSimpleData && (
            <div className="mt-2">
              <p><strong>KPIs calculados:</strong></p>
              <ul className="text-sm list-disc ml-4">
                <li>Portfolio Value: R$ {analyticsSimpleData.kpis?.portfolioValue?.toLocaleString('pt-BR') || 'N/A'}</li>
                <li>NOI Yield: {analyticsSimpleData.kpis?.noiYield?.toFixed(2) || 'N/A'}%</li>
                <li>Occupancy Rate: {analyticsSimpleData.kpis?.occupancyRate?.toFixed(1) || 'N/A'}%</li>
                <li>Default Rate: {analyticsSimpleData.kpis?.defaultRate?.toFixed(2) || 'N/A'}%</li>
              </ul>
              <p className="text-xs text-green-700 mt-2">✅ Este teste confirma se o problema está no Web Worker</p>
            </div>
          )}
          {analyticsSimpleError && (
            <div className="mt-2 p-2 bg-red-100 rounded text-sm">
              <p className="text-red-700">Erro: {analyticsSimpleError.message}</p>
            </div>
          )}
        </div>

        <div className="border p-4 rounded bg-yellow-50">
          <h3 className="font-semibold mb-2">🔧 Diagnóstico</h3>
          <p><strong>Condição Analytics Enabled:</strong> {
            !!(faturamentoData || inadimplenciaData || movimentacoesData || pagamentosData) ? '✅ Sim' : '❌ Não'
          }</p>
          <div className="text-sm mt-2">
            <p>• Faturamento: {faturamentoData ? '✅' : '❌'}</p>
            <p>• Inadimplência: {inadimplenciaData ? '✅' : '❌'}</p>
            <p>• Movimentações: {movimentacoesData ? '✅' : '❌'}</p>
            <p>• Pagamentos: {pagamentosData ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataComponent;