import { Card, Text, Title, Flex } from "@tremor/react";
import { formatarMoeda, formatarMoedaCompacta, formatarData, formatarVariacao } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Interface para dados do tooltip financeiro
interface FinancialTooltipData {
  label: string;
  value: number;
  color?: string;
  format?: 'moeda' | 'moeda-compacta' | 'percentual' | 'numero';
  variation?: number;
  description?: string;
}

interface FinancialTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: any;
  }>;
  label?: string;
  type?: 'revenue' | 'expense' | 'performance' | 'occupancy' | 'default';
  className?: string;
}

export function FinancialTooltip({
  active,
  payload,
  label,
  type = 'default',
  className
}: FinancialTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Configurações específicas por tipo de tooltip
  const getTooltipConfig = (tooltipType: string) => {
    switch (tooltipType) {
      case 'revenue':
        return {
          title: 'Receita Financeira',
          format: 'moeda-compacta' as const,
          showVariation: true,
          contextText: 'Receita consolidada do período'
        };
      case 'expense':
        return {
          title: 'Despesas Operacionais',
          format: 'moeda-compacta' as const,
          showVariation: true,
          contextText: 'Custos e despesas do período'
        };
      case 'performance':
        return {
          title: 'Performance',
          format: 'percentual' as const,
          showVariation: true,
          contextText: 'Comparativo vs benchmark'
        };
      case 'occupancy':
        return {
          title: 'Taxa de Ocupação',
          format: 'percentual' as const,
          showVariation: false,
          contextText: 'Ocupação dos imóveis'
        };
      default:
        return {
          title: 'Dados Financeiros',
          format: 'numero' as const,
          showVariation: false,
          contextText: ''
        };
    }
  };

  const config = getTooltipConfig(type);

  // Função para formatar valores
  const formatValue = (value: number, format: 'moeda' | 'moeda-compacta' | 'percentual' | 'numero') => {
    switch (format) {
      case 'moeda':
        return formatarMoeda(value);
      case 'moeda-compacta':
        return formatarMoedaCompacta(value);
      case 'percentual':
        return `${value.toFixed(1)}%`;
      case 'numero':
        return value.toLocaleString('pt-BR');
      default:
        return value.toString();
    }
  };

  // Calcular totais e variações
  const totalValue = payload.reduce((sum, item) => sum + (item.value || 0), 0);
  const hasMultipleValues = payload.length > 1;

  return (
    <Card className={cn(
      "border shadow-lg max-w-sm p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
      className
    )}>
      {/* Header do Tooltip */}
      <div className="mb-2">
        <Title className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          {config.title}
        </Title>
        {label && (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Período: {label}
          </Text>
        )}
      </div>

      {/* Dados dos valores */}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <Flex key={index} alignItems="center" justifyContent="between" className="gap-3">
            <Flex alignItems="center" className="gap-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {item.name || item.dataKey}
              </Text>
            </Flex>
            <div className="text-right">
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-50">
                {formatValue(item.value, config.format)}
              </Text>
              {config.showVariation && item.payload.variacao && (
                <Text className={cn(
                  "text-xs",
                  item.payload.variacao > 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatarVariacao(item.payload.variacao).texto}
                </Text>
              )}
            </div>
          </Flex>
        ))}
      </div>

      {/* Total (se múltiplos valores) */}
      {hasMultipleValues && (
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <Flex alignItems="center" justifyContent="between">
            <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Total
            </Text>
            <Text className="text-xs font-bold text-gray-900 dark:text-gray-50">
              {formatValue(totalValue, config.format)}
            </Text>
          </Flex>
        </div>
      )}

      {/* Context Text */}
      {config.contextText && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {config.contextText}
        </Text>
      )}

      {/* Footer com timestamp */}
      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
        Atualizado: {formatarData(new Date().toISOString())}
      </Text>
    </Card>
  );
}

// Tooltip específico para inadimplência
export function InadimplenciaTooltip({
  active,
  payload,
  label,
  className
}: FinancialTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const inadimplenciaValue = data.value;
  const taxaInadimplencia = data.payload.taxa || 0;

  return (
    <Card className={cn(
      "border shadow-lg max-w-sm p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
      className
    )}>
      <div className="space-y-2">
        <div>
          <Title className="text-sm font-semibold text-red-600 dark:text-red-400">
            Inadimplência - {label}
          </Title>
        </div>

        <div className="space-y-1">
          <Flex alignItems="center" justifyContent="between">
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Valor em Atraso
            </Text>
            <Text className="text-xs font-bold text-red-600">
              {formatarMoedaCompacta(inadimplenciaValue)}
            </Text>
          </Flex>

          <Flex alignItems="center" justifyContent="between">
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Taxa de Inadimplência
            </Text>
            <Text className="text-xs font-bold text-red-600">
              {taxaInadimplencia.toFixed(1)}%
            </Text>
          </Flex>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-xs text-gray-500 dark:text-gray-400 italic">
            {inadimplenciaValue > 100000 
              ? "⚠️ Atenção: Valor crítico de inadimplência" 
              : "✅ Valor dentro do esperado"}
          </Text>
        </div>

        <Text className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Atualizado: {formatarData(new Date().toISOString())}
        </Text>
      </div>
    </Card>
  );
}

// Tooltip específico para NOI
export function NOITooltip({
  active,
  payload,
  label,
  className
}: FinancialTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const noiData = payload.find(p => p.dataKey === 'noi');
  const projecaoData = payload.find(p => p.dataKey === 'projecao');

  return (
    <Card className={cn(
      "border shadow-lg max-w-sm p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
      className
    )}>
      <div className="space-y-2">
        <div>
          <Title className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            NOI - Net Operating Income
          </Title>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </Text>
        </div>

        <div className="space-y-1.5">
          {noiData && (
            <Flex alignItems="center" justifyContent="between">
              <Flex alignItems="center" className="gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  NOI Atual
                </Text>
              </Flex>
              <Text className="text-xs font-bold text-blue-600">
                {formatarMoedaCompacta(noiData.value)}
              </Text>
            </Flex>
          )}

          {projecaoData && (
            <Flex alignItems="center" justifyContent="between">
              <Flex alignItems="center" className="gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Projeção
                </Text>
              </Flex>
              <Text className="text-xs font-bold text-gray-600">
                {formatarMoedaCompacta(projecaoData.value)}
              </Text>
            </Flex>
          )}
        </div>

        {noiData && projecaoData && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Flex alignItems="center" justifyContent="between">
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Variação vs Projeção
              </Text>
              <Text className={cn(
                "text-xs font-bold",
                noiData.value >= projecaoData.value ? "text-emerald-600" : "text-red-600"
              )}>
                {noiData.value >= projecaoData.value ? "+" : ""}{((noiData.value - projecaoData.value) / projecaoData.value * 100).toFixed(1)}%
              </Text>
            </Flex>
          </div>
        )}

        <Text className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
          NOI = Receita Operacional - Despesas Operacionais
        </Text>
      </div>
    </Card>
  );
}

// Hook para usar tooltips customizados com Tremor
export const useFinancialTooltip = (type: FinancialTooltipProps['type'] = 'default') => {
  return {
    content: (props: any) => <FinancialTooltip {...props} type={type} />,
    cursor: { stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '3 3' },
    contentStyle: { 
      background: 'transparent', 
      border: 'none',
      padding: 0
    },
    labelStyle: { display: 'none' }
  };
};