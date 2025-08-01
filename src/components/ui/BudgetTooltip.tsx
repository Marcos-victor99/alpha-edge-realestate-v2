import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatarMoeda, formatarVariacao } from '@/lib/formatters';

export interface BudgetTooltipData {
  periodo: string;
  previsto: number;
  realizado: number;
  meta?: number;
  categoria?: string;
  status?: 'acima_meta' | 'dentro_meta' | 'abaixo_meta';
  // Dados adicionais para contexto
  historico?: {
    meses_anteriores: number;
    tendencia: 'crescente' | 'decrescente' | 'estavel';
  };
  detalhes?: {
    principais_itens?: string[];
    observacoes?: string;
  };
}

export interface BudgetTooltipProps {
  data: BudgetTooltipData;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  variant?: 'default' | 'compact' | 'detailed';
  showTrend?: boolean;
  showStatus?: boolean;
  className?: string;
}

const getStatusConfig = (status?: string) => {
  switch (status) {
    case 'acima_meta':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Acima da Meta',
        description: 'Performance excelente'
      };
    case 'dentro_meta':
      return {
        icon: Target,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Dentro da Meta',
        description: 'Performance adequada'
      };
    case 'abaixo_meta':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'Abaixo da Meta',
        description: 'Necessita atenção'
      };
    default:
      return {
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: 'Sem Meta',
        description: 'Sem meta definida'
      };
  }
};

const getTrendIcon = (tendencia?: string) => {
  switch (tendencia) {
    case 'crescente':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'decrescente':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
  }
};

// Variante Compacta
const CompactTooltipContent: React.FC<{ data: BudgetTooltipData; showTrend: boolean }> = ({ 
  data, 
  showTrend 
}) => {
  const variacao = data.realizado - data.previsto;
  const variacaoPercentual = data.previsto > 0 ? (variacao / data.previsto) * 100 : 0;
  const statusConfig = getStatusConfig(data.status);

  return (
    <div className="p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{data.periodo}</span>
        {showTrend && data.historico && (
          <div className="flex items-center space-x-1">
            {getTrendIcon(data.historico.tendencia)}
          </div>
        )}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Previsto:</span>
          <span className="font-medium">{formatarMoeda(data.previsto)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Realizado:</span>
          <span className="font-medium">{formatarMoeda(data.realizado)}</span>
        </div>
        <hr className="my-1" />
        <div className="flex justify-between">
          <span className="text-gray-600">Variação:</span>
          <span className={cn("font-medium", variacao >= 0 ? "text-green-600" : "text-red-600")}>
            {variacao >= 0 ? '+' : ''}{formatarMoeda(variacao)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Variante Detalhada
const DetailedTooltipContent: React.FC<{ data: BudgetTooltipData; showTrend: boolean; showStatus: boolean }> = ({ 
  data, 
  showTrend, 
  showStatus 
}) => {
  const variacao = data.realizado - data.previsto;
  const variacaoPercentual = data.previsto > 0 ? (variacao / data.previsto) * 100 : 0;
  const eficiencia = data.previsto > 0 ? (data.realizado / data.previsto) * 100 : 0;
  const statusConfig = getStatusConfig(data.status);

  return (
    <div className="p-4 min-w-[280px] max-w-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{data.periodo}</span>
          </h4>
          {data.categoria && (
            <p className="text-xs text-gray-500 mt-1">{data.categoria}</p>
          )}
        </div>
        
        {showTrend && data.historico && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {getTrendIcon(data.historico.tendencia)}
            <span className="capitalize">{data.historico.tendencia}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {showStatus && data.status && (
        <div className={cn("flex items-center space-x-2 p-2 rounded-lg mb-3", statusConfig.bgColor)}>
          <statusConfig.icon className={cn("h-4 w-4", statusConfig.color)} />
          <div>
            <span className={cn("font-medium text-xs", statusConfig.color)}>
              {statusConfig.label}
            </span>
            <p className="text-xs text-gray-600 mt-0.5">{statusConfig.description}</p>
          </div>
        </div>
      )}

      {/* Valores Principais */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>Previsto:</span>
          </span>
          <span className="font-medium text-blue-600">{formatarMoeda(data.previsto)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>Realizado:</span>
          </span>
          <span className="font-medium text-green-600">{formatarMoeda(data.realizado)}</span>
        </div>

        {data.meta && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Meta Mínima:</span>
            <span className="font-medium text-amber-600">{formatarMoeda(data.meta)}</span>
          </div>
        )}
      </div>

      {/* Análise */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Variação:</span>
          <div className="text-right">
            <span className={cn("font-bold", variacao >= 0 ? "text-green-600" : "text-red-600")}>
              {variacao >= 0 ? '+' : ''}{formatarMoeda(variacao)}
            </span>
            <div className="text-xs text-gray-500">
              ({variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual.toFixed(1)}%)
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Eficiência:</span>
          <span className={cn("font-bold", 
            eficiencia >= 100 ? "text-green-600" : 
            eficiencia >= 90 ? "text-yellow-600" : "text-red-600"
          )}>
            {eficiencia.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Detalhes Adicionais */}
      {data.detalhes && (
        <div className="border-t pt-3 mt-3">
          {data.detalhes.principais_itens && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-700">Principais Itens:</span>
              <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                {data.detalhes.principais_itens.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.detalhes.observacoes && (
            <div className="text-xs text-gray-600 italic">
              "{data.detalhes.observacoes}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente Principal
export const BudgetTooltip: React.FC<BudgetTooltipProps> = ({
  data,
  children,
  side = 'top',
  variant = 'default',
  showTrend = true,
  showStatus = true,
  className
}) => {
  const renderContent = () => {
    switch (variant) {
      case 'compact':
        return <CompactTooltipContent data={data} showTrend={showTrend} />;
      case 'detailed':
        return <DetailedTooltipContent data={data} showTrend={showTrend} showStatus={showStatus} />;
      default:
        return <CompactTooltipContent data={data} showTrend={showTrend} />;
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className={cn("cursor-help", className)}>
          {children}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side={side}
          className={cn(
            "z-50 bg-white rounded-lg border border-gray-200 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          sideOffset={4}
        >
          {renderContent()}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

// Variantes de conveniência
export const CompactBudgetTooltip: React.FC<Omit<BudgetTooltipProps, 'variant'>> = (props) => (
  <BudgetTooltip {...props} variant="compact" />
);

export const DetailedBudgetTooltip: React.FC<Omit<BudgetTooltipProps, 'variant'>> = (props) => (
  <BudgetTooltip {...props} variant="detailed" />
);

export default BudgetTooltip;