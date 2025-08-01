import React from 'react';
import { Card, Title, Text, Flex, Badge, ProgressBar } from '@tremor/react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  Eye,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Brain,
  Zap
} from 'lucide-react';
import { FinancialInsight } from '@/hooks/useFinancialInsights';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: FinancialInsight;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onInsightClick?: (insight: FinancialInsight) => void;
}

// Mapeamento de ícones por tipo de insight
const INSIGHT_TYPE_ICONS = {
  trend: TrendingUp,
  outlier: AlertTriangle,
  correlation: BarChart3,
  forecast: Target,
  anomaly: Eye
} as const;

// Mapeamento de cores por categoria
const CATEGORY_COLORS = {
  receita: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'emerald'
  },
  inadimplencia: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'rose'
  },
  despesas: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'amber'
  },
  fluxo_caixa: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'blue'
  },
  performance: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    text: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    badge: 'violet'
  }
} as const;

// Mapeamento de cores por prioridade
const PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  critical: 'rose'
} as const;

export function InsightCard({ 
  insight, 
  className, 
  variant = 'default',
  showActions = false,
  onInsightClick 
}: InsightCardProps) {
  const categoryStyle = CATEGORY_COLORS[insight.category] || CATEGORY_COLORS.performance;
  const TypeIcon = INSIGHT_TYPE_ICONS[insight.type] || Lightbulb;
  
  // Ícone para mudança direcional
  const ChangeIcon = insight.change?.direction === 'up' ? ArrowUpRight :
                     insight.change?.direction === 'down' ? ArrowDownRight : Minus;

  const handleCardClick = () => {
    if (onInsightClick) {
      onInsightClick(insight);
    }
  };

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          'p-4 border-l-4 hover:shadow-md transition-all duration-200',
          categoryStyle.border,
          onInsightClick && 'cursor-pointer',
          className
        )}
        onClick={handleCardClick}
      >
        <Flex alignItems="start" justifyContent="between" className="gap-3">
          <div className="flex-1">
            <Flex alignItems="center" justifyContent="start" className="gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', categoryStyle.bg)}>
                <TypeIcon className={cn('h-4 w-4', categoryStyle.text)} />
              </div>
              <Badge color={PRIORITY_COLORS[insight.priority]} size="sm">
                {insight.priority.toUpperCase()}
              </Badge>
            </Flex>
            
            <Title className="text-sm font-semibold mb-1 line-clamp-2">
              {insight.title}
            </Title>
            
            <Text className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {insight.description}
            </Text>
            
            {insight.formattedValue && (
              <Text className="text-sm font-semibold mt-2 text-gray-900 dark:text-gray-100">
                {insight.formattedValue}
              </Text>
            )}
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <Brain className="h-3 w-3 text-gray-400" />
              <Text className="text-xs text-gray-500">
                {Math.round(insight.confidence * 100)}%
              </Text>
            </div>
            
            {insight.change && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                insight.change.direction === 'up' && 'text-emerald-600',
                insight.change.direction === 'down' && 'text-rose-600',
                insight.change.direction === 'stable' && 'text-gray-600'
              )}>
                <ChangeIcon className="h-3 w-3" />
                <span>{insight.change.percentage.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </Flex>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card 
        className={cn(
          'p-6 border-l-4 hover:shadow-lg transition-all duration-200',
          categoryStyle.border,
          onInsightClick && 'cursor-pointer',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Header */}
        <Flex alignItems="start" justifyContent="between" className="mb-4">
          <div className="flex-1">
            <Flex alignItems="center" justifyContent="start" className="gap-3 mb-3">
              <div className={cn('p-2 rounded-lg', categoryStyle.bg)}>
                <TypeIcon className={cn('h-5 w-5', categoryStyle.text)} />
              </div>
              <div>
                <Badge color={PRIORITY_COLORS[insight.priority]} size="sm" className="mb-1">
                  {insight.priority.toUpperCase()}
                </Badge>
                <Badge color={categoryStyle.badge} size="sm" className="ml-2">
                  {insight.category.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </Flex>
            
            <Title className="text-lg font-semibold mb-2">
              {insight.title}
            </Title>
          </div>
          
          <div className="text-right">
            <Flex alignItems="center" justifyContent="end" className="gap-2 mb-2">
              <Brain className="h-4 w-4 text-gray-400" />
              <Text className="text-sm font-medium">
                Confiança: {Math.round(insight.confidence * 100)}%
              </Text>
            </Flex>
            
            <ProgressBar 
              value={insight.confidence * 100} 
              color={categoryStyle.badge}
              className="w-24"
            />
          </div>
        </Flex>

        {/* Content */}
        <div className="space-y-4">
          <Text className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {insight.description}
          </Text>

          {/* Metrics */}
          {(insight.formattedValue || insight.change) && (
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {insight.formattedValue && (
                <div>
                  <Text className="text-xs text-gray-500 mb-1">Valor</Text>
                  <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {insight.formattedValue}
                  </Text>
                </div>
              )}
              
              {insight.change && (
                <div>
                  <Text className="text-xs text-gray-500 mb-1">Mudança</Text>
                  <Flex alignItems="center" justifyContent="start" className="gap-1">
                    <ChangeIcon className={cn(
                      'h-4 w-4',
                      insight.change.direction === 'up' && 'text-emerald-600',
                      insight.change.direction === 'down' && 'text-rose-600',
                      insight.change.direction === 'stable' && 'text-gray-600'
                    )} />
                    <Text className={cn(
                      'font-semibold',
                      insight.change.direction === 'up' && 'text-emerald-600',
                      insight.change.direction === 'down' && 'text-rose-600',
                      insight.change.direction === 'stable' && 'text-gray-600'
                    )}>
                      {insight.change.percentage.toFixed(1)}%
                    </Text>
                    <Text className="text-xs text-gray-500 ml-1">
                      vs {insight.change.period}
                    </Text>
                  </Flex>
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          {insight.recommendation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Flex alignItems="start" justifyContent="start" className="gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <Text className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    RECOMENDAÇÃO
                  </Text>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    {insight.recommendation}
                  </Text>
                </div>
              </Flex>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <Flex alignItems="center" justifyContent="end" className="gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors">
                <Eye className="h-3 w-3" />
                Ver Detalhes
              </button>
              
              {insight.chartConfig && (
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors">
                  <BarChart3 className="h-3 w-3" />
                  Ver Gráfico
                </button>
              )}
            </Flex>
          )}
        </div>
      </Card>
    );
  }

  // Variant padrão
  return (
    <Card 
      className={cn(
        'p-5 border-l-4 hover:shadow-md transition-all duration-200',
        categoryStyle.border,
        onInsightClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <Flex alignItems="start" justifyContent="between" className="mb-3">
        <Flex alignItems="center" justifyContent="start" className="gap-2">
          <div className={cn('p-2 rounded-lg', categoryStyle.bg)}>
            <TypeIcon className={cn('h-4 w-4', categoryStyle.text)} />
          </div>
          <Badge color={PRIORITY_COLORS[insight.priority]} size="sm">
            {insight.priority.toUpperCase()}
          </Badge>
        </Flex>
        
        <div className="flex items-center gap-2">
          <Flex alignItems="center" justifyContent="end" className="gap-1">
            <Zap className="h-3 w-3 text-gray-400" />
            <Text className="text-xs text-gray-500">
              Score: {Math.round(insight.score * 100)}
            </Text>
          </Flex>
        </div>
      </Flex>

      {/* Content */}
      <div className="space-y-3">
        <Title className="text-base font-semibold line-clamp-2">
          {insight.title}
        </Title>
        
        <Text className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {insight.description}
        </Text>

        {/* Value and Change */}
        <Flex alignItems="center" justifyContent="between" className="pt-2">
          {insight.formattedValue && (
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {insight.formattedValue}
            </Text>
          )}
          
          {insight.change && (
            <Flex alignItems="center" justifyContent="end" className="gap-1">
              <ChangeIcon className={cn(
                'h-3 w-3',
                insight.change.direction === 'up' && 'text-emerald-600',
                insight.change.direction === 'down' && 'text-rose-600',
                insight.change.direction === 'stable' && 'text-gray-600'
              )} />
              <Text className={cn(
                'text-xs font-medium',
                insight.change.direction === 'up' && 'text-emerald-600',
                insight.change.direction === 'down' && 'text-rose-600',
                insight.change.direction === 'stable' && 'text-gray-600'
              )}>
                {insight.change.percentage.toFixed(1)}%
              </Text>
            </Flex>
          )}
        </Flex>
      </div>
    </Card>
  );
}

/**
 * Container para múltiplos insights
 */
interface InsightGridProps {
  insights: FinancialInsight[];
  variant?: 'default' | 'compact' | 'detailed';
  maxItems?: number;
  className?: string;
  onInsightClick?: (insight: FinancialInsight) => void;
}

export function InsightGrid({ 
  insights, 
  variant = 'default', 
  maxItems = 6,
  className,
  onInsightClick 
}: InsightGridProps) {
  const displayInsights = insights.slice(0, maxItems);

  if (displayInsights.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-12 w-12 text-gray-400" />
          <Title className="text-gray-600">Nenhum insight disponível</Title>
          <Text className="text-gray-500">
            Aguardando dados para gerar insights automáticos
          </Text>
        </div>
      </Card>
    );
  }

  const gridCols = variant === 'compact' ? 'grid-cols-1' : 
                   variant === 'detailed' ? 'grid-cols-1' : 
                   'grid-cols-1 lg:grid-cols-2';

  return (
    <div className={cn(`grid ${gridCols} gap-4`, className)}>
      {displayInsights.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          variant={variant}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

export default InsightCard;