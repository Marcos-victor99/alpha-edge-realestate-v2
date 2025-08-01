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
  ResponsiveContainer
} from 'recharts';
import { Card, Title, Text, Flex, Badge, Metric } from '@tremor/react';
import { 
  TrendingUp, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Calculator
} from 'lucide-react';
import { usePagamentoEmpreendedor } from '@/hooks/useFinancialData';
import { useOrcamentoData } from '@/hooks/useOrcamentoData';
import { SOFT_COLORS, DEFAULT_CHART_CONFIG, SIMPLE_FINANCIAL_PALETTE } from '@/lib/chart-colors';
import { formatarMoeda, formatarMoedaCompacta, formatarVariacao } from '@/lib/formatters';

interface PrevistoRealizadoChartProps {
  periodo?: string;
  categoria?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  showVariance?: boolean;
  showTrend?: boolean;
  onPeriodClick?: (periodo: string) => void;
}

interface PrevistoRealizadoData {
  periodo: string;
  previsto: number;
  realizado: number;
  variacao: number;
  variacao_percentual: number;
  status: 'positivo' | 'negativo' | 'neutro';
  meta: number;
}

interface ResumoAnalise {
  totalPrevisto: number;
  totalRealizado: number;
  variacaoTotal: number;
  variacaoPercentual: number;
  eficienciaExecucao: number;
  periodosMeta: number;
  totalPeriodos: number;
}

const PrevistoRealizadoChart: React.FC<PrevistoRealizadoChartProps> = ({
  periodo = '6m',
  categoria,
  altura = 'lg',
  showVariance = true,
  showTrend = true,
  onPeriodClick
}) => {
  // Hooks para dados Supabase
  const { data: pagamentosData, isLoading: pagamentosLoading } = usePagamentoEmpreendedor();
  const { data: orcamentoData, isLoading: orcamentoLoading } = useOrcamentoData();

  const isLoading = pagamentosLoading || orcamentoLoading;

  // Processamento dos dados para análise Previsto vs Realizado
  const { dadosProcessados, resumoAnalise } = useMemo(() => {
    if (!pagamentosData || !orcamentoData) {
      return { dadosProcessados: [], resumoAnalise: null };
    }

    // Simular dados orçamentários por período (normalmente viriam de uma tabela de orçamento)
    const orcamentoPorPeriodo = {
      '2025-01': 85000,
      '2025-02': 92000,
      '2025-03': 88000,
      '2025-04': 95000,
      '2025-05': 90000,
      '2025-06': 87000
    };

    // Agrupar pagamentos realizados por período
    const realizadoPorPeriodo: Record<string, number> = {};
    
    pagamentosData.forEach(pagamento => {
      if (pagamento.data_pagamento) {
        const periodo = new Date(pagamento.data_pagamento).toISOString().slice(0, 7);
        realizadoPorPeriodo[periodo] = (realizadoPorPeriodo[periodo] || 0) + (pagamento.valor_titulo || 0);
      }
    });

    // Criar dados processados para o gráfico
    const dadosProcessados: PrevistoRealizadoData[] = Object.entries(orcamentoPorPeriodo).map(([periodo, previsto]) => {
      const realizado = realizadoPorPeriodo[periodo] || 0;
      const variacao = realizado - previsto;
      const variacao_percentual = previsto > 0 ? (variacao / previsto) * 100 : 0;
      
      return {
        periodo: new Date(periodo + '-01').toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }),
        previsto,
        realizado,
        variacao,
        variacao_percentual,
        status: variacao >= 0 ? 'positivo' : 'negativo',
        meta: previsto * 0.95 // Meta de 95% do orçado
      };
    });

    // Calcular resumo da análise
    const totalPrevisto = dadosProcessados.reduce((acc, item) => acc + item.previsto, 0);
    const totalRealizado = dadosProcessados.reduce((acc, item) => acc + item.realizado, 0);
    const variacaoTotal = totalRealizado - totalPrevisto;
    const variacaoPercentual = totalPrevisto > 0 ? (variacaoTotal / totalPrevisto) * 100 : 0;
    const eficienciaExecucao = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;
    const periodosMeta = dadosProcessados.filter(item => item.realizado >= item.meta).length;

    const resumoAnalise: ResumoAnalise = {
      totalPrevisto,
      totalRealizado,
      variacaoTotal,
      variacaoPercentual,
      eficienciaExecucao,
      periodosMeta,
      totalPeriodos: dadosProcessados.length
    };

    return { dadosProcessados, resumoAnalise };
  }, [pagamentosData, orcamentoData, periodo, categoria]);

  // Custom Tooltip para comparação detalhada
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
              Previsto: <span className="font-medium">{formatarMoeda(data.previsto)}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
              Realizado: <span className="font-medium">{formatarMoeda(data.realizado)}</span>
            </p>
            <hr className="my-2" />
            <p className={`text-sm font-medium ${data.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Variação: {formatarMoeda(data.variacao)} 
              ({data.variacao_percentual > 0 ? '+' : ''}{data.variacao_percentual.toFixed(1)}%)
            </p>
            <p className="text-xs text-gray-500">
              Meta: {formatarMoeda(data.meta)}
            </p>
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
      <Card className={`p-6 ${alturaMap[altura]}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="flex-1 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!resumoAnalise || dadosProcessados.length === 0) {
    return (
      <Card className="p-6">
        <Flex alignItems="center" className="space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <Text>Dados insuficientes para análise Previsto vs Realizado</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header com Métricas Resumo */}
      <Flex justifyContent="between" alignItems="start" className="mb-6">
        <div>
          <Flex alignItems="center" className="space-x-2 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <Title className="text-xl">Análise Previsto vs Realizado</Title>
          </Flex>
          <Text className="text-gray-600">
            Comparação entre valores orçados e executados por período
          </Text>
        </div>
        
        <div className="text-right space-y-1">
          <Flex alignItems="center" className="space-x-2">
            <Badge 
              color={resumoAnalise.eficienciaExecucao >= 95 ? 'green' : 
                     resumoAnalise.eficienciaExecucao >= 85 ? 'yellow' : 'red'}
              size="sm"
            >
              {resumoAnalise.eficienciaExecucao.toFixed(1)}% Eficiência
            </Badge>
          </Flex>
          <Text className="text-xs text-gray-500">
            {resumoAnalise.periodosMeta}/{resumoAnalise.totalPeriodos} períodos na meta
          </Text>
        </div>
      </Flex>

      {/* KPIs Simplificados - Apenas 3 métricas essenciais */}
      {showVariance && (
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <Metric className="text-2xl font-bold text-gray-800">
              {formatarMoedaCompacta(resumoAnalise.totalRealizado)}
            </Metric>
            <Text className="text-sm text-gray-600">Executado</Text>
            <Text className="text-xs text-gray-400">
              de {formatarMoedaCompacta(resumoAnalise.totalPrevisto)}
            </Text>
          </div>
          <div className="text-center">
            <Metric className={`text-2xl font-bold ${resumoAnalise.variacaoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {resumoAnalise.variacaoPercentual >= 0 ? '+' : ''}{resumoAnalise.variacaoPercentual.toFixed(1)}%
            </Metric>
            <Text className="text-sm text-gray-600">Variação</Text>
            <Text className="text-xs text-gray-400">vs orçado</Text>
          </div>
          <div className="text-center">
            <Metric className="text-2xl font-bold text-blue-600">
              {resumoAnalise.eficienciaExecucao.toFixed(0)}%
            </Metric>
            <Text className="text-sm text-gray-600">Eficiência</Text>
            <Text className="text-xs text-gray-400">
              {resumoAnalise.periodosMeta}/{resumoAnalise.totalPeriodos} períodos
            </Text>
          </div>
        </div>
      )}

      {/* Gráfico Principal */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dadosProcessados}
            margin={DEFAULT_CHART_CONFIG.margin}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={DEFAULT_CHART_CONFIG.gridStroke} />
            <XAxis 
              dataKey="periodo" 
              stroke={DEFAULT_CHART_CONFIG.axisStroke}
              fontSize={DEFAULT_CHART_CONFIG.fontSize}
            />
            <YAxis 
              stroke={DEFAULT_CHART_CONFIG.axisStroke}
              fontSize={DEFAULT_CHART_CONFIG.fontSize}
              tickFormatter={(value) => formatarMoedaCompacta(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Barras Simplificadas para Previsto e Realizado - Apenas 2 cores principais */}
            <Bar 
              dataKey="previsto" 
              name="Previsto"
              fill={SIMPLE_FINANCIAL_PALETTE[2]} // Azul neutro
              opacity={0.7}
              onClick={(data) => onPeriodClick?.(data.periodo)}
              className="cursor-pointer"
              radius={[2, 2, 0, 0]} // Bordas arredondadas no topo
            />
            <Bar 
              dataKey="realizado" 
              name="Realizado"
              fill={SIMPLE_FINANCIAL_PALETTE[0]} // Verde para execução
              opacity={0.9}
              onClick={(data) => onPeriodClick?.(data.periodo)}
              className="cursor-pointer"
              radius={[2, 2, 0, 0]} // Bordas arredondadas no topo
            />
            
            {/* Linha de Meta Simplificada */}
            {showTrend && (
              <Line 
                type="monotone" 
                dataKey="meta" 
                name="Meta"
                stroke={SIMPLE_FINANCIAL_PALETTE[1]} // Vermelho para alertas
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false} // Remover pontos para layout mais limpo
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Simplificado - Apenas o essencial */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <Flex alignItems="center" justifyContent="between">
          <div className="flex items-center space-x-2">
            {resumoAnalise.eficienciaExecucao >= 95 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : resumoAnalise.eficienciaExecucao >= 85 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <Text className="text-sm font-medium text-gray-800">
              {resumoAnalise.eficienciaExecucao >= 95 ? 'Performance Excelente' : 
               resumoAnalise.eficienciaExecucao >= 85 ? 'Performance Adequada' : 'Necessita Atenção'}
            </Text>
          </div>
          <Text className="text-xs text-gray-500">
            {resumoAnalise.periodosMeta}/{resumoAnalise.totalPeriodos} períodos na meta
          </Text>
        </Flex>
      </div>
    </Card>
  );
};

export default PrevistoRealizadoChart;