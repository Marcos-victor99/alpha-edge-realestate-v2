import React from 'react';
import { Flex, Text, Button } from '@tremor/react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  level: number;
  title: string;
  data?: any;
  isActive: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ChartBreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick: (level: number, item: BreadcrumbItem) => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  maxItems?: number;
  separator?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ChartBreadcrumb({
  items,
  onItemClick,
  onBackClick,
  showBackButton = true,
  showHomeButton = true,
  maxItems = 5,
  separator = <ChevronRight className="h-3 w-3 text-gray-400" />,
  className,
  compact = false
}: ChartBreadcrumbProps) {
  // Limitar número de items exibidos
  const displayItems = items.length > maxItems
    ? [
        items[0], // Sempre mostrar o primeiro (home)
        { 
          level: -1, 
          title: '...', 
          isActive: false, 
          data: null 
        } as BreadcrumbItem,
        ...items.slice(-(maxItems - 2)) // Mostrar os últimos
      ]
    : items;

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.level >= 0 && !item.isActive) {
      onItemClick(item.level, item);
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      // Fallback: voltar um nível
      const currentIndex = items.findIndex(item => item.isActive);
      if (currentIndex > 0) {
        const previousItem = items[currentIndex - 1];
        onItemClick(previousItem.level, previousItem);
      }
    }
  };

  const canGoBack = items.length > 1 && items.some(item => item.isActive && item.level > 0);

  if (items.length <= 1 && !showHomeButton) {
    return null;
  }

  return (
    <nav 
      className={cn(
        'flex items-center',
        compact ? 'space-x-1' : 'space-x-2',
        className
      )}
      aria-label="Navegação do gráfico"
    >
      {/* Botão Voltar */}
      {showBackButton && canGoBack && (
        <Button
          size="xs"
          variant="secondary"
          icon={ArrowLeft}
          onClick={handleBackClick}
          className={cn(
            'text-gray-500 hover:text-gray-700',
            compact && 'px-1'
          )}
          aria-label="Voltar nível anterior"
        >
          {!compact && 'Voltar'}
        </Button>
      )}

      {/* Botão Home (sempre visível se habilitado) */}
      {showHomeButton && items.length > 1 && (
        <>
          <Button
            size="xs"
            variant={items[0]?.isActive ? 'primary' : 'secondary'}
            icon={Home}
            onClick={() => handleItemClick(items[0])}
            className={cn(
              'text-gray-500 hover:text-gray-700',
              items[0]?.isActive && 'text-blue-600 bg-blue-50',
              compact && 'px-1'
            )}
            aria-label="Ir para nível inicial"
          >
            {!compact && 'Início'}
          </Button>
          
          {items.length > 1 && (
            <div className="flex items-center">
              {separator}
            </div>
          )}
        </>
      )}

      {/* Lista de breadcrumbs */}
      <ol className="flex items-center space-x-1 md:space-x-2">
        {displayItems.slice(showHomeButton ? 1 : 0).map((item, index) => {
          const isEllipsis = item.level === -1;
          const isLast = index === displayItems.slice(showHomeButton ? 1 : 0).length - 1;
          const IconComponent = item.icon;

          return (
            <li key={`${item.level}-${index}`} className="flex items-center">
              {/* Item do breadcrumb */}
              {isEllipsis ? (
                <Text className="text-gray-400 text-sm px-2">
                  ...
                </Text>
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.isActive}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                    item.isActive
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 cursor-default'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                    compact && 'px-1 py-0.5 text-xs'
                  )}
                  aria-current={item.isActive ? 'page' : undefined}
                  aria-label={item.isActive ? `Nível atual: ${item.title}` : `Ir para ${item.title}`}
                >
                  {IconComponent && (
                    <IconComponent className={cn(
                      'h-3 w-3',
                      compact && 'h-2.5 w-2.5'
                    )} />
                  )}
                  
                  <span className={cn(
                    'max-w-[120px] truncate',
                    compact && 'max-w-[80px]'
                  )}>
                    {item.title}
                  </span>

                  {/* Indicador de dados */}
                  {item.data && !item.isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-1" />
                  )}
                </button>
              )}

              {/* Separador */}
              {!isLast && !isEllipsis && (
                <div className="flex items-center ml-1 md:ml-2">
                  {separator}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Informação adicional sobre o nível atual */}
      {!compact && (
        <div className="hidden md:flex items-center ml-4 text-xs text-gray-500">
          <Text>
            Nível {items.find(item => item.isActive)?.level || 0} de {items.length - 1}
          </Text>
        </div>
      )}
    </nav>
  );
}

// Componente simplificado para casos básicos
export function SimpleBreadcrumb({
  currentPath,
  onPathClick,
  className
}: {
  currentPath: string[];
  onPathClick: (index: number) => void;
  className?: string;
}) {
  const items: BreadcrumbItem[] = currentPath.map((path, index) => ({
    level: index,
    title: path,
    isActive: index === currentPath.length - 1
  }));

  return (
    <ChartBreadcrumb
      items={items}
      onItemClick={(level) => onPathClick(level)}
      showBackButton={false}
      showHomeButton={false}
      compact={true}
      className={className}
    />
  );
}

// Hook para gerenciar breadcrumbs
export function useBreadcrumb(initialPath: string[] = ['Início']) {
  const [path, setPath] = React.useState<string[]>(initialPath);

  const addLevel = React.useCallback((levelName: string) => {
    setPath(prev => [...prev, levelName]);
  }, []);

  const goToLevel = React.useCallback((index: number) => {
    setPath(prev => prev.slice(0, index + 1));
  }, []);

  const goBack = React.useCallback(() => {
    setPath(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);

  const reset = React.useCallback(() => {
    setPath(initialPath);
  }, [initialPath]);

  const getCurrentLevel = React.useCallback(() => {
    return path.length - 1;
  }, [path]);

  const getBreadcrumbItems = React.useCallback((): BreadcrumbItem[] => {
    return path.map((title, index) => ({
      level: index,
      title,
      isActive: index === path.length - 1
    }));
  }, [path]);

  return {
    path,
    currentLevel: getCurrentLevel(),
    breadcrumbItems: getBreadcrumbItems(),
    addLevel,
    goToLevel,
    goBack,
    reset
  };
}