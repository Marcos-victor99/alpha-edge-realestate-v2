import React, { useMemo } from 'react';
import { BarChart, Card, Title, Text, Flex, Badge } from '@tremor/react';
import { useFaturamentoAnalytics } from '@/hooks/useFaturamentoAnalytics';
import { formatarMoeda, formatarVariacao } from '@/lib/formatters';
import { ChartCard } from '@/components/ui/ChartCard';
import { Download, TrendingUp, TrendingDown, Users } from 'lucide-react';
import * as d3 from 'd3';
import _ from 'lodash';
import { CSVLink } from 'react-csv';

interface PerformanceLocatarioChartProps {
  periodo?: string;
  limite?: number;
  mostrarComparacao?: boolean;
  altura?: 'sm' | 'md' | 'lg';
  titulo?: string;
  subtitulo?: string;
  onExport?: () => void;
  onFullscreen?: () => void;
}

export const PerformanceLocatarioChart: React.FC<PerformanceLocatarioChartProps> = ({
  periodo,
  limite = 10,
  mostrarComparacao = false,
  altura = 'md',
  titulo = "Performance por Locatário",
  subtitulo = "Análise de receitas e pagamentos dos principais locatários",
  onExport,
  onFullscreen
}) => {
  const { data: analytics, isLoading, error } = useFaturamentoAnalytics(periodo);

  // Processar dados para o gráfico usando Lodash
  const dadosProcessados = useMemo(() => {
    if (!analytics?.dados || analytics.dados.length === 0) return [];

    // Usar Lodash para agrupar e processar dados
    const agrupados = _(analytics.dados)
      .groupBy('locatario')
      .map((transacoes, locatario) => {
        const totalFaturado = _.sumBy(transacoes, 'valortotalfaturado');
        const totalPago = _.sumBy(transacoes, 'valortotalpago');
        const totalInadimplencia = _.sumBy(transacoes, 'inadimplencia');
        const performance = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;
        const areaTotal = _.sumBy(transacoes, 'area');
        const receitaPorM2 = areaTotal > 0 ? totalFaturado / areaTotal : 0;

        return {
          locatario: locatario.length > 20 ? `${locatario.substring(0, 17)}...` : locatario,
          locatarioCompleto: locatario,
          totalFaturado,
          totalPago,
          inadimplencia: totalInadimplencia,
          performance: Math.round(performance),
          receitaPorM2,
          transacoes: transacoes.length,
          categoria: transacoes[0]?.categoria || 'Outros',
          // Cores baseadas na performance
          cor: performance >= 95 ? '#10b981' : 
               performance >= 80 ? '#f59e0b' : 
               performance >= 60 ? '#ef4444' : '#6b7280'
        };
      })
      .orderBy(['totalFaturado'], ['desc'])
      .take(limite)
      .value();

    return agrupados;
  }, [analytics?.dados, limite]);

  // Preparar dados para exportação CSV
  const dadosExportacao = useMemo(() => {
    return dadosProcessados.map(item => ({
      'Locatário': item.locatarioCompleto,
      'Total Faturado (R$)': item.totalFaturado,
      'Total Pago (R$)': item.totalPago,
      'Inadimplência (R$)': item.inadimplencia,
      'Performance (%)': item.performance,
      'Receita por m² (R$)': item.receitaPorM2.toFixed(2),
      'Transações': item.transacoes,
      'Categoria': item.categoria
    }));
  }, [dadosProcessados]);

  // Usar D3 para cálculos estatísticos avançados
  const estatisticas = useMemo(() => {
    if (dadosProcessados.length === 0) return null;

    const valores = dadosProcessados.map(d => d.totalFaturado);
    const performances = dadosProcessados.map(d => d.performance);

    return {
      mediaFaturamento: d3.mean(valores) || 0,
      medianaFaturamento: d3.median(valores) || 0,
      mediaPerformance: d3.mean(performances) || 0,
      desvioPerformance: d3.deviation(performances) || 0,
      quartis: {
        q1: d3.quantile(valores.sort(d3.ascending), 0.25) || 0,
        q3: d3.quantile(valores.sort(d3.ascending), 0.75) || 0
      }
    };
  }, [dadosProcessados]);

  // Handlers para ações
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
  };

  // Ações customizadas para o ChartCard
  const acoes = [
    {
      key: 'csv',
      label: 'Exportar CSV',
      icon: Download,
      onClick: handleExport,
      component: (
        <CSVLink 
          data={dadosExportacao} 
          filename={`performance-locatarios-${new Date().toISOString().split('T')[0]}.csv`}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </CSVLink>
      )
    }
  ];

  if (isLoading) {
    return (
      <ChartCard titulo={titulo} subtitulo={subtitulo}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard titulo={titulo} subtitulo={subtitulo}>
        <div className="flex items-center justify-center h-64 text-red-500">
          <Text>Erro ao carregar dados: {error.message}</Text>
        </div>
      </ChartCard>
    );
  }

  if (dadosProcessados.length === 0) {
    return (
      <ChartCard titulo={titulo} subtitulo={subtitulo}>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Text>Nenhum dado disponível para o período selecionado</Text>
        </div>
      </ChartCard>
    );
  }

  const alturaMap = {
    sm: 'h-64',
    md: 'h-80',
    lg: 'h-96'
  };

  return (
    <ChartCard 
      titulo={titulo}
      subtitulo={subtitulo}
      onExport={handleExport}
      onFullscreen={handleFullscreen}
      extraActions={acoes}
    >
      <div className="space-y-4">
        {/* Métricas Resumo */}
        {estatisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Text className="text-sm text-gray-600">Média Faturamento</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.mediaFaturamento)}</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Mediana Faturamento</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.medianaFaturamento)}</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Performance Média</Text>
              <Text className="font-semibold text-lg">{estatisticas.mediaPerformance.toFixed(1)}%</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Total Locatários</Text>
              <Text className="font-semibold text-lg flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                {dadosProcessados.length}
              </Text>
            </div>
          </div>
        )}

        {/* Gráfico Principal */}
        <div className={alturaMap[altura]}>
          <BarChart
            data={dadosProcessados}
            index="locatario"
            categories={["totalFaturado"]}
            colors={["blue"]}
            valueFormatter={(value) => formatarMoeda(value)}
            yAxisWidth={80}
            showAnimation={true}
            showTooltip={true}
            customTooltip={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;

              const data = dadosProcessados.find(d => d.locatario === label);
              if (!data) return null;

              return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{data.locatarioCompleto}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Total Faturado:</span> <span className="font-medium">{formatarMoeda(data.totalFaturado)}</span></p>
                    <p><span className="text-gray-600">Total Pago:</span> <span className="font-medium">{formatarMoeda(data.totalPago)}</span></p>
                    <p><span className="text-gray-600">Performance:</span> 
                      <span className={`font-medium ml-1 ${data.performance >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.performance}%
                      </span>
                    </p>
                    <p><span className="text-gray-600">Receita/m²:</span> <span className="font-medium">{formatarMoeda(data.receitaPorM2)}</span></p>
                    <p><span className="text-gray-600">Categoria:</span> <span className="font-medium">{data.categoria}</span></p>
                    {data.inadimplencia > 0 && (
                      <p className="text-red-600"><span>Inadimplência:</span> <span className="font-medium">{formatarMoeda(data.inadimplencia)}</span></p>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Performance Badges */}
        <div className="flex flex-wrap gap-2">
          {dadosProcessados.slice(0, 5).map((item, index) => {
            const variacao = analytics?.insights?.crescimentoMensal || 0;
            const TrendIcon = variacao > 0 ? TrendingUp : TrendingDown;
            
            return (
              <Badge 
                key={item.locatarioCompleto}
                color={item.performance >= 90 ? 'emerald' : item.performance >= 70 ? 'yellow' : 'red'}
                size="sm"
                className="flex items-center gap-1"
              >
                {index === 0 && <TrendIcon className="h-3 w-3" />}
                {item.locatario} - {item.performance}%
              </Badge>
            );
          })}
        </div>

        {/* Comparação (se habilitada) */}
        {mostrarComparacao && analytics?.insights && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <Flex justifyContent="between" className="mb-2">
              <Text className="font-medium">Benchmark do Período</Text>
              {analytics.insights.crescimentoMensal !== 0 && (
                <Badge 
                  color={analytics.insights.crescimentoMensal > 0 ? 'emerald' : 'red'}
                  size="sm"
                >
                  {formatarVariacao(analytics.insights.crescimentoMensal).texto}
                </Badge>
              )}
            </Flex>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Total Receita</Text>
                <Text className="font-semibold">{formatarMoeda(analytics.insights.totalReceita)}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Melhor Locatário</Text>
                <Text className="font-semibold">{analytics.insights.melhorLocatario?.locatario || 'N/A'}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Taxa Inadimplência</Text>
                <Text className={`font-semibold ${analytics.insights.taxaInadimplencia > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {analytics.insights.taxaInadimplencia.toFixed(2)}%
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
};