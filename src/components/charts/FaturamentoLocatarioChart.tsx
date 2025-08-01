import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { Card, Title, Text, Flex, Badge, Button } from '@tremor/react';
import { BarChart3, Store, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useFaturamentoData } from '@/hooks/useFinancialData';
import { CATEGORY_PALETTE, DEFAULT_CHART_CONFIG, SOFT_COLORS } from '@/lib/chart-colors';
import { formatarMoeda, formatarData, getColorByValue } from '@/lib/formatters';

interface FaturamentoLocatarioChartProps {
  tipoVisualizacao?: 'bar' | 'horizontal' | 'composed';
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  ordenacao?: 'faturamento' | 'pago' | 'aberto' | 'inadimplencia';
  limite?: number;
  showComparison?: boolean;
  filtroCategoria?: string;
  onLocatarioClick?: (locatario: string) => void;
}

interface FaturamentoLocatario {
  locatario: string;
  nomeRazaoSocial: string;
  shopping: string;
  categoria: string;
  area: number;
  statusCliente: string;
  valorFaturado: number;
  valorPago: number;
  valorAberto: number;
  inadimplencia: number;
  transacoes: number;
  ticketMedio: number;
  taxaPagamento: number;
  taxaInadimplencia: number;
  ultimoVencimento: string;
  cor: string;
  status: 'Adimplente' | 'Em Atraso' | 'Crítico';
  faturamentoPorM2: number;
}

const FaturamentoLocatarioChart: React.FC<FaturamentoLocatarioChartProps> = ({
  tipoVisualizacao = 'bar',
  altura = 'lg',
  ordenacao = 'faturamento',
  limite = 15,
  showComparison = true,
  filtroCategoria,
  onLocatarioClick
}) => {
  const { data: faturamento, isLoading, error } = useFaturamentoData();
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'adimplente' | 'atraso' | 'critico'>('todos');

  // 📊 Processar dados de faturamento por locatário
  const dadosFaturamento = useMemo(() => {
    if (!faturamento || faturamento.length === 0) return [];

    const locatariosMap: Record<string, FaturamentoLocatario> = {};
    let corIndex = 0;

    faturamento.forEach(fat => {
      const locatario = fat.locatario || 'N/A';
      const nomeRazaoSocial = fat.nomerazaosocial || locatario;
      const shopping = fat.shopping || 'N/A';
      const categoria = fat.categoria || 'Varejo';
      const area = Number(fat.area) || 0;
      const statusCliente = fat.statuscliente || 'Ativo';
      const valorFaturado = Number(fat.valortotalfaturado) || 0;
      const valorPago = Number(fat.valortotalpago) || 0;
      const valorAberto = Number(fat.valortotalaberto) || 0;
      const inadimplencia = Number(fat.inadimplencia) || 0;
      const dataVencimento = fat.datavencimento || '';
      
      // Filtro por categoria se especificado
      if (filtroCategoria && categoria !== filtroCategoria) return;

      const chave = `${locatario}_${nomeRazaoSocial}_${shopping}`;
      
      if (!locatariosMap[chave]) {
        locatariosMap[chave] = {
          locatario,
          nomeRazaoSocial,
          shopping,
          categoria,
          area,
          statusCliente,
          valorFaturado: 0,
          valorPago: 0,
          valorAberto: 0,
          inadimplencia: 0,
          transacoes: 0,
          ticketMedio: 0,
          taxaPagamento: 0,
          taxaInadimplencia: 0,
          ultimoVencimento: dataVencimento,
          cor: CATEGORY_PALETTE[corIndex % CATEGORY_PALETTE.length],
          status: 'Adimplente',
          faturamentoPorM2: 0
        };
        corIndex++;
      }

      locatariosMap[chave].valorFaturado += valorFaturado;
      locatariosMap[chave].valorPago += valorPago;
      locatariosMap[chave].valorAberto += valorAberto;
      locatariosMap[chave].inadimplencia += inadimplencia;
      locatariosMap[chave].transacoes += 1;
      
      // Atualizar último vencimento
      if (dataVencimento > locatariosMap[chave].ultimoVencimento) {
        locatariosMap[chave].ultimoVencimento = dataVencimento;
      }
    });

    // Calcular métricas derivadas
    const locatarios = Object.values(locatariosMap).map(loc => {
      loc.ticketMedio = loc.transacoes > 0 ? loc.valorFaturado / loc.transacoes : 0;
      loc.taxaPagamento = loc.valorFaturado > 0 ? (loc.valorPago / loc.valorFaturado) * 100 : 0;
      loc.taxaInadimplencia = loc.valorFaturado > 0 ? (loc.inadimplencia / loc.valorFaturado) * 100 : 0;
      loc.faturamentoPorM2 = loc.area > 0 ? loc.valorFaturado / loc.area : 0;
      
      // Determinar status baseado na taxa de inadimplência
      if (loc.taxaInadimplencia >= 15) {
        loc.status = 'Crítico';
        loc.cor = SOFT_COLORS.danger;
      } else if (loc.taxaInadimplencia >= 5) {
        loc.status = 'Em Atraso';
        loc.cor = SOFT_COLORS.warning;
      } else {
        loc.status = 'Adimplente';
        loc.cor = SOFT_COLORS.success;
      }
      
      return loc;
    });

    // Filtrar por status se especificado
    let locatariosFiltrados = locatarios;
    if (filtroStatus !== 'todos') {
      const statusMap = {
        'adimplente': 'Adimplente',
        'atraso': 'Em Atraso',
        'critico': 'Crítico'
      };
      locatariosFiltrados = locatarios.filter(loc => loc.status === statusMap[filtroStatus]);
    }

    // Ordenar baseado no critério selecionado
    locatariosFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'pago':
          return b.valorPago - a.valorPago;
        case 'aberto':
          return b.valorAberto - a.valorAberto;
        case 'inadimplencia':
          return b.taxaInadimplencia - a.taxaInadimplencia;
        default:
          return b.valorFaturado - a.valorFaturado;
      }
    });
    
    return locatariosFiltrados.slice(0, limite);
  }, [faturamento, filtroCategoria, filtroStatus, ordenacao, limite]);

  // 📈 Métricas resumo
  const metricas = useMemo(() => {
    if (dadosFaturamento.length === 0) return null;

    const totalFaturado = dadosFaturamento.reduce((sum, loc) => sum + loc.valorFaturado, 0);
    const totalPago = dadosFaturamento.reduce((sum, loc) => sum + loc.valorPago, 0);
    const totalAberto = dadosFaturamento.reduce((sum, loc) => sum + loc.valorAberto, 0);
    const totalInadimplencia = dadosFaturamento.reduce((sum, loc) => sum + loc.inadimplencia, 0);
    
    const locatariosAdimplentes = dadosFaturamento.filter(loc => loc.status === 'Adimplente').length;
    const locatariosEmAtraso = dadosFaturamento.filter(loc => loc.status === 'Em Atraso').length;
    const locatariosCriticos = dadosFaturamento.filter(loc => loc.status === 'Crítico').length;
    
    const melhorLocatario = dadosFaturamento[0]; // Já ordenado
    const ticketMedioGeral = dadosFaturamento.length > 0 ? 
      totalFaturado / dadosFaturamento.reduce((sum, loc) => sum + loc.transacoes, 0) : 0;
    
    return {
      totalFaturado,
      totalPago,
      totalAberto,
      totalInadimplencia,
      taxaPagamentoGeral: totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0,
      taxaInadimplenciaGeral: totalFaturado > 0 ? (totalInadimplencia / totalFaturado) * 100 : 0,
      locatariosAdimplentes,
      locatariosEmAtraso,
      locatariosCriticos,
      melhorLocatario,
      ticketMedioGeral,
      numLocatarios: dadosFaturamento.length
    };
  }, [dadosFaturamento]);

  // 🎨 Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={DEFAULT_CHART_CONFIG.tooltipStyle}>
          <p className="font-semibold mb-2">{data.nomeRazaoSocial}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Faturado:</span>
              <span className="font-medium">{formatarMoeda(data.valorFaturado)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pago:</span>
              <span className="font-medium text-green-600">{formatarMoeda(data.valorPago)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Em Aberto:</span>
              <span className="font-medium text-orange-600">{formatarMoeda(data.valorAberto)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Taxa Pagamento:</span>
              <span className="font-medium">{data.taxaPagamento.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Categoria:</span>
              <span className="text-xs">{data.categoria}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Status:</span>
              <Badge size="xs" className={`${
                data.status === 'Crítico' ? 'bg-red-50 text-red-700' :
                data.status === 'Em Atraso' ? 'bg-yellow-50 text-yellow-700' :
                'bg-green-50 text-green-700'
              }`}>
                {data.status}
              </Badge>
            </div>
            {data.area > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Faturamento/m²:</span>
                <span className="text-xs">{formatarMoeda(data.faturamentoPorM2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const alturaMap = {
    sm: 'h-64',
    md: 'h-80', 
    lg: 'h-96',
    xl: 'h-[500px]'
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className={`bg-gray-200 rounded ${alturaMap[altura]}`}></div>
        </div>
      </Card>
    );
  }

  if (error || dadosFaturamento.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado de faturamento por locatário encontrado</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header com métricas */}
      <Flex alignItems="start" justifyContent="between" className="mb-6">
        <div className="flex-1">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <Title className="text-lg font-semibold">Faturamento por Locatário</Title>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Análise de performance individual dos locatários
              </Text>
            </div>
          </Flex>

          {/* Métricas resumo */}
          {metricas && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <Store className="h-4 w-4 text-blue-600" />
                  <Text className="text-xs text-blue-700 font-medium">Total Faturado</Text>
                </Flex>
                <Text className="text-lg font-bold text-blue-800">
                  {formatarMoeda(metricas.totalFaturado)}
                </Text>
                <Text className="text-xs text-blue-600">
                  {metricas.numLocatarios} locatários
                </Text>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Text className="text-xs text-green-700 font-medium">Taxa Pagamento</Text>
                </Flex>
                <Text className="text-lg font-bold text-green-800">
                  {metricas.taxaPagamentoGeral.toFixed(1)}%
                </Text>
                <Text className="text-xs text-green-600">
                  {metricas.locatariosAdimplentes} adimplentes
                </Text>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <Text className="text-xs text-orange-700 font-medium">Em Aberto</Text>
                </Flex>
                <Text className="text-lg font-bold text-orange-800">
                  {formatarMoeda(metricas.totalAberto)}
                </Text>
                <Text className="text-xs text-orange-600">
                  {metricas.locatariosEmAtraso} em atraso
                </Text>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <Text className="text-xs text-red-700 font-medium">Inadimplência</Text>
                </Flex>
                <Text className="text-lg font-bold text-red-800">
                  {metricas.taxaInadimplenciaGeral.toFixed(1)}%
                </Text>
                <Text className="text-xs text-red-600">
                  {metricas.locatariosCriticos} críticos
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-2">
          <Flex alignItems="center" justifyContent="end" className="gap-2">
            <Button 
              size="xs" 
              variant={filtroStatus === 'todos' ? 'primary' : 'secondary'}
              onClick={() => setFiltroStatus('todos')}
            >
              Todos
            </Button>
            <Button 
              size="xs" 
              variant={filtroStatus === 'adimplente' ? 'primary' : 'secondary'}
              onClick={() => setFiltroStatus('adimplente')}
            >
              Adimplentes
            </Button>
            <Button 
              size="xs" 
              variant={filtroStatus === 'atraso' ? 'primary' : 'secondary'}
              onClick={() => setFiltroStatus('atraso')}
            >
              Em Atraso
            </Button>
            <Button 
              size="xs" 
              variant={filtroStatus === 'critico' ? 'primary' : 'secondary'}
              onClick={() => setFiltroStatus('critico')}
            >
              Críticos
            </Button>
          </Flex>
          
          <Button 
            size="xs" 
            variant="secondary"
            onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
          >
            {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes
          </Button>
        </div>
      </Flex>

      {/* Gráfico */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          {tipoVisualizacao === 'composed' ? (
            <ComposedChart
              data={dadosFaturamento}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                dataKey="locatario"
                tick={{ fontSize: 10 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatarMoeda(value, true)}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle} />
              
              <Bar
                yAxisId="left"
                dataKey="valorFaturado"
                name="Faturado"
                fill={SOFT_COLORS.primary}
                radius={[2, 2, 0, 0]}
                onClick={(data) => onLocatarioClick && onLocatarioClick(data.locatario)}
              />
              <Bar
                yAxisId="left"
                dataKey="valorPago"
                name="Pago"
                fill={SOFT_COLORS.success}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxaPagamento"
                stroke={SOFT_COLORS.insight}
                strokeWidth={2}
                name="Taxa Pagamento (%)"
                dot={{ fill: SOFT_COLORS.insight, strokeWidth: 2, r: 3 }}
              />
            </ComposedChart>
          ) : (
            <BarChart
              data={dadosFaturamento}
              margin={DEFAULT_CHART_CONFIG.margin}
              layout={tipoVisualizacao === 'horizontal' ? 'horizontal' : undefined}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                type={tipoVisualizacao === 'horizontal' ? 'number' : 'category'}
                dataKey={tipoVisualizacao === 'horizontal' ? undefined : "locatario"}
                tickFormatter={tipoVisualizacao === 'horizontal' ? (value) => formatarMoeda(value, true) : undefined}
                tick={{ fontSize: 10 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
                angle={tipoVisualizacao === 'horizontal' ? 0 : -45}
                textAnchor={tipoVisualizacao === 'horizontal' ? 'middle' : 'end'}
                height={tipoVisualizacao === 'horizontal' ? 60 : 100}
              />
              <YAxis 
                type={tipoVisualizacao === 'horizontal' ? 'category' : 'number'}
                dataKey={tipoVisualizacao === 'horizontal' ? "locatario" : undefined}
                tickFormatter={tipoVisualizacao === 'horizontal' ? undefined : (value) => formatarMoeda(value, true)}
                tick={{ fontSize: 10 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
                width={tipoVisualizacao === 'horizontal' ? 120 : 60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle} />
              
              <Bar
                dataKey="valorFaturado"
                name="Valor Faturado"
                radius={tipoVisualizacao === 'horizontal' ? [0, 2, 2, 0] : [2, 2, 0, 0]}
                onClick={(data) => onLocatarioClick && onLocatarioClick(data.locatario)}
              >
                {dadosFaturamento.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cor}
                    className="hover:opacity-80 cursor-pointer transition-opacity"
                  />
                ))}
              </Bar>
              
              {showComparison && (
                <Bar
                  dataKey="valorPago"
                  name="Valor Pago"
                  fill={SOFT_COLORS.success}
                  fillOpacity={0.7}
                  radius={tipoVisualizacao === 'horizontal' ? [0, 2, 2, 0] : [2, 2, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Detalhes expandidos */}
      {mostrarDetalhes && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Text className="text-sm font-semibold mb-4">Detalhes dos Locatários:</Text>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2">Locatário</th>
                  <th className="text-right p-2">Faturado</th>
                  <th className="text-right p-2">Pago</th>
                  <th className="text-right p-2">Taxa Pag.</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-right p-2">Área (m²)</th>
                  <th className="text-right p-2">R$/m²</th>
                </tr>
              </thead>
              <tbody>
                {dadosFaturamento.slice(0, 10).map((locatario, index) => (
                  <tr 
                    key={locatario.locatario}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onLocatarioClick && onLocatarioClick(locatario.locatario)}
                  >
                    <td className="p-2">
                      <div>
                        <Text className="font-medium">{locatario.locatario}</Text>
                        <Text className="text-xs text-gray-500">{locatario.categoria}</Text>
                      </div>
                    </td>
                    <td className="text-right p-2 font-medium">
                      {formatarMoeda(locatario.valorFaturado)}
                    </td>
                    <td className="text-right p-2 font-medium text-green-600">
                      {formatarMoeda(locatario.valorPago)}
                    </td>
                    <td className="text-right p-2">
                      {locatario.taxaPagamento.toFixed(1)}%
                    </td>
                    <td className="text-center p-2">
                      <Badge size="xs" className={`${
                        locatario.status === 'Crítico' ? 'bg-red-50 text-red-700' :
                        locatario.status === 'Em Atraso' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {locatario.status}
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      {locatario.area > 0 ? locatario.area.toLocaleString() : '-'}
                    </td>
                    <td className="text-right p-2">
                      {locatario.area > 0 ? formatarMoeda(locatario.faturamentoPorM2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FaturamentoLocatarioChart;