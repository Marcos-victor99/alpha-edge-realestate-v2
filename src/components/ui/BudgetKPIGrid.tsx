import React, { useMemo } from 'react';
import { Card, Title, Text, Metric, Flex, Badge } from '@tremor/react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Percent,
  Zap
} from 'lucide-react';
import { analyzeVariance, VarianceDataPoint, VarianceAnalysisResult } from '@/lib/variance-analysis';
import { formatarMoeda, formatarMoedaCompacta } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export interface BudgetKPIGridProps {
  data: VarianceDataPoint[];
  periodo?: string;
  showInsights?: boolean;
  compactMode?: boolean;
  className?: string;
}

interface KPICardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icone: React.ElementType;
  cor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  tendencia?: 'positiva' | 'negativa' | 'neutra';
  valorTendencia?: string;
  tooltip?: string;
  compact?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  titulo,
  valor,
  subtitulo,
  icone: Icon,
  cor,
  tendencia,
  valorTendencia,
  tooltip,
  compact = false
}) => {
  const getCorConfig = (cor: string) => {
    const configs = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    };
    return configs[cor as keyof typeof configs] || configs.gray;
  };

  const getTendenciaIcon = () => {
    switch (tendencia) {
      case 'positiva':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'negativa':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const corConfig = getCorConfig(cor);

  if (compact) {
    return (
      <div className="p-3 bg-white rounded-lg border border-gray-200">
        <Flex alignItems="center" justifyContent="between" className="mb-2">
          <div className={cn("p-1.5 rounded-md", corConfig.bg)}>
            <Icon className={cn("h-3 w-3", corConfig.text)} />
          </div>
          {getTendenciaIcon()}
        </Flex>
        <div>
          <Metric className="text-lg font-bold text-gray-900">{valor}</Metric>
          <Text className="text-xs text-gray-600 mt-0.5">{titulo}</Text>
          {valorTendencia && (
            <Text className="text-xs text-gray-500">{valorTendencia}</Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Flex alignItems="center" justifyContent="between" className="mb-3">
        <div className={cn("p-2 rounded-lg", corConfig.bg)}>
          <Icon className={cn("h-5 w-5", corConfig.text)} />
        </div>
        {getTendenciaIcon()}
      </Flex>
      
      <div className="space-y-1">
        <Metric className="text-2xl font-bold text-gray-900">{valor}</Metric>
        <Text className="text-sm font-medium text-gray-700">{titulo}</Text>
        {subtitulo && (
          <Text className="text-xs text-gray-500">{subtitulo}</Text>
        )}
        {valorTendencia && (
          <Text className="text-xs text-gray-600 flex items-center space-x-1">
            <span>{valorTendencia}</span>
          </Text>
        )}
      </div>
    </Card>
  );
};

export const BudgetKPIGrid: React.FC<BudgetKPIGridProps> = ({
  data,
  periodo = "Últimos 6 meses",
  showInsights = true,
  compactMode = false,
  className
}) => {
  // Análise automática dos dados
  const analysis: VarianceAnalysisResult | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    try {
      return analyzeVariance(data);
    } catch (error) {
      console.error('Erro na análise de variância:', error);
      return null;
    }
  }, [data]);

  if (!analysis) {
    return (
      <div className={cn("p-6", className)}>
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <Text className="text-lg text-gray-600">
            Dados insuficientes para análise de KPIs orçamentários
          </Text>
        </Card>
      </div>
    );
  }

  // Preparar KPIs baseados na análise
  const kpis = [
    {
      titulo: 'Eficiência Média',
      valor: `${analysis.eficienciaMedia.toFixed(1)}%`,
      subtitulo: 'Execução vs Orçado',
      icone: Target,
      cor: analysis.eficienciaMedia >= 95 ? 'green' : analysis.eficienciaMedia >= 85 ? 'yellow' : 'red',
      tendencia: analysis.tendencia === 'crescente' ? 'positiva' : 
                 analysis.tendencia === 'decrescente' ? 'negativa' : 'neutra',
      valorTendencia: `Tendência ${analysis.tendencia}`
    },
    {
      titulo: 'Variação Total',
      valor: formatarMoedaCompacta(Math.abs(analysis.variacaoAbsoluta)),
      subtitulo: analysis.variacaoAbsoluta >= 0 ? 'Acima do Orçado' : 'Abaixo do Orçado',
      icone: analysis.variacaoAbsoluta >= 0 ? TrendingUp : TrendingDown,
      cor: analysis.variacaoAbsoluta >= 0 ? 'green' : 'red',
      tendencia: analysis.variacaoAbsoluta >= 0 ? 'positiva' : 'negativa',
      valorTendencia: `${analysis.variacaoPercentual >= 0 ? '+' : ''}${analysis.variacaoPercentual.toFixed(1)}%`
    },
    {
      titulo: 'Consistência',
      valor: `${Math.max(0, 100 - analysis.coeficienteVariacao).toFixed(0)}%`,
      subtitulo: 'Previsibilidade da Execução',
      icone: Activity,
      cor: analysis.coeficienteVariacao < 15 ? 'green' : 
           analysis.coeficienteVariacao < 30 ? 'yellow' : 'red',
      tendencia: 'neutra',
      valorTendencia: `CV: ${analysis.coeficienteVariacao.toFixed(1)}%`
    },
    {
      titulo: 'Performance Range',
      valor: `${analysis.eficienciaMinima.toFixed(0)}% - ${analysis.eficienciaMaxima.toFixed(0)}%`,
      subtitulo: 'Min - Max Execução',
      icone: BarChart3,
      cor: 'blue',
      tendencia: 'neutra',
      valorTendencia: `Amplitude: ${(analysis.eficienciaMaxima - analysis.eficienciaMinima).toFixed(0)}%`
    },
    {
      titulo: 'Total Executado',
      valor: formatarMoedaCompacta(analysis.totalRealizado),
      subtitulo: 'Valor Total Realizado',
      icone: DollarSign,
      cor: 'purple',
      tendencia: 'neutra',
      valorTendencia: `de ${formatarMoedaCompacta(analysis.totalPrevisto)} orçado`
    },
    {
      titulo: 'Confiança Projeção',
      valor: `${(analysis.confiancaProjecao * 100).toFixed(0)}%`,
      subtitulo: 'Para Próximo Período',
      icone: Zap,
      cor: analysis.confiancaProjecao > 0.7 ? 'green' : 
           analysis.confiancaProjecao > 0.5 ? 'yellow' : 'red',
      tendencia: 'neutra',
      valorTendencia: formatarMoedaCompacta(analysis.projecaoProximoPeriodo)
    }
  ];

  // KPIs adicionais para períodos críticos
  const kpisExtras = [
    {
      titulo: 'Períodos Críticos',
      valor: analysis.periodosProblematicos.length.toString(),
      subtitulo: 'Abaixo de 90% do Orçado',
      icone: AlertTriangle,
      cor: analysis.periodosProblematicos.length === 0 ? 'green' : 
           analysis.periodosProblematicos.length <= 2 ? 'yellow' : 'red',
      tendencia: 'neutra' as const
    },
    {
      titulo: 'Períodos Excelentes',
      valor: analysis.periodosMelhores.length.toString(),
      subtitulo: 'Acima de 110% do Orçado',
      icone: CheckCircle2,
      cor: 'green' as const,
      tendencia: 'positiva' as const
    }
  ];

  const todosKPIs = compactMode ? kpis.slice(0, 4) : [...kpis, ...kpisExtras];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title className="text-xl font-semibold">KPIs Orçamentários</Title>
          <Text className="text-gray-600">{periodo} • Análise Automatizada</Text>
        </div>
        <Badge 
          color={analysis.eficienciaMedia >= 95 ? 'green' : 
                 analysis.eficienciaMedia >= 85 ? 'yellow' : 'red'}
          size="sm"
        >
          {analysis.eficienciaMedia >= 95 ? 'Excelente' : 
           analysis.eficienciaMedia >= 85 ? 'Bom' : 'Necessita Atenção'}
        </Badge>
      </div>

      {/* Grid de KPIs */}
      <div className={cn(
        "grid gap-3",
        compactMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {todosKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            titulo={kpi.titulo}
            valor={kpi.valor}
            subtitulo={kpi.subtitulo}
            icone={kpi.icone}
            cor={kpi.cor}
            tendencia={kpi.tendencia}
            valorTendencia={kpi.valorTendencia}
            compact={compactMode}
          />
        ))}
      </div>

      {/* Insights Automáticos */}
      {showInsights && analysis.insights.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="h-4 w-4 text-blue-500" />
            <Text className="font-medium text-gray-800">Insights Automáticos</Text>
          </div>
          
          <div className="space-y-2">
            {analysis.insights.slice(0, 3).map((insight, index) => {
              const getInsightIcon = () => {
                switch (insight.tipo) {
                  case 'positivo':
                    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                  case 'negativo':
                    return <AlertTriangle className="h-4 w-4 text-red-500" />;
                  case 'alerta':
                    return <Clock className="h-4 w-4 text-yellow-500" />;
                  default:
                    return <Activity className="h-4 w-4 text-blue-500" />;
                }
              };

              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start space-x-3 p-2 rounded-lg",
                    insight.prioridade === 'alta' ? 'bg-red-50 border-l-4 border-red-400' :
                    insight.prioridade === 'media' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                    'bg-blue-50 border-l-4 border-blue-400'
                  )}
                >
                  {getInsightIcon()}
                  <div className="flex-1 min-w-0">
                    <Text className="font-medium text-gray-900 text-sm">
                      {insight.titulo}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-0.5">
                      {insight.descricao}
                    </Text>
                    {insight.recomendacao && (
                      <Text className="text-xs text-gray-500 mt-1 italic">
                        💡 {insight.recomendacao}
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}

            {analysis.insights.length > 3 && (
              <Text className="text-xs text-gray-500 text-center mt-2">
                +{analysis.insights.length - 3} insights adicionais disponíveis
              </Text>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// Variante compacta para uso em cards menores
export const CompactBudgetKPIGrid: React.FC<BudgetKPIGridProps> = (props) => (
  <BudgetKPIGrid {...props} compactMode={true} showInsights={false} />
);

export default BudgetKPIGrid;