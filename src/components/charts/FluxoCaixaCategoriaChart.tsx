import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Title, Text, Flex, Badge } from '@tremor/react';
import { Activity, TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useMovimentacoesFinanceiras } from '@/hooks/useFinancialData';
import { CASH_FLOW_PALETTE, DEFAULT_CHART_CONFIG, SOFT_COLORS } from '@/lib/chart-colors';
import { formatarMoeda, formatarData } from '@/lib/formatters';

interface FluxoCaixaCategoriaChartProps {
  periodo?: string;
  tipoVisualizacao?: 'composed' | 'pie';
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  showTrend?: boolean;
  onCategoryClick?: (categoria: string) => void;
}

interface FluxoCategoria {
  categoria: string;
  creditos: number;
  debitos: number;
  saldoOperacional: number;
  transacoes: number;
  percentual: number;
  cor: string;
}

interface FluxoTemporal {
  periodo: string;
  creditos: number;
  debitos: number;
  saldoOperacional: number;
  acumulado: number;
}

const FluxoCaixaCategoriaChart: React.FC<FluxoCaixaCategoriaChartProps> = ({
  periodo = '30d',
  tipoVisualizacao = 'composed',
  altura = 'lg',
  showTrend = true,
  onCategoryClick
}) => {
  const { data: movimentacoes, isLoading, error } = useMovimentacoesFinanceiras();

  // 📊 Processar dados por categoria
  const dadosPorCategoria = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) return [];

    // Mapear categorias baseadas no tipo de movimentação
    const categorias = movimentacoes.reduce((acc, mov) => {
      // Determinar categoria baseada no histórico e tipo
      const historico = mov.Historico || '';
      const setor = mov.Setor || 'Geral';
      
      let categoria = 'Operacional';
      if (historico.toLowerCase().includes('aluguel') || historico.toLowerCase().includes('locação')) {
        categoria = 'Receitas de Locação';
      } else if (historico.toLowerCase().includes('taxa') || historico.toLowerCase().includes('condomínio')) {
        categoria = 'Taxas e Encargos';
      } else if (historico.toLowerCase().includes('manutenção') || historico.toLowerCase().includes('limpeza')) {
        categoria = 'Despesas Operacionais';
      } else if (historico.toLowerCase().includes('marketing') || historico.toLowerCase().includes('publicidade')) {
        categoria = 'Marketing';
      } else if (setor && setor !== 'Geral') {
        categoria = setor;
      }

      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          creditos: 0,
          debitos: 0,
          saldoOperacional: 0,
          transacoes: 0,
          percentual: 0,
          cor: CASH_FLOW_PALETTE[Object.keys(acc).length % CASH_FLOW_PALETTE.length]
        };
      }

      const credito = Number(mov.Credito) || 0;
      const debito = Number(mov.Debito) || 0;

      acc[categoria].creditos += credito;
      acc[categoria].debitos += debito;
      acc[categoria].saldoOperacional += (credito - debito);
      acc[categoria].transacoes += 1;

      return acc;
    }, {} as Record<string, FluxoCategoria>);

    // Calcular percentuais
    const totalMovimentacao = Object.values(categorias).reduce(
      (sum, cat) => sum + Math.abs(cat.saldoOperacional), 0
    );

    return Object.values(categorias).map(cat => ({
      ...cat,
      percentual: totalMovimentacao > 0 ? (Math.abs(cat.saldoOperacional) / totalMovimentacao) * 100 : 0
    })).sort((a, b) => Math.abs(b.saldoOperacional) - Math.abs(a.saldoOperacional));
  }, [movimentacoes]);

  // 📈 Dados temporais para análise de tendência
  const dadosTemporais = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) return [];

    // Agrupar por semana para análise temporal
    const semanas = movimentacoes.reduce((acc, mov) => {
      const data = new Date(mov.Data || '');
      if (isNaN(data.getTime())) return acc;

      // Calcular semana do ano
      const inicioAno = new Date(data.getFullYear(), 0, 1);
      const diasTranscorridos = Math.floor((data.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
      const semana = Math.ceil((diasTranscorridos + inicioAno.getDay() + 1) / 7);
      const chave = `${data.getFullYear()}-S${semana.toString().padStart(2, '0')}`;

      if (!acc[chave]) {
        acc[chave] = {
          periodo: chave,
          creditos: 0,
          debitos: 0,
          saldoOperacional: 0,
          acumulado: 0
        };
      }

      const credito = Number(mov.Credito) || 0;
      const debito = Number(mov.Debito) || 0;

      acc[chave].creditos += credito;
      acc[chave].debitos += debito;
      acc[chave].saldoOperacional += (credito - debito);

      return acc;
    }, {} as Record<string, FluxoTemporal>);

    // Converter para array e calcular acumulado
    const dadosOrdenados = Object.values(semanas)
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .slice(-12); // Últimas 12 semanas

    let acumulado = 0;
    return dadosOrdenados.map(item => {
      acumulado += item.saldoOperacional;
      return { ...item, acumulado };
    });
  }, [movimentacoes]);

  // 📊 Métricas resumo
  const metricas = useMemo(() => {
    if (dadosPorCategoria.length === 0) return null;

    const totalCreditos = dadosPorCategoria.reduce((sum, cat) => sum + cat.creditos, 0);
    const totalDebitos = dadosPorCategoria.reduce((sum, cat) => sum + cat.debitos, 0);
    const saldoLiquido = totalCreditos - totalDebitos;
    const principalCategoria = dadosPorCategoria[0];

    return {
      totalCreditos,
      totalDebitos,
      saldoLiquido,
      principalCategoria,
      numCategorias: dadosPorCategoria.length,
      eficiencia: totalDebitos > 0 ? (totalCreditos / totalDebitos) * 100 : 0
    };
  }, [dadosPorCategoria]);

  // 🎨 Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={DEFAULT_CHART_CONFIG.tooltipStyle}>
          <p className="font-semibold mb-2">{label}</p>
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
                {entry.name === 'Eficiência' 
                  ? `${entry.value.toFixed(1)}%`
                  : formatarMoeda(entry.value)
                }
              </span>
            </div>
          ))}
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

  if (error || dadosPorCategoria.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado de fluxo de caixa encontrado</p>
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
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <Title className="text-lg font-semibold">Fluxo de Caixa por Categoria</Title>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Análise detalhada: Créditos, Débitos e Saldo Operacional
              </Text>
            </div>
          </Flex>

          {/* Métricas resumo */}
          {metricas && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  <Text className="text-xs text-green-700 font-medium">Créditos</Text>
                </Flex>
                <Text className="text-lg font-bold text-green-800">
                  {formatarMoeda(metricas.totalCreditos)}
                </Text>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  <Text className="text-xs text-red-700 font-medium">Débitos</Text>
                </Flex>
                <Text className="text-lg font-bold text-red-800">
                  {formatarMoeda(metricas.totalDebitos)}
                </Text>
              </div>
              
              <div className={`p-3 rounded-lg ${
                metricas.saldoLiquido >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <Wallet className={`h-4 w-4 ${metricas.saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <Text className={`text-xs font-medium ${
                    metricas.saldoLiquido >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>Saldo Líquido</Text>
                </Flex>
                <Text className={`text-lg font-bold ${
                  metricas.saldoLiquido >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>
                  {formatarMoeda(metricas.saldoLiquido)}
                </Text>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <Text className="text-xs text-purple-700 font-medium">Eficiência</Text>
                </Flex>
                <Text className="text-lg font-bold text-purple-800">
                  {metricas.eficiencia.toFixed(1)}%
                </Text>
              </div>
            </div>
          )}
        </div>

        <Badge 
          icon={Activity}
          size="sm"
          className="bg-green-50 text-green-700 border-green-200"
        >
          {dadosPorCategoria.length} Categorias
        </Badge>
      </Flex>

      {/* Gráfico */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          {tipoVisualizacao === 'composed' ? (
            <ComposedChart
              data={showTrend ? dadosTemporais : dadosPorCategoria.slice(0, 8)}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                dataKey={showTrend ? "periodo" : "categoria"}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
                angle={-45}
                textAnchor="end"
                height={60}
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
                tickFormatter={(value) => formatarMoeda(value, true)}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle} />
              
              <Bar
                yAxisId="left"
                dataKey="creditos"
                fill={CASH_FLOW_PALETTE[0]}
                name="Créditos"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="debitos"
                fill={CASH_FLOW_PALETTE[1]}
                name="Débitos"
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={showTrend ? "acumulado" : "saldoOperacional"}
                stroke={CASH_FLOW_PALETTE[2]}
                strokeWidth={3}
                name={showTrend ? "Acumulado" : "Saldo Operacional"}
                dot={{ fill: CASH_FLOW_PALETTE[2], strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          ) : (
            <PieChart>
              <Pie
                data={dadosPorCategoria.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ categoria, percentual }) => 
                  percentual > 5 ? `${categoria} (${percentual.toFixed(1)}%)` : ''
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="saldoOperacional"
                onClick={(data) => onCategoryClick && onCategoryClick(data.categoria)}
              >
                {dadosPorCategoria.slice(0, 8).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cor}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Lista de categorias principais */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Text className="text-sm font-semibold mb-3">Principais Categorias:</Text>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {dadosPorCategoria.slice(0, 6).map((categoria, index) => (
            <div 
              key={categoria.categoria}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onCategoryClick && onCategoryClick(categoria.categoria)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: categoria.cor }}
                />
                <div>
                  <Text className="text-sm font-medium">{categoria.categoria}</Text>
                  <Text className="text-xs text-gray-500">
                    {categoria.transacoes} transações
                  </Text>
                </div>
              </div>
              <div className="text-right">
                <Text className={`text-sm font-semibold ${
                  categoria.saldoOperacional >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarMoeda(categoria.saldoOperacional)}
                </Text>
                <Text className="text-xs text-gray-500">
                  {categoria.percentual.toFixed(1)}%
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FluxoCaixaCategoriaChart;