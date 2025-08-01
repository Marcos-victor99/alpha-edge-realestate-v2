import React, { useMemo, useState } from 'react';
import { AreaChart, Card, Title, Text, Flex, Badge, Button } from '@tremor/react';
import { useFluxoCaixaData, useLiquidezRealTime, FiltrosFluxoCaixa } from '@/hooks/useFluxoCaixaData';
import { formatarMoeda, formatarData } from '@/lib/formatters';
import { ChartCard } from '@/components/ui/ChartCard';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity
} from 'lucide-react';
import * as d3 from 'd3';
import _ from 'lodash';
import { CSVLink } from 'react-csv';

interface FluxoCaixaChartProps {
  filtros?: FiltrosFluxoCaixa;
  periodo?: '7d' | '30d' | '90d' | 'personalizado';
  tipoVisualizacao?: 'fluxo' | 'acumulado' | 'comparativo';
  altura?: 'sm' | 'md' | 'lg';
  titulo?: string;
  subtitulo?: string;
  mostrarLiquidezRealTime?: boolean;
  onExport?: () => void;
  onFullscreen?: () => void;
  onFiltroChange?: (filtros: FiltrosFluxoCaixa) => void;
}

export const FluxoCaixaChart: React.FC<FluxoCaixaChartProps> = ({
  filtros = {},
  periodo = '30d',
  tipoVisualizacao = 'fluxo',
  altura = 'md',
  titulo = "Fluxo de Caixa",
  subtitulo = "Análise temporal de entradas e saídas financeiras",
  mostrarLiquidezRealTime = false,
  onExport,
  onFullscreen,
  onFiltroChange
}) => {
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState(tipoVisualizacao);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Definir filtros baseados no período
  const filtrosProcessados = useMemo(() => {
    const hoje = new Date();
    const dataInicio = new Date();
    
    switch (periodo) {
      case '7d':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(hoje.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(hoje.getDate() - 90);
        break;
    }

    return {
      ...filtros,
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
  }, [filtros, periodo]);

  const { data: fluxoData, isLoading, error } = useFluxoCaixaData(filtrosProcessados);
  const { data: liquidezRealTime } = useLiquidezRealTime();

  // Processar dados para visualização usando Lodash e D3
  const dadosProcessados = useMemo(() => {
    if (!fluxoData?.fluxoDiario || fluxoData.fluxoDiario.length === 0) return [];

    // Usar Lodash para processar dados temporais
    const dadosOrdenados = _(fluxoData.fluxoDiario)
      .orderBy(['data'], ['asc'])
      .value();

    switch (visualizacaoAtiva) {
      case 'acumulado':
        return dadosOrdenados.map(dia => ({
          data: formatarData(dia.data),
          dataCompleta: dia.data,
          'Saldo Acumulado': dia.saldoAcumulado,
          entradas: dia.entradas,
          saidas: dia.saidas,
          transacoes: dia.transacoes
        }));

      case 'comparativo':
        return dadosOrdenados.map(dia => ({
          data: formatarData(dia.data),
          dataCompleta: dia.data,
          'Entradas': dia.entradas,
          'Saídas': Math.abs(dia.saidas), // Valor absoluto para melhor visualização
          'Saldo Líquido': dia.saldoLiquido,
          transacoes: dia.transacoes
        }));

      default: // 'fluxo'
        return dadosOrdenados.map(dia => ({
          data: formatarData(dia.data),
          dataCompleta: dia.data,
          'Fluxo Líquido': dia.saldoLiquido,
          entradas: dia.entradas,
          saidas: dia.saidas,
          transacoes: dia.transacoes
        }));
    }
  }, [fluxoData?.fluxoDiario, visualizacaoAtiva]);

  // Calcular estatísticas usando D3
  const estatisticas = useMemo(() => {
    if (!fluxoData?.analise) return null;

    const saldos = dadosProcessados.map(d => 
      visualizacaoAtiva === 'acumulado' ? d['Saldo Acumulado'] : 
      visualizacaoAtiva === 'comparativo' ? d['Saldo Líquido'] : 
      d['Fluxo Líquido']
    );

    return {
      media: d3.mean(saldos) || 0,
      mediana: d3.median(saldos) || 0,
      minimo: d3.min(saldos) || 0,
      maximo: d3.max(saldos) || 0,
      volatilidade: d3.deviation(saldos) || 0,
      tendencia: fluxoData.analise.tendencia,
      diasPositivos: fluxoData.analise.diasComSaldoPositivo,
      diasNegativos: fluxoData.analise.diasComSaldoNegativo
    };
  }, [dadosProcessados, fluxoData?.analise, visualizacaoAtiva]);

  // Preparar dados para exportação
  const dadosExportacao = useMemo(() => {
    if (!fluxoData?.movimentacoes) return [];

    return fluxoData.movimentacoes.map(mov => ({
      'Data': formatarData(mov.data),
      'Shopping': mov.shopping,
      'Fornecedor': mov.fornecedor || 'N/A',
      'Categoria': mov.categoria,
      'Débito (R$)': mov.debito,
      'Crédito (R$)': mov.credito,
      'Valor Líquido (R$)': mov.valorLiquido,
      'Tipo Documento': mov.tipoDocumento || 'N/A',
      'Descrição': mov.descricao
    }));
  }, [fluxoData?.movimentacoes]);

  // Definir categorias e cores baseadas no tipo de visualização
  const configuracaoGrafico = useMemo(() => {
    switch (visualizacaoAtiva) {
      case 'acumulado':
        return {
          categories: ['Saldo Acumulado'],
          colors: ['blue'],
          showGridLines: true,
          stack: false
        };
      case 'comparativo':
        return {
          categories: ['Entradas', 'Saídas'],
          colors: ['emerald', 'red'],
          showGridLines: true,
          stack: false
        };
      default:
        return {
          categories: ['Fluxo Líquido'],
          colors: ['purple'],
          showGridLines: true,
          stack: false
        };
    }
  }, [visualizacaoAtiva]);

  // Handlers
  const handleVisualizacaoChange = (novaVisualizacao: string) => {
    setVisualizacaoAtiva(novaVisualizacao as typeof visualizacaoAtiva);
  };

  const handleExport = () => {
    if (onExport) onExport();
  };

  // Ações customizadas
  const acoes = [
    {
      key: 'csv',
      label: 'Exportar Movimentações',
      icon: Download,
      onClick: handleExport,
      component: (
        <CSVLink 
          data={dadosExportacao} 
          filename={`fluxo-caixa-${periodo}-${new Date().toISOString().split('T')[0]}.csv`}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full"
        >
          <Download className="h-4 w-4" />
          Exportar Movimentações
        </CSVLink>
      )
    },
    {
      key: 'filtros',
      label: 'Filtros Avançados',
      icon: Filter,
      onClick: () => setMostrarDetalhes(!mostrarDetalhes)
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
          <Text>Nenhuma movimentação encontrada para o período selecionado</Text>
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
      onFullscreen={onFullscreen}
      extraActions={acoes}
    >
      <div className="space-y-6">
        {/* Controles de Visualização */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <Button
              size="sm"
              variant={visualizacaoAtiva === 'fluxo' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('fluxo')}
              className="px-3 py-1 text-sm"
            >
              Fluxo Líquido
            </Button>
            <Button
              size="sm"
              variant={visualizacaoAtiva === 'comparativo' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('comparativo')}
              className="px-3 py-1 text-sm"
            >
              Entradas vs Saídas
            </Button>
            <Button
              size="sm"
              variant={visualizacaoAtiva === 'acumulado' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('acumulado')}
              className="px-3 py-1 text-sm"
            >
              Saldo Acumulado
            </Button>
          </div>

          {/* Liquidez em Tempo Real */}
          {mostrarLiquidezRealTime && liquidezRealTime && (
            <div className="flex items-center gap-2">
              <Badge 
                color={liquidezRealTime.status === 'positivo' ? 'emerald' : 'red'}
                size="sm"
                className="flex items-center gap-1"
              >
                <Activity className="h-3 w-3" />
                Real-time: {formatarMoeda(liquidezRealTime.saldoHoje)}
              </Badge>
            </div>
          )}
        </div>

        {/* Métricas Resumo */}
        {estatisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Text className="text-sm text-gray-600">Saldo Médio</Text>
              <Text className="font-semibold text-lg flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatarMoeda(estatisticas.media)}
              </Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Volatilidade</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.volatilidade)}</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Dias Positivos</Text>
              <Text className="font-semibold text-lg flex items-center justify-center gap-1 text-green-600">
                <ArrowUpCircle className="h-4 w-4" />
                {estatisticas.diasPositivos}
              </Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Dias Negativos</Text>
              <Text className="font-semibold text-lg flex items-center justify-center gap-1 text-red-600">
                <ArrowDownCircle className="h-4 w-4" />
                {estatisticas.diasNegativos}
              </Text>
            </div>
          </div>
        )}

        {/* Gráfico Principal */}
        <div className={alturaMap[altura]}>
          <AreaChart
            data={dadosProcessados}
            index="data"
            categories={configuracaoGrafico.categories}
            colors={configuracaoGrafico.colors}
            valueFormatter={(value) => formatarMoeda(value)}
            yAxisWidth={80}
            showAnimation={true}
            showTooltip={true}
            showGridLines={configuracaoGrafico.showGridLines}
            stack={configuracaoGrafico.stack}
            customTooltip={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;

              const data = dadosProcessados.find(d => d.data === label);
              if (!data) return null;

              return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{label}</p>
                  <div className="space-y-1 text-sm">
                    {visualizacaoAtiva === 'comparativo' ? (
                      <>
                        <p><span className="text-green-600">Entradas:</span> <span className="font-medium">{formatarMoeda(data.entradas)}</span></p>
                        <p><span className="text-red-600">Saídas:</span> <span className="font-medium">{formatarMoeda(data.saidas)}</span></p>
                        <p><span className="text-gray-600">Saldo Líquido:</span> <span className="font-medium">{formatarMoeda(data['Saldo Líquido'])}</span></p>
                      </>
                    ) : visualizacaoAtiva === 'acumulado' ? (
                      <>
                        <p><span className="text-blue-600">Saldo Acumulado:</span> <span className="font-medium">{formatarMoeda(data['Saldo Acumulado'])}</span></p>
                        <p><span className="text-gray-600">Entradas do Dia:</span> <span className="font-medium">{formatarMoeda(data.entradas)}</span></p>
                        <p><span className="text-gray-600">Saídas do Dia:</span> <span className="font-medium">{formatarMoeda(data.saidas)}</span></p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-purple-600">Fluxo Líquido:</span> <span className="font-medium">{formatarMoeda(data['Fluxo Líquido'])}</span></p>
                        <p><span className="text-gray-600">Entradas:</span> <span className="font-medium">{formatarMoeda(data.entradas)}</span></p>
                        <p><span className="text-gray-600">Saídas:</span> <span className="font-medium">{formatarMoeda(data.saidas)}</span></p>
                      </>
                    )}
                    <p><span className="text-gray-600">Transações:</span> <span className="font-medium">{data.transacoes}</span></p>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Análise por Categoria */}
        {fluxoData?.porCategoria && fluxoData.porCategoria.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {fluxoData.porCategoria.slice(0, 3).map((categoria) => (
              <div key={categoria.categoria} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium">{categoria.categoria}</Text>
                  <Badge 
                    color={categoria.saldoLiquido >= 0 ? 'emerald' : 'red'} 
                    size="sm"
                  >
                    {categoria.saldoLiquido >= 0 ? '+' : ''}{formatarMoeda(categoria.saldoLiquido)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Entradas: {formatarMoeda(categoria.entradas)}</p>
                  <p>Saídas: {formatarMoeda(categoria.saidas)}</p>
                  <p>Transações: {categoria.transacoes}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tendência e Insights */}
        {fluxoData?.analise && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Flex justifyContent="between" className="mb-2">
              <Text className="font-medium">Análise de Tendência</Text>
              <Badge 
                color={
                  fluxoData.analise.tendencia === 'crescimento' ? 'emerald' :
                  fluxoData.analise.tendencia === 'declinio' ? 'red' : 'yellow'
                }
                size="sm"
                className="flex items-center gap-1"
              >
                {fluxoData.analise.tendencia === 'crescimento' ? 
                  <TrendingUp className="h-3 w-3" /> : 
                  fluxoData.analise.tendencia === 'declinio' ?
                  <TrendingDown className="h-3 w-3" /> : 
                  <Activity className="h-3 w-3" />
                }
                {fluxoData.analise.tendencia.charAt(0).toUpperCase() + fluxoData.analise.tendencia.slice(1)}
              </Badge>
            </Flex>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Total Entradas</Text>
                <Text className="font-semibold text-green-600">{formatarMoeda(fluxoData.analise.totalEntradas)}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Total Saídas</Text>
                <Text className="font-semibold text-red-600">{formatarMoeda(fluxoData.analise.totalSaidas)}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Saldo Atual</Text>
                <Text className={`font-semibold ${fluxoData.analise.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarMoeda(fluxoData.analise.saldoAtual)}
                </Text>
              </div>
              <div>
                <Text className="text-gray-600">Fluxo Médio</Text>
                <Text className="font-semibold">{formatarMoeda(fluxoData.analise.fluxoMedio)}</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
};