import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, Title, Text, Flex, Badge } from '@tremor/react';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useMovimentacoesFinanceiras } from '@/hooks/useFinancialData';
import { FINANCIAL_PALETTE, DEFAULT_CHART_CONFIG, SOFT_COLORS } from '@/lib/chart-colors';
import { formatarMoeda, formatarData } from '@/lib/formatters';

interface MovimentacaoFinanceiraChartProps {
  periodo?: string;
  tipoVisualizacao?: 'area' | 'bar';
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  showComparison?: boolean;
  onPeriodChange?: (periodo: string) => void;
}

interface MovimentacaoDiaria {
  data: string;
  dataFormatada: string;
  creditos: number;
  debitos: number;
  saldoLiquido: number;
  transacoes: number;
  shopping: string;
}

const MovimentacaoFinanceiraChart: React.FC<MovimentacaoFinanceiraChartProps> = ({
  periodo = '30d',
  tipoVisualizacao = 'area',
  altura = 'lg',
  showComparison = false,
  onPeriodChange
}) => {
  const { data: movimentacoes, isLoading, error } = useMovimentacoesFinanceiras();

  // 📊 Processar dados para visualização diária
  const dadosProcessados = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) return [];

    // Agrupar por data e calcular totais
    const agrupamentoPorData = movimentacoes.reduce((acc, mov) => {
      const data = mov.Data || '';
      const dataKey = data.split('T')[0]; // Pegar apenas a data (YYYY-MM-DD)
      
      if (!dataKey) return acc;

      if (!acc[dataKey]) {
        acc[dataKey] = {
          data: dataKey,
          dataFormatada: formatarData(dataKey),
          creditos: 0,
          debitos: 0,
          saldoLiquido: 0,
          transacoes: 0,
          shopping: mov.Shopping || 'N/A'
        };
      }

      const credito = Number(mov.Credito) || 0;
      const debito = Number(mov.Debito) || 0;

      acc[dataKey].creditos += credito;
      acc[dataKey].debitos += debito;
      acc[dataKey].saldoLiquido += (credito - debito);
      acc[dataKey].transacoes += 1;

      return acc;
    }, {} as Record<string, MovimentacaoDiaria>);

    // Converter para array e ordenar por data
    const dadosArray = Object.values(agrupamentoPorData)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-30); // Últimos 30 dias

    return dadosArray;
  }, [movimentacoes]);

  // 📈 Métricas resumo
  const metricas = useMemo(() => {
    if (dadosProcessados.length === 0) return null;

    const totalCreditos = dadosProcessados.reduce((sum, item) => sum + item.creditos, 0);
    const totalDebitos = dadosProcessados.reduce((sum, item) => sum + item.debitos, 0);
    const saldoTotal = totalCreditos - totalDebitos;
    const mediaTransacoesDia = dadosProcessados.reduce((sum, item) => sum + item.transacoes, 0) / dadosProcessados.length;

    return {
      totalCreditos,
      totalDebitos,
      saldoTotal,
      mediaTransacoesDia: Math.round(mediaTransacoesDia),
      tendencia: saldoTotal > 0 ? 'positiva' : 'negativa'
    };
  }, [dadosProcessados]);

  // 🎨 Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={DEFAULT_CHART_CONFIG.tooltipStyle}>
          <p className="font-semibold mb-2">{formatarData(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}:</span>
              </div>
              <span className="font-medium text-sm ml-4">
                {formatarMoeda(entry.value)}
              </span>
            </div>
          ))}
          <hr className="my-2 border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saldo:</span>
            <span 
              className={`font-semibold text-sm ${
                (payload[0]?.payload?.saldoLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarMoeda(payload[0]?.payload?.saldoLiquido || 0)}
            </span>
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

  if (error || dadosProcessados.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma movimentação financeira encontrada</p>
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
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Title className="text-lg font-semibold">Movimentação Financeira Diária</Title>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Análise de fluxo de caixa por empresa - Últimos 30 dias
              </Text>
            </div>
          </Flex>

          {/* Métricas resumo */}
          {metricas && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <Text className="text-xs text-green-700 font-medium">Total Créditos</Text>
                <Text className="text-lg font-bold text-green-800">
                  {formatarMoeda(metricas.totalCreditos)}
                </Text>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <Text className="text-xs text-red-700 font-medium">Total Débitos</Text>
                <Text className="text-lg font-bold text-red-800">
                  {formatarMoeda(metricas.totalDebitos)}
                </Text>
              </div>
              
              <div className={`p-3 rounded-lg ${
                metricas.saldoTotal >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <Text className={`text-xs font-medium ${
                  metricas.saldoTotal >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>Saldo Líquido</Text>
                <Text className={`text-lg font-bold ${
                  metricas.saldoTotal >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>
                  {formatarMoeda(metricas.saldoTotal)}
                </Text>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <Text className="text-xs text-purple-700 font-medium">Média Transações/Dia</Text>
                <Text className="text-lg font-bold text-purple-800">
                  {metricas.mediaTransacoesDia}
                </Text>
              </div>
            </div>
          )}
        </div>

        <Badge 
          icon={Calendar}
          size="sm"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {periodo}
        </Badge>
      </Flex>

      {/* Gráfico */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          {tipoVisualizacao === 'area' ? (
            <AreaChart
              data={dadosProcessados}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                dataKey="dataFormatada"
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <YAxis 
                tickFormatter={(value) => formatarMoeda(value, true)} // Formato compacto
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle}
              />
              
              <Area
                type="monotone"
                dataKey="creditos"
                stackId="1"
                stroke={FINANCIAL_PALETTE[0]}
                fill={FINANCIAL_PALETTE[0]}
                fillOpacity={0.6}
                name="Créditos"
                animationDuration={DEFAULT_CHART_CONFIG.animationDuration}
              />
              <Area
                type="monotone"
                dataKey="debitos"
                stackId="2"
                stroke={FINANCIAL_PALETTE[1]}
                fill={FINANCIAL_PALETTE[1]}
                fillOpacity={0.6}
                name="Débitos"
                animationDuration={DEFAULT_CHART_CONFIG.animationDuration}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={dadosProcessados}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                dataKey="dataFormatada"
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <YAxis 
                tickFormatter={(value) => formatarMoeda(value, true)}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle}
              />
              
              <Bar
                dataKey="creditos"
                fill={FINANCIAL_PALETTE[0]}
                name="Créditos"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="debitos"
                fill={FINANCIAL_PALETTE[1]}
                name="Débitos"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer com informações adicionais */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Flex alignItems="center" justifyContent="between">
          <Text className="text-xs text-gray-500">
            Dados atualizados: {formatarData(new Date().toISOString())}
          </Text>
          <Text className="text-xs text-gray-500">
            {dadosProcessados.length} dias de movimentação
          </Text>
        </Flex>
      </div>
    </Card>
  );
};

export default MovimentacaoFinanceiraChart;