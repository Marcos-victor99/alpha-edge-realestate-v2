import React, { useMemo, useState } from 'react';
import { DonutChart, Card, Title, Text, Flex, Badge, Button } from '@tremor/react';
import { useFornecedoresData, FiltrosFornecedores } from '@/hooks/useFornecedoresData';
import { formatarMoeda, formatarData } from '@/lib/formatters';
import { ChartCard } from '@/components/ui/ChartCard';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Users,
  ShoppingBag,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import * as d3 from 'd3';
import _ from 'lodash';
import { CSVLink } from 'react-csv';

interface FornecedoresChartProps {
  filtros?: FiltrosFornecedores;
  tipoVisualizacao?: 'ranking' | 'categoria' | 'status';
  limite?: number;
  altura?: 'sm' | 'md' | 'lg';
  titulo?: string;
  subtitulo?: string;
  mostrarDetalhes?: boolean;
  onExport?: () => void;
  onFullscreen?: () => void;
  onFiltroChange?: (filtros: FiltrosFornecedores) => void;
}

export const FornecedoresChart: React.FC<FornecedoresChartProps> = ({
  filtros = {},
  tipoVisualizacao = 'ranking',
  limite = 10,
  altura = 'md',
  titulo = "Análise de Fornecedores",
  subtitulo = "Distribuição de gastos e performance por fornecedor",
  mostrarDetalhes = false,
  onExport,
  onFullscreen,
  onFiltroChange
}) => {
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState(tipoVisualizacao);
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false);

  const { data: fornecedoresData, isLoading, error } = useFornecedoresData(filtros);

  // Processar dados para o gráfico usando Lodash
  const dadosProcessados = useMemo(() => {
    if (!fornecedoresData) return [];

    switch (visualizacaoAtiva) {
      case 'categoria':
        return fornecedoresData.porCategoria
          .slice(0, limite)
          .map(cat => ({
            name: cat.categoria,
            value: cat.totalGasto,
            valueFormatted: formatarMoeda(cat.totalGasto),
            participacao: cat.participacao,
            fornecedores: cat.fornecedores,
            eficiencia: cat.eficienciaPagamento,
            cor: cat.cor,
            detalhes: {
              totalPago: cat.totalPago,
              totalPendente: cat.totalPendente,
              prazoMedio: cat.prazoMedioPagamento,
              crescimento: cat.crescimentoMensal
            }
          }));

      case 'status': {
        // Agrupar por status de pagamento usando Lodash
        const statusGroups = _(fornecedoresData.ranking)
          .groupBy('statusGeral')
          .map((fornecedores, status) => ({
            name: traduzirStatus(status),
            value: _.sumBy(fornecedores, 'totalContratado'),
            valueFormatted: formatarMoeda(_.sumBy(fornecedores, 'totalContratado')),
            count: fornecedores.length,
            cor: getCorStatus(status),
            detalhes: {
              totalPago: _.sumBy(fornecedores, 'totalPago'),
              totalPendente: _.sumBy(fornecedores, 'totalPendente'),
              ticketMedio: _.meanBy(fornecedores, 'ticketMedio') || 0,
              diasMedios: _.meanBy(fornecedores, 'diasMediosPagamento') || 0
            }
          }))
          .orderBy(['value'], ['desc'])
          .value();
        
        return statusGroups;
      }

      default: // 'ranking'
        return fornecedoresData.ranking
          .slice(0, limite)
          .map(forn => ({
            name: forn.fornecedor.length > 25 ? `${forn.fornecedor.substring(0, 22)}...` : forn.fornecedor,
            nameCompleto: forn.fornecedor,
            value: forn.totalContratado,
            valueFormatted: formatarMoeda(forn.totalContratado),
            participacao: (forn.totalContratado / fornecedoresData.metricas.totalContratado) * 100,
            performance: forn.percentualPago,
            status: forn.statusGeral,
            cor: forn.cor,
            detalhes: {
              totalPago: forn.totalPago,
              totalPendente: forn.totalPendente,
              transacoes: forn.numeroTransacoes,
              ticketMedio: forn.ticketMedio,
              diasMedios: forn.diasMediosPagamento,
              ultimoPagamento: forn.ultimoPagamento,
              categoria: forn.categoria
            }
          }));
    }
  }, [fornecedoresData, visualizacaoAtiva, limite]);

  // Calcular estatísticas usando D3
  const estatisticas = useMemo(() => {
    if (!fornecedoresData || dadosProcessados.length === 0) return null;

    const valores = dadosProcessados.map(d => d.value);
    const participacoes = dadosProcessados.map(d => d.participacao || 0);

    return {
      total: d3.sum(valores),
      media: d3.mean(valores) || 0,
      mediana: d3.median(valores) || 0,
      maximo: d3.max(valores) || 0,
      minimo: d3.min(valores) || 0,
      desvio: d3.deviation(valores) || 0,
      concentracao: d3.sum(participacoes.slice(0, 3)), // Top 3
      distribuicao: {
        q1: d3.quantile(valores.sort(d3.ascending), 0.25) || 0,
        q3: d3.quantile(valores.sort(d3.ascending), 0.75) || 0
      }
    };
  }, [dadosProcessados, fornecedoresData]);

  // Preparar dados para exportação CSV
  const dadosExportacao = useMemo(() => {
    if (!fornecedoresData) return [];

    return fornecedoresData.ranking.map(item => ({
      'Fornecedor': item.fornecedor,
      'Shopping': item.shopping,
      'Total Contratado (R$)': item.totalContratado,
      'Total Pago (R$)': item.totalPago,
      'Total Pendente (R$)': item.totalPendente,
      'Percentual Pago (%)': item.percentualPago.toFixed(2),
      'Número Transações': item.numeroTransacoes,
      'Ticket Médio (R$)': item.ticketMedio.toFixed(2),
      'Dias Médios Pagamento': item.diasMediosPagamento.toFixed(1),
      'Status Geral': traduzirStatus(item.statusGeral),
      'Categoria': item.categoria,
      'Último Pagamento': item.ultimoPagamento ? formatarData(item.ultimoPagamento) : 'N/A'
    }));
  }, [fornecedoresData]);

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
      label: 'Exportar Fornecedores',
      icon: Download,
      onClick: handleExport,
      component: (
        <CSVLink 
          data={dadosExportacao} 
          filename={`fornecedores-${visualizacaoAtiva}-${new Date().toISOString().split('T')[0]}.csv`}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full"
        >
          <Download className="h-4 w-4" />
          Exportar Fornecedores
        </CSVLink>
      )
    },
    {
      key: 'estatisticas',
      label: 'Ver Estatísticas',
      icon: BarChart3,
      onClick: () => setMostrarEstatisticas(!mostrarEstatisticas)
    },
    {
      key: 'filtros',
      label: 'Filtros Avançados',
      icon: Filter,
      onClick: () => {
        if (onFiltroChange) {
          // Implementar modal de filtros ou callback
          onFiltroChange(filtros);
        }
      }
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
          <Text>Nenhum fornecedor encontrado para os filtros selecionados</Text>
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
              variant={visualizacaoAtiva === 'ranking' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('ranking')}
              className="px-3 py-1 text-sm flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              Ranking
            </Button>
            <Button
              size="sm"
              variant={visualizacaoAtiva === 'categoria' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('categoria')}
              className="px-3 py-1 text-sm flex items-center gap-1"
            >
              <ShoppingBag className="h-3 w-3" />
              Categorias
            </Button>
            <Button
              size="sm"
              variant={visualizacaoAtiva === 'status' ? 'primary' : 'secondary'}
              onClick={() => handleVisualizacaoChange('status')}
              className="px-3 py-1 text-sm flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Status
            </Button>
          </div>

          {/* Métricas Resumo */}
          {fornecedoresData?.metricas && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{fornecedoresData.metricas.totalFornecedores}</span>
                <span className="text-gray-600">fornecedores</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{fornecedoresData.metricas.prazoMedioPagamento.toFixed(0)}</span>
                <span className="text-gray-600">dias</span>
              </div>
              {fornecedoresData.metricas.alertasVencimento > 0 && (
                <Badge color="red" size="sm" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fornecedoresData.metricas.alertasVencimento} alertas
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Estatísticas Expandidas */}
        {mostrarEstatisticas && estatisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Text className="text-sm text-gray-600">Total Geral</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.total)}</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Valor Médio</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.media)}</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Concentração Top 3</Text>
              <Text className="font-semibold text-lg">{estatisticas.concentracao.toFixed(1)}%</Text>
            </div>
            <div className="text-center">
              <Text className="text-sm text-gray-600">Desvio Padrão</Text>
              <Text className="font-semibold text-lg">{formatarMoeda(estatisticas.desvio)}</Text>
            </div>
          </div>
        )}

        {/* Gráfico Principal */}
        <div className={alturaMap[altura]}>
          <DonutChart
            data={dadosProcessados}
            category="value"
            index="name"
            valueFormatter={(value) => formatarMoeda(value)}
            colors={dadosProcessados.map(d => d.cor)}
            showAnimation={true}
            showTooltip={true}
            customTooltip={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload;
              if (!data) return null;

              return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">
                    {data.nameCompleto || data.name}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Valor Total:</span> <span className="font-medium">{data.valueFormatted}</span></p>
                    <p><span className="text-gray-600">Participação:</span> <span className="font-medium">{data.participacao?.toFixed(1)}%</span></p>
                    
                    {data.detalhes && (
                      <>
                        {visualizacaoAtiva === 'ranking' && (
                          <>
                            <p><span className="text-gray-600">Total Pago:</span> <span className="font-medium text-green-600">{formatarMoeda(data.detalhes.totalPago)}</span></p>
                            <p><span className="text-gray-600">Total Pendente:</span> <span className="font-medium text-red-600">{formatarMoeda(data.detalhes.totalPendente)}</span></p>
                            <p><span className="text-gray-600">Transações:</span> <span className="font-medium">{data.detalhes.transacoes}</span></p>
                            <p><span className="text-gray-600">Ticket Médio:</span> <span className="font-medium">{formatarMoeda(data.detalhes.ticketMedio)}</span></p>
                            <p><span className="text-gray-600">Prazo Médio:</span> <span className="font-medium">{data.detalhes.diasMedios?.toFixed(1)} dias</span></p>
                            {data.detalhes.ultimoPagamento && (
                              <p><span className="text-gray-600">Último Pagamento:</span> <span className="font-medium">{formatarData(data.detalhes.ultimoPagamento)}</span></p>
                            )}
                          </>
                        )}
                        
                        {visualizacaoAtiva === 'categoria' && (
                          <>
                            <p><span className="text-gray-600">Fornecedores:</span> <span className="font-medium">{data.fornecedores}</span></p>
                            <p><span className="text-gray-600">Eficiência:</span> <span className="font-medium">{data.eficiencia?.toFixed(1)}%</span></p>
                            <p><span className="text-gray-600">Prazo Médio:</span> <span className="font-medium">{data.detalhes.prazoMedio?.toFixed(1)} dias</span></p>
                            {data.detalhes.crescimento !== 0 && (
                              <p>
                                <span className="text-gray-600">Crescimento:</span> 
                                <span className={`font-medium ml-1 ${data.detalhes.crescimento > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.detalhes.crescimento > 0 ? '+' : ''}{data.detalhes.crescimento?.toFixed(1)}%
                                </span>
                              </p>
                            )}
                          </>
                        )}
                        
                        {visualizacaoAtiva === 'status' && (
                          <>
                            <p><span className="text-gray-600">Fornecedores:</span> <span className="font-medium">{data.count}</span></p>
                            <p><span className="text-gray-600">Ticket Médio:</span> <span className="font-medium">{formatarMoeda(data.detalhes.ticketMedio)}</span></p>
                            <p><span className="text-gray-600">Prazo Médio:</span> <span className="font-medium">{data.detalhes.diasMedios?.toFixed(1)} dias</span></p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Lista de Detalhes */}
        {mostrarDetalhes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dadosProcessados.slice(0, 6).map((item, index) => (
              <div key={item.name} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium text-sm">{item.name}</Text>
                  <Badge 
                    color={getCorBadge(item.status || 'regular', visualizacaoAtiva)} 
                    size="sm"
                  >
                    #{index + 1}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Valor: <span className="font-medium text-gray-900">{item.valueFormatted}</span></p>
                  <p>Participação: <span className="font-medium">{item.participacao?.toFixed(1)}%</span></p>
                  {item.performance && (
                    <p>Performance: <span className={`font-medium ${item.performance >= 80 ? 'text-green-600' : 'text-red-600'}`}>{item.performance.toFixed(1)}%</span></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights e Alertas */}
        {fornecedoresData?.metricas && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Flex justifyContent="between" className="mb-2">
              <Text className="font-medium">Insights dos Fornecedores</Text>
              <Badge 
                color={
                  fornecedoresData.metricas.tendenciaPagamentos === 'crescimento' ? 'emerald' :
                  fornecedoresData.metricas.tendenciaPagamentos === 'declinio' ? 'red' : 'yellow'
                }
                size="sm"
                className="flex items-center gap-1"
              >
                {fornecedoresData.metricas.tendenciaPagamentos === 'crescimento' ? 
                  <TrendingUp className="h-3 w-3" /> : 
                  fornecedoresData.metricas.tendenciaPagamentos === 'declinio' ?
                  <TrendingDown className="h-3 w-3" /> : 
                  <Clock className="h-3 w-3" />
                }
                {fornecedoresData.metricas.tendenciaPagamentos.charAt(0).toUpperCase() + fornecedoresData.metricas.tendenciaPagamentos.slice(1)}
              </Badge>
            </Flex>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Taxa Pagamento</Text>
                <Text className={`font-semibold ${fornecedoresData.metricas.taxaPagamento >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                  {fornecedoresData.metricas.taxaPagamento.toFixed(1)}%
                </Text>
              </div>
              <div>
                <Text className="text-gray-600">Maior Gasto</Text>
                <Text className="font-semibold">{fornecedoresData.metricas.fornecedorMaiorGasto?.fornecedor || 'N/A'}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Melhor Performance</Text>
                <Text className="font-semibold text-green-600">{fornecedoresData.metricas.fornecedorMelhorPerformance?.fornecedor || 'N/A'}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Categoria Dominante</Text>
                <Text className="font-semibold">{fornecedoresData.metricas.categoriaComMaiorGasto}</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
};

// Funções auxiliares
function traduzirStatus(status: string): string {
  const traducoes: Record<string, string> = {
    'excelente': 'Excelente',
    'bom': 'Bom',
    'regular': 'Regular',
    'preocupante': 'Preocupante'
  };
  return traducoes[status] || status;
}

function getCorStatus(status: string): string {
  const cores: Record<string, string> = {
    'excelente': 'hsl(var(--chart-1))', // Verde
    'bom': 'hsl(var(--chart-bull))', // Azul
    'regular': 'hsl(var(--chart-5))', // Amarelo
    'preocupante': 'hsl(var(--chart-2))' // Vermelho
  };
  return cores[status] || 'hsl(var(--chart-neutral))';
}

function getCorBadge(status: string, tipo: string): 'emerald' | 'blue' | 'yellow' | 'red' | 'gray' {
  if (tipo === 'status') {
    switch (status) {
      case 'excelente': return 'emerald';
      case 'bom': return 'blue';
      case 'regular': return 'yellow';
      case 'preocupante': return 'red';
      default: return 'gray';
    }
  }
  return 'blue';
}