import { Card, Metric, Text, Flex, BadgeDelta, AreaChart, Color } from "@tremor/react";
import { formatarMoeda, formatarMoedaCompacta, formatarVariacao } from "@/lib/formatters";
import { getVariationColor, cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  titulo: string;
  valor: number;
  variacao?: number;
  periodo?: string;
  icone?: LucideIcon;
  formato?: 'moeda' | 'moeda-compacta' | 'percentual' | 'numero';
  dados?: Array<{ data: string; valor: number }>;
  cor?: Color;
  descricao?: string;
  tendencia?: 'positiva' | 'negativa' | 'neutra';
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  titulo,
  valor,
  variacao,
  periodo = "vs mês anterior",
  icone: Icone,
  formato = 'moeda-compacta',
  dados,
  cor = 'blue',
  descricao,
  tendencia,
  loading = false,
  className
}: KpiCardProps) {
  // Formatação do valor principal
  const formatarValorPrincipal = (val: number) => {
    // Validação robusta para valores undefined, null, NaN ou não numéricos
    const valorSeguro = val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val);
    
    switch (formato) {
      case 'moeda':
        return formatarMoeda(valorSeguro);
      case 'moeda-compacta':
        return formatarMoedaCompacta(valorSeguro);
      case 'percentual':
        return `${valorSeguro.toFixed(1)}%`;
      case 'numero':
        return valorSeguro.toLocaleString('pt-BR');
      default:
        return formatarMoedaCompacta(valorSeguro);
    }
  };

  // Determinar tipo de variação
  const tipoVariacao = variacao === undefined ? 'neutro' : 
    variacao > 0 ? 'positivo' : 
    variacao < 0 ? 'negativo' : 'neutro';

  // Determinar cor da badge baseada na tendência ou variação
  const badgeColor = tendencia === 'positiva' || tipoVariacao === 'positivo' ? 'emerald' :
    tendencia === 'negativa' || tipoVariacao === 'negativo' ? 'red' : 'gray';

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <Flex alignItems="start">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            {descricao && <div className="h-3 bg-gray-200 rounded"></div>}
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </Flex>
        {dados && <div className="h-16 bg-gray-200 rounded mt-4"></div>}
      </Card>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200", className)}>
      <Flex alignItems="start" justifyContent="start">
        <div className="flex-1">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-2">
            {Icone && (
              <div className={`p-2 rounded-lg bg-${cor}-50 dark:bg-${cor}-950/20`}>
                <Icone className={`h-4 w-4 text-${cor}-600 dark:text-${cor}-400`} />
              </div>
            )}
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {titulo}
            </Text>
          </Flex>
          
          <Metric className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            {formatarValorPrincipal(valor)}
          </Metric>
          
          {descricao && (
            <Text className="text-xs text-gray-500 dark:text-gray-500 mb-2">
              {descricao}
            </Text>
          )}
          
          {variacao !== undefined && (
            <Flex alignItems="center" justifyContent="start" className="gap-1">
              <BadgeDelta 
                deltaType={tipoVariacao === 'positivo' ? 'increase' : 
                          tipoVariacao === 'negativo' ? 'decrease' : 'unchanged'}
                size="xs"
              >
                {formatarVariacao(Math.abs(variacao)).texto}
              </BadgeDelta>
              <Text className="text-xs text-gray-500 dark:text-gray-500">
                {periodo}
              </Text>
            </Flex>
          )}
        </div>
      </Flex>

      {dados && dados.length > 0 && (
        <div className="mt-4">
          <AreaChart
            data={dados}
            index="data"
            categories={["valor"]}
            colors={[cor]}
            showXAxis={false}
            showYAxis={false}
            showLegend={false}
            showTooltip={true}
            showGridLines={false}
            startEndOnly={true}
            className="h-16"
            valueFormatter={(value) => formatarValorPrincipal(value)}
          />
        </div>
      )}
    </Card>
  );
}

// Variante simplificada para métricas menores
export function MiniKpiCard({
  titulo,
  valor,
  icone: Icone,
  formato = 'numero',
  cor = 'blue',
  className
}: Pick<KpiCardProps, 'titulo' | 'valor' | 'icone' | 'formato' | 'cor' | 'className'>) {
  const formatarValor = (val: number) => {
    // Validação robusta para valores undefined, null, NaN ou não numéricos
    const valorSeguro = val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val);
    
    switch (formato) {
      case 'moeda':
        return formatarMoeda(valorSeguro);
      case 'moeda-compacta':
        return formatarMoedaCompacta(valorSeguro);
      case 'percentual':
        return `${valorSeguro.toFixed(1)}%`;
      case 'numero':
        return valorSeguro.toLocaleString('pt-BR');
      default:
        return valorSeguro.toString();
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <Flex alignItems="center" justifyContent="between">
        <div>
          <Text className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            {titulo}
          </Text>
          <Metric className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {formatarValor(valor)}
          </Metric>
        </div>
        {Icone && (
          <div className={`p-2 rounded-lg bg-${cor}-50 dark:bg-${cor}-950/20`}>
            <Icone className={`h-4 w-4 text-${cor}-600 dark:text-${cor}-400`} />
          </div>
        )}
      </Flex>
    </Card>
  );
}

// Card de KPI com comparação (atual vs anterior)
export function ComparativeKpiCard({
  titulo,
  valorAtual,
  valorAnterior,
  labelAtual = "Atual",
  labelAnterior = "Período Anterior",
  formato = 'moeda-compacta',
  icone: Icone,
  cor = 'blue',
  className
}: {
  titulo: string;
  valorAtual: number;
  valorAnterior: number;
  labelAtual?: string;
  labelAnterior?: string;
  formato?: KpiCardProps['formato'];
  icone?: LucideIcon;
  cor?: Color;
  className?: string;
}) {
  const formatarValor = (val: number) => {
    // Validação robusta para valores undefined, null, NaN ou não numéricos
    const valorSeguro = val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val);
    
    switch (formato) {
      case 'moeda':
        return formatarMoeda(valorSeguro);
      case 'moeda-compacta':
        return formatarMoedaCompacta(valorSeguro);
      case 'percentual':
        return `${valorSeguro.toFixed(1)}%`;
      case 'numero':
        return valorSeguro.toLocaleString('pt-BR');
      default:
        return formatarMoedaCompacta(valorSeguro);
    }
  };

  // Validações para cálculos matemáticos
  const valorAtualValido = valorAtual || 0;
  const valorAnteriorValido = valorAnterior || 0;
  
  const diferenca = valorAtualValido - valorAnteriorValido;
  const percentualMudanca = valorAnteriorValido !== 0 ? (diferenca / Math.abs(valorAnteriorValido)) * 100 : 0;
  const tipoMudanca = diferenca > 0 ? 'increase' : diferenca < 0 ? 'decrease' : 'unchanged';

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200", className)}>
      <Flex alignItems="start" justifyContent="start" className="mb-4">
        {Icone && (
          <div className={`p-2 rounded-lg bg-${cor}-50 dark:bg-${cor}-950/20 mr-3`}>
            <Icone className={`h-4 w-4 text-${cor}-600 dark:text-${cor}-400`} />
          </div>
        )}
        <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {titulo}
        </Text>
      </Flex>

      <div className="space-y-3">
        <div>
          <Text className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            {labelAtual}
          </Text>
          <Metric className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {formatarValor(valorAtual)}
          </Metric>
        </div>

        <div>
          <Text className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            {labelAnterior}
          </Text>
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatarValor(valorAnterior)}
          </Text>
        </div>

        <Flex alignItems="center" justifyContent="start" className="gap-2">
          <BadgeDelta deltaType={tipoMudanca} size="xs">
            {percentualMudanca > 0 ? '+' : ''}{(percentualMudanca || 0).toFixed(1)}%
          </BadgeDelta>
          <Text className="text-xs text-gray-500 dark:text-gray-500">
            Variação: {diferenca > 0 ? '+' : ''}{formatarValor(diferenca)}
          </Text>
        </Flex>
      </div>
    </Card>
  );
}