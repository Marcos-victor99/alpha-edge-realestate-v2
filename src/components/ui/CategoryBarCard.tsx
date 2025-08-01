import { Card, Text, Flex, Badge, Color } from "@tremor/react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { safeToFixed, formatarPorcentagemSegura, validarDadoNumerico } from "@/lib/formatters";

// Interface para dados do CategoryBar - Melhorada com validação
interface CategoryBarData {
  label: string;
  value: number | undefined | null; // Permitir valores undefined/null para tratamento defensivo
  color?: Color;
}

interface CategoryBarCardProps {
  titulo: string;
  dados: CategoryBarData[] | undefined | null; // Permitir array undefined/null
  meta?: number | undefined | null;
  icone?: LucideIcon;
  cor?: Color;
  descricao?: string;
  loading?: boolean;
  className?: string;
  mostrarLabels?: boolean;
  mostrarMarker?: boolean;
  periodo?: string;
}

// Componente CategoryBar customizado (Tremor não está instalado, vou simular)
const CategoryBar = ({ 
  values, 
  colors = ["blue", "emerald", "rose"],
  marker,
  showLabels = true,
  className 
}: {
  values: (number | undefined | null)[];
  colors?: Color[];
  marker?: { value: number | undefined | null; tooltip?: string };
  showLabels?: boolean;
  className?: string;
}) => {
  // 🛡️ Validação defensiva de values
  const valuesSeguro = values.map(val => validarDadoNumerico(val));
  const totalValue = valuesSeguro.reduce((sum, val) => sum + val, 0);
  
  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="mb-2 flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{safeToFixed(totalValue, 0)}</span>
        </div>
      )}
      <div className="relative flex h-2 w-full items-center rounded-full bg-gray-200 dark:bg-gray-700">
        {valuesSeguro.map((value, index) => {
          const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
          const colorClass = colors[index] === 'emerald' ? 'bg-emerald-500' :
                            colors[index] === 'blue' ? 'bg-blue-500' :
                            colors[index] === 'red' ? 'bg-red-500' :
                            colors[index] === 'amber' ? 'bg-amber-500' :
                            'bg-gray-500';
          
          return (
            <div
              key={index}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", colorClass)}
              style={{ width: `${safeToFixed(percentage, 1)}%` }}
            />
          );
        })}
        
        {marker && validarDadoNumerico(marker.value) > 0 && (
          <div
            className="absolute top-0 h-4 w-1 -translate-x-1/2 rounded-full bg-gray-800 ring-2 ring-white dark:bg-gray-200 dark:ring-gray-800"
            style={{ left: `${safeToFixed(validarDadoNumerico(marker.value), 1)}%` }}
            title={marker.tooltip}
          />
        )}
      </div>
    </div>
  );
};

export function CategoryBarCard({
  titulo,
  dados,
  meta,
  icone: Icone,
  cor = 'blue',
  descricao,
  loading = false,
  className,
  mostrarLabels = true,
  mostrarMarker = false,
  periodo = "período atual"
}: CategoryBarCardProps) {
  // 🛡️ Validação defensiva de dados de entrada
  const dadosSeguro = dados || [];
  const metaSegura = validarDadoNumerico(meta);
  
  // Se não há dados válidos, mostrar estado vazio
  if (dadosSeguro.length === 0) {
    return (
      <Card className={cn("", className)}>
        <Flex alignItems="center" justifyContent="center" className="h-32">
          <Text className="text-gray-500">Nenhum dado disponível</Text>
        </Flex>
      </Card>
    );
  }
  
  const values = dadosSeguro.map(item => validarDadoNumerico(item?.value));
  const colors = dadosSeguro.map(item => item?.color || 'blue');
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  const progressPercentage = metaSegura > 0 ? Math.min((totalValue / metaSegura) * 100, 100) : 0;

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <Flex alignItems="start">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </Flex>
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
          
          {/* Valor Principal */}
          <div className="mb-3">
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {formatarPorcentagemSegura(totalValue, 1)}
            </Text>
            {metaSegura > 0 && (
              <Text className="text-xs text-gray-500 dark:text-gray-500">
                Meta: {formatarPorcentagemSegura(metaSegura, 1)}
              </Text>
            )}
          </div>
          
          {descricao && (
            <Text className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              {descricao}
            </Text>
          )}
          
          {/* CategoryBar */}
          <div className="mb-3">
            <CategoryBar
              values={values}
              colors={colors}
              marker={mostrarMarker && metaSegura > 0 ? { 
                value: (metaSegura / Math.max(totalValue, metaSegura)) * 100,
                tooltip: `Meta: ${formatarPorcentagemSegura(metaSegura, 1)}`
              } : undefined}
              showLabels={mostrarLabels}
              className="h-3"
            />
          </div>
          
          {/* Legenda */}
          <div className="space-y-1">
            {dadosSeguro.map((item, index) => (
              <Flex key={index} alignItems="center" justifyContent="between" className="text-xs">
                <Flex alignItems="center" className="gap-2">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item?.color === 'emerald' ? 'bg-emerald-500' :
                      item?.color === 'blue' ? 'bg-blue-500' :
                      item?.color === 'red' ? 'bg-red-500' :
                      item?.color === 'amber' ? 'bg-amber-500' :
                      'bg-gray-500'
                    )}
                  />
                  <Text className="text-gray-600 dark:text-gray-400">
                    {item?.label || 'N/A'}
                  </Text>
                </Flex>
                <Text className="font-medium text-gray-900 dark:text-gray-50">
                  {formatarPorcentagemSegura(item?.value, 1)}
                </Text>
              </Flex>
            ))}
          </div>
          
          {/* Badge de Status */}
          {metaSegura > 0 && (
            <div className="mt-3">
              <Badge 
                color={progressPercentage >= 100 ? 'emerald' : progressPercentage >= 75 ? 'amber' : 'red'}
                size="sm"
              >
                {progressPercentage >= 100 ? 'Meta Atingida' : 
                 progressPercentage >= 75 ? 'Próximo da Meta' : 'Abaixo da Meta'}
              </Badge>
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
}

// Variante compacta para dashboards mais densos
export function CompactCategoryBarCard({
  titulo,
  dados,
  meta,
  className
}: Pick<CategoryBarCardProps, 'titulo' | 'dados' | 'meta' | 'className'>) {
  // 🛡️ Validação defensiva para variante compacta
  const dadosSeguro = dados || [];
  const metaSegura = validarDadoNumerico(meta);
  
  // Se não há dados válidos, mostrar estado vazio compacto
  if (dadosSeguro.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <Flex alignItems="center" justifyContent="center" className="h-16">
          <Text className="text-gray-500 text-sm">Sem dados</Text>
        </Flex>
      </Card>
    );
  }
  
  const values = dadosSeguro.map(item => validarDadoNumerico(item?.value));
  const colors = dadosSeguro.map(item => item?.color || 'blue');
  const totalValue = values.reduce((sum, val) => sum + val, 0);

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-2">
        <Flex alignItems="center" justifyContent="between">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {titulo}
          </Text>
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
            {formatarPorcentagemSegura(totalValue, 1)}
          </Text>
        </Flex>
        
        <CategoryBar
          values={values}
          colors={colors}
          marker={metaSegura > 0 ? { 
            value: (metaSegura / Math.max(totalValue, metaSegura)) * 100,
            tooltip: `Meta: ${formatarPorcentagemSegura(metaSegura, 1)}`
          } : undefined}
          showLabels={false}
          className="h-2"
        />
        
        {metaSegura > 0 && (
          <Text className="text-xs text-gray-500 text-right">
            Meta: {formatarPorcentagemSegura(metaSegura, 1)}
          </Text>
        )}
      </div>
    </Card>
  );
}