import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Title, Subtitle, Button, Flex } from '@tremor/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Download, 
  Maximize2,
  Filter,
  Minimize2
} from 'lucide-react';
import { 
  BarChart, 
  LineChart, 
  AreaChart, 
  DonutChart 
} from '@tremor/react';
import { ChartCard } from './ChartCard';
import { ChartBreadcrumb } from './ChartBreadcrumb';
import { InteractiveTooltip, useTooltip } from './InteractiveTooltip';
import { useInteractiveChart } from '@/hooks/useInteractiveChart';
import { useDrilldownNavigation } from '@/hooks/useDrilldownNavigation';
import { useChartResponsive } from '@/hooks/useChartResponsive';
import { cn } from '@/lib/utils';

// Tipos
export interface DrilldownLevel {
  id: string;
  title: string;
  subtitle?: string;
  data: any[];
  chartType: 'bar' | 'line' | 'area' | 'donut' | 'combo' | 'custom';
  chartProps: any;
  customComponent?: React.ComponentType<any>;
  filters?: FilterConfig[];
  actions?: ActionConfig[];
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'date' | 'range';
  options?: any[];
  defaultValue?: any;
}

interface ActionConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (data: any) => void;
}

interface DrilldownChartProps {
  levels: DrilldownLevel[];
  initialLevel?: number;
  onDrilldown?: (level: number, data: any) => void | Promise<void>;
  onNavigate?: (fromLevel: number, toLevel: number) => void;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  enableFullscreen?: boolean;
  enableExport?: boolean;
  enableFilters?: boolean;
  persistNavigation?: boolean;
  animationDuration?: number;
  className?: string;
}

export function DrilldownChart({ 
  levels, 
  initialLevel = 0,
  onDrilldown,
  onNavigate,
  altura = 'lg',
  enableFullscreen = true,
  enableExport = true,
  enableFilters = true,
  persistNavigation = false,
  animationDuration = 300,
  className = ''
}: DrilldownChartProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  
  // Estado local
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  
  // Hooks customizados
  const { 
    currentLevel,
    goToLevel, 
    goBack, 
    canGoBack,
    getBreadcrumbs,
    addToHistory 
  } = useDrilldownNavigation(levels, persistNavigation, {
    onNavigate
  });
  
  const { 
    selectedData, 
    hoveredData, 
    handleClick,
    handleHover,
    handleFilter,
    clearSelection 
  } = useInteractiveChart(`drilldown-${levels[0].id}`, {
    persistState: persistNavigation,
    onInteraction: async (interaction) => {
      if (interaction.type === 'drill' && onDrilldown) {
        await onDrilldown(currentLevel + 1, interaction.data);
      }
    }
  });

  const {
    dimensions,
    getChartProps,
    shouldUseCompactLayout,
    getSpacing
  } = useChartResponsive(containerRef);

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip
  } = useTooltip();

  // Handlers
  const handleValueChange = useCallback(async (value: any, event?: React.MouseEvent) => {
    if (!value || isLoading) return;

    setIsLoading(true);
    
    try {
      // Mostrar tooltip com informações do item
      if (event) {
        showTooltip({
          title: value.name || value.label || 'Item selecionado',
          value: value.value || value.y || 0,
          category: getCurrentLevelData().title,
          items: Object.entries(value)
            .filter(([key, val]) => key !== 'name' && key !== 'label' && typeof val === 'number')
            .map(([key, val]) => ({
              label: key,
              value: val as number,
              format: 'currency' as const
            }))
        }, event);
      }

      // Registrar clique
      await handleClick(value, { level: currentLevel });
      
      // Processar drilldown se houver próximo nível
      if (currentLevel < levels.length - 1) {
        addToHistory(currentLevel, value);
        
        // Callback opcional para carregar dados
        if (onDrilldown) {
          await onDrilldown(currentLevel + 1, value);
        }
        
        goToLevel(currentLevel + 1, value);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentLevel, levels.length, isLoading, addToHistory, onDrilldown, goToLevel, handleClick, showTooltip]);

  const handleValueHover = useCallback((value: any, event?: React.MouseEvent) => {
    if (value && event) {
      showTooltip({
        title: value.name || value.label || 'Item',
        value: value.value || value.y || 0,
        category: getCurrentLevelData().title,
        metadata: {
          level: currentLevel,
          tipo: getCurrentLevelData().chartType
        }
      }, event);
      
      handleHover(value);
    }
  }, [currentLevel, showTooltip, handleHover]);

  const handleMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const handleBack = useCallback(() => {
    if (canGoBack()) {
      goBack();
    }
  }, [canGoBack, goBack]);

  const handleBreadcrumbClick = useCallback((level: number) => {
    if (level !== currentLevel && level < levels.length) {
      goToLevel(level);
    }
  }, [currentLevel, levels.length, goToLevel]);

  const handleExport = useCallback(async () => {
    const currentData = getCurrentLevelData();
    const blob = new Blob(
      [JSON.stringify(currentData.data, null, 2)], 
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentData.title.replace(/\s+/g, '_')}_dados.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentLevel, levels]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    setActiveFilters(prev => ({ ...prev, ...filters }));
    handleFilter(filters);
  }, [handleFilter]);

  // Helpers
  const getCurrentLevelData = useCallback(() => {
    const level = levels[currentLevel];
    if (!level) return levels[0];
    
    // Aplicar filtros se habilitado
    if (enableFilters && Object.keys(activeFilters).length > 0) {
      const filteredData = applyFilters(level.data, activeFilters);
      return { ...level, data: filteredData };
    }
    
    return level;
  }, [currentLevel, levels, enableFilters, activeFilters]);

  const getChartComponent = useCallback((type: string) => {
    const components: Record<string, any> = {
      bar: BarChart,
      line: LineChart,
      area: AreaChart,
      donut: DonutChart,
    };
    return components[type] || BarChart;
  }, []);

  // Effects
  useEffect(() => {
    // Listener para fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Render
  const currentLevelData = getCurrentLevelData();
  const ChartComponent = currentLevelData.chartType === 'custom' 
    ? currentLevelData.customComponent! 
    : getChartComponent(currentLevelData.chartType);

  const spacing = getSpacing();
  const breadcrumbs = getBreadcrumbs();
  const isCompact = shouldUseCompactLayout();

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative',
        isFullscreen && 'fixed inset-0 z-50 bg-white dark:bg-gray-950',
        isFullscreen ? 'p-4' : spacing.padding,
        className
      )}
    >
      <ChartCard
        titulo={
          <Flex>
            <div className="flex-1">
              <Title className={isCompact ? 'text-lg' : 'text-xl'}>
                {currentLevelData.title}
              </Title>
              {currentLevelData.subtitle && !isCompact && (
                <Subtitle className="mt-1">
                  {currentLevelData.subtitle}
                </Subtitle>
              )}
            </div>
          </Flex>
        }
        altura={isFullscreen ? 'xl' : altura}
        acoes={
          <Flex className={cn('gap-2', isCompact && 'flex-col')}>
            {/* Breadcrumb Navigation */}
            {currentLevel > 0 && (
              <div className={cn('mr-4', isCompact && 'mr-0 mb-2')}>
                <ChartBreadcrumb
                  items={breadcrumbs}
                  onItemClick={handleBreadcrumbClick}
                  compact={isCompact}
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <Flex className={cn('gap-2', isCompact && 'flex-wrap')}>
              {canGoBack() && (
                <Button
                  size="xs"
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  {!isCompact && 'Voltar'}
                </Button>
              )}
              
              {currentLevelData.actions?.map(action => (
                <Button
                  key={action.id}
                  size="xs"
                  variant="secondary"
                  icon={action.icon}
                  onClick={() => action.onClick(currentLevelData.data)}
                >
                  {!isCompact && action.label}
                </Button>
              ))}
              
              {enableFilters && currentLevelData.filters && (
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Filter}
                  onClick={() => {/* Implementar modal de filtros */}}
                >
                  {!isCompact && 'Filtros'}
                </Button>
              )}
              
              {enableExport && (
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Download}
                  onClick={handleExport}
                >
                  {!isCompact && 'Exportar'}
                </Button>
              )}
              
              {enableFullscreen && (
                <Button
                  size="xs"
                  variant="secondary"
                  icon={isFullscreen ? Minimize2 : Maximize2}
                  onClick={handleFullscreen}
                >
                  {!isCompact && (isFullscreen ? 'Sair' : 'Expandir')}
                </Button>
              )}
            </Flex>
          </Flex>
        }
      >
        <div 
          className="relative h-full"
          onMouseLeave={handleMouseLeave}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
            </div>
          ) : (
            <ChartComponent
              ref={chartRef}
              data={currentLevelData.data}
              onValueChange={handleValueChange}
              onValueHover={handleValueHover}
              {...getChartProps(currentLevelData.chartType)}
              {...currentLevelData.chartProps}
              className="h-full w-full"
            />
          )}
        </div>
      </ChartCard>

      {/* Tooltip Interativo */}
      <InteractiveTooltip
        data={tooltipData}
        position={tooltipPosition}
        visible={tooltipVisible}
        interactive={true}
        onTooltipClick={(data) => {
          console.log('Tooltip clicked:', data);
        }}
      />
    </div>
  );
}

// Função auxiliar para aplicar filtros
function applyFilters(data: any[], filters: Record<string, any>): any[] {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      
      // Lógica de filtro baseada no tipo
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      
      if (typeof value === 'object' && value.min !== undefined) {
        return item[key] >= value.min && item[key] <= value.max;
      }
      
      return item[key] === value;
    });
  });
}

export default DrilldownChart;