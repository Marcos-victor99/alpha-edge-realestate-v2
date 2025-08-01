import { Card, Title, Text, Flex, Button } from "@tremor/react";
import { cn } from "@/lib/utils";
import { LucideIcon, Download, MoreHorizontal, Maximize2, RefreshCw, Settings, Copy, FileText, Calendar, Info } from "lucide-react";
import { ReactNode, useState, useRef, useEffect } from "react";

interface ChartCardProps {
  titulo: string;
  subtitulo?: string;
  icone?: LucideIcon;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  erro?: string | null;
  onExport?: () => void;
  onFullscreen?: () => void;
  onRefresh?: () => void;
  onCopy?: () => void;
  onSettings?: () => void;
  onInfo?: () => void;
  onChangePeriod?: () => void;
  showActions?: boolean;
  periodo?: string;
  fonte?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg';
  extraActions?: Array<{
    key: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
  }>;
}

const alturaClasses = {
  sm: 'h-64',
  md: 'h-80', 
  lg: 'h-96',
  xl: 'h-[32rem]'
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export function ChartCard({
  titulo,
  subtitulo,
  icone: Icone,
  children,
  className,
  loading = false,
  erro = null,
  onExport,
  onFullscreen,
  onRefresh,
  onCopy,
  onSettings,
  onInfo,
  onChangePeriod,
  showActions = true,
  periodo,
  fonte,
  altura = 'md',
  padding = 'md',
  extraActions = []
}: ChartCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Construir ações do dropdown
  const dropdownActions = [
    ...(onRefresh ? [{
      key: 'refresh',
      label: 'Atualizar dados',
      icon: RefreshCw,
      onClick: onRefresh
    }] : []),
    ...(onCopy ? [{
      key: 'copy',
      label: 'Copiar gráfico',
      icon: Copy,
      onClick: onCopy
    }] : []),
    ...(onChangePeriod ? [{
      key: 'period',
      label: 'Alterar período',
      icon: Calendar,
      onClick: onChangePeriod
    }] : []),
    ...(onSettings ? [{
      key: 'settings',
      label: 'Configurações',
      icon: Settings,
      onClick: onSettings
    }] : []),
    ...(onInfo ? [{
      key: 'info',
      label: 'Informações',
      icon: Info,
      onClick: onInfo
    }] : []),
    ...extraActions
  ];

  if (loading) {
    return (
      <Card className={cn("animate-pulse", paddingClasses[padding], className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            {subtitulo && <div className="h-4 bg-gray-200 rounded w-48"></div>}
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className={cn("bg-gray-200 rounded", alturaClasses[altura])}></div>
        {fonte && <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>}
      </Card>
    );
  }

  if (erro) {
    return (
      <Card className={cn(paddingClasses[padding], className)}>
        <Flex alignItems="center" justifyContent="between" className="mb-4">
          <div>
            <Title className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {titulo}
            </Title>
            {subtitulo && (
              <Text className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {subtitulo}
              </Text>
            )}
          </div>
        </Flex>
        
        <div className={cn(
          "flex items-center justify-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg",
          alturaClasses[altura]
        )}>
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <Text className="text-red-700 dark:text-red-400 font-medium">
              Erro ao carregar dados
            </Text>
            <Text className="text-red-600 dark:text-red-500 text-sm mt-1">
              {erro}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-lg",
        paddingClasses[padding],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <Flex alignItems="start" justifyContent="between" className="mb-4">
        <div className="flex-1">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
            {Icone && (
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Icone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <Title className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {titulo}
            </Title>
          </Flex>
          
          {subtitulo && (
            <Text className="text-sm text-gray-500 dark:text-gray-500">
              {subtitulo}
            </Text>
          )}
          
          {periodo && (
            <Text className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Período: {periodo}
            </Text>
          )}
        </div>

        {/* Actions */}
        {showActions && (isHovered || onExport || onFullscreen || dropdownActions.length > 0) && (
          <Flex alignItems="center" justifyContent="end" className="gap-1">
            {onExport && (
              <Button
                size="xs"
                variant="secondary"
                onClick={onExport}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Exportar dados"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            {onFullscreen && (
              <Button
                size="xs"
                variant="secondary"
                onClick={onFullscreen}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Expandir gráfico"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
            
            {/* Dropdown Menu */}
            {dropdownActions.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={cn(
                    "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    showDropdown && "bg-gray-100 dark:bg-gray-700"
                  )}
                  title="Mais opções"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
                
                {/* Dropdown Content */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                    {dropdownActions.map((action, index) => {
                      const IconComponent = action.icon;
                      return (
                        <button
                          key={action.key}
                          onClick={() => {
                            if (!action.disabled) {
                              action.onClick();
                              setShowDropdown(false);
                            }
                          }}
                          disabled={action.disabled}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                            action.disabled 
                              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                            index === 0 && "rounded-t-lg",
                            index === dropdownActions.length - 1 && "rounded-b-lg"
                          )}
                        >
                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Flex>
        )}
      </Flex>

      {/* Chart Content */}
      <div className={alturaClasses[altura]}>
        {children}
      </div>

      {/* Footer */}
      {fonte && (
        <Text className="text-xs text-gray-400 dark:text-gray-600 mt-3">
          Fonte: {fonte}
        </Text>
      )}
    </Card>
  );
}

// Card especializado para gráficos de comparação
export function ComparisonChartCard({
  titulo,
  subtitulo,
  valorAtual,
  valorAnterior,
  labelAtual = "Atual",
  labelAnterior = "Anterior",
  children,
  className,
  ...props
}: Omit<ChartCardProps, 'titulo' | 'subtitulo'> & {
  titulo: string;
  subtitulo?: string;
  valorAtual: string;
  valorAnterior: string;
  labelAtual?: string;
  labelAnterior?: string;
}) {
  return (
    <ChartCard
      titulo={titulo}
      subtitulo={subtitulo}
      className={className}
      {...props}
    >
      {/* Header com valores comparativos */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Flex alignItems="center" justifyContent="between">
          <div className="text-center">
            <Text className="text-xs text-gray-500 dark:text-gray-500 mb-1">
              {labelAtual}
            </Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {valorAtual}
            </Text>
          </div>
          
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
          
          <div className="text-center">
            <Text className="text-xs text-gray-500 dark:text-gray-500 mb-1">
              {labelAnterior}
            </Text>
            <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {valorAnterior}
            </Text>
          </div>
        </Flex>
      </div>

      {/* Chart content */}
      <div className="flex-1">
        {children}
      </div>
    </ChartCard>
  );
}

// Card para métricas rápidas (sem gráfico)
export function MetricCard({
  titulo,
  valor,
  variacao,
  icone: Icone,
  cor = 'blue',
  formato = 'numero',
  descricao,
  className
}: {
  titulo: string;
  valor: number | string;
  variacao?: number;
  icone?: LucideIcon;
  cor?: 'blue' | 'emerald' | 'red' | 'yellow' | 'purple';
  formato?: 'numero' | 'moeda' | 'percentual';
  descricao?: string;
  className?: string;
}) {
  const formatarValor = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (val === undefined || val === null || isNaN(val)) {
      return formato === 'percentual' ? '0.0%' : formato === 'moeda' ? 'R$ 0,00' : '0';
    }
    
    switch (formato) {
      case 'moeda':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      case 'percentual':
        return `${val.toFixed(1)}%`;
      case 'numero':
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <Flex alignItems="center" justifyContent="between">
        <div className="flex-1">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {titulo}
          </Text>
          
          <Title className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            {formatarValor(valor)}
          </Title>
          
          {descricao && (
            <Text className="text-xs text-gray-500 dark:text-gray-500">
              {descricao}
            </Text>
          )}
          
          {variacao !== undefined && (
            <Flex alignItems="center" justifyContent="start" className="gap-1 mt-2">
              <span className={cn(
                "text-xs font-medium",
                variacao > 0 ? "text-emerald-600" : 
                variacao < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
              </span>
              <Text className="text-xs text-gray-500 dark:text-gray-500">
                vs período anterior
              </Text>
            </Flex>
          )}
        </div>

        {Icone && (
          <div className={cn(
            "p-3 rounded-lg",
            {
              'bg-blue-50 dark:bg-blue-950/20': cor === 'blue',
              'bg-emerald-50 dark:bg-emerald-950/20': cor === 'emerald',
              'bg-red-50 dark:bg-red-950/20': cor === 'red',
              'bg-yellow-50 dark:bg-yellow-950/20': cor === 'yellow',
              'bg-purple-50 dark:bg-purple-950/20': cor === 'purple',
            }
          )}>
            <Icone className={cn(
              "h-6 w-6",
              {
                'text-blue-600 dark:text-blue-400': cor === 'blue',
                'text-emerald-600 dark:text-emerald-400': cor === 'emerald',
                'text-red-600 dark:text-red-400': cor === 'red',
                'text-yellow-600 dark:text-yellow-400': cor === 'yellow',
                'text-purple-600 dark:text-purple-400': cor === 'purple',
              }
            )} />
          </div>
        )}
      </Flex>
    </Card>
  );
}