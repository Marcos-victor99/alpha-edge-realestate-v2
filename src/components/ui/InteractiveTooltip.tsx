import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Text, Title, Badge, Flex } from '@tremor/react';
import { cn } from '@/lib/utils';
import { formatarMoeda, formatarPorcentagem, formatarData } from '@/lib/formatters';
import { Info, TrendingUp, TrendingDown, Calendar, DollarSign, Percent } from 'lucide-react';

export interface TooltipData {
  title?: string;
  subtitle?: string;
  value?: number;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  category?: string;
  date?: string;
  metadata?: Record<string, any>;
  items?: TooltipItem[];
}

export interface TooltipItem {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
  format?: 'currency' | 'percentage' | 'number' | 'date';
}

export interface InteractiveTooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number } | null;
  visible: boolean;
  interactive?: boolean;
  maxWidth?: number;
  theme?: 'light' | 'dark';
  showArrow?: boolean;
  delay?: number;
  onTooltipClick?: (data: TooltipData) => void;
  onTooltipHover?: (data: TooltipData) => void;
  className?: string;
}

export function InteractiveTooltip({
  data,
  position,
  visible,
  interactive = false,
  maxWidth = 320,
  theme = 'light',
  showArrow = true,
  delay = 0,
  onTooltipClick,
  onTooltipHover,
  className
}: InteractiveTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [actualPosition, setActualPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDelayActive, setIsDelayActive] = useState(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout>();

  // Calcular posição otimizada para evitar sair da tela
  const calculatePosition = useCallback((
    mouseX: number,
    mouseY: number,
    tooltipWidth: number,
    tooltipHeight: number
  ) => {
    const padding = 16;
    const arrowOffset = 12;
    
    let x = mouseX + padding;
    let y = mouseY - tooltipHeight / 2;

    // Verificar limites horizontais
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = mouseX - tooltipWidth - padding;
    }

    // Verificar limites verticais
    if (y < padding) {
      y = padding;
    } else if (y + tooltipHeight > window.innerHeight - padding) {
      y = window.innerHeight - tooltipHeight - padding;
    }

    return { x, y };
  }, []);

  // Atualizar posição quando necessário
  useEffect(() => {
    if (position && tooltipRef.current && visible) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculatePosition(position.x, position.y, rect.width, rect.height);
      setActualPosition(newPosition);
    }
  }, [position, visible, data, calculatePosition]);

  // Gerenciar delay de exibição
  useEffect(() => {
    if (visible && delay > 0) {
      setIsDelayActive(true);
      delayTimeoutRef.current = setTimeout(() => {
        setIsDelayActive(false);
      }, delay);
    } else {
      setIsDelayActive(false);
    }

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [visible, delay]);

  // Formatador de valores
  const formatValue = useCallback((value: number | string, format?: TooltipItem['format']) => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return formatarMoeda(value);
      case 'percentage':
        return formatarPorcentagem(value);
      case 'number':
        return value.toLocaleString('pt-BR');
      case 'date':
        return formatarData(String(value));
      default:
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value);
    }
  }, []);

  // Handlers
  const handleClick = useCallback(() => {
    if (interactive && data && onTooltipClick) {
      onTooltipClick(data);
    }
  }, [interactive, data, onTooltipClick]);

  const handleHover = useCallback(() => {
    if (interactive && data && onTooltipHover) {
      onTooltipHover(data);
    }
  }, [interactive, data, onTooltipHover]);

  // Não renderizar se não há dados ou não está visível
  if (!data || !visible || isDelayActive) {
    return null;
  }

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 border-gray-700 text-white' 
    : 'bg-white border-gray-200 text-gray-900';

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 pointer-events-none transition-opacity duration-200',
        interactive && 'pointer-events-auto cursor-pointer',
        className
      )}
      style={{
        left: actualPosition.x,
        top: actualPosition.y,
        maxWidth,
        opacity: visible ? 1 : 0
      }}
      onClick={handleClick}
      onMouseEnter={handleHover}
    >
      <Card className={cn(
        'shadow-lg border transition-all duration-200',
        themeClasses,
        interactive && 'hover:shadow-xl hover:scale-105'
      )}>
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
            {data.title && (
              <Title className="text-sm font-semibold mb-1">
                {data.title}
              </Title>
            )}
            {data.subtitle && (
              <Text className="text-xs text-gray-500">
                {data.subtitle}
              </Text>
            )}
            {data.date && (
              <Flex className="mt-2" alignItems="center" justifyContent="start">
                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                <Text className="text-xs text-gray-500">
                  {formatarData(data.date)}
                </Text>
              </Flex>
            )}
          </div>
        )}

        {/* Valor principal */}
        {data.value !== undefined && (
          <div className="mb-3">
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Text className="text-lg font-bold">
                  {formatarMoeda(data.value)}
                </Text>
                {data.category && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {data.category}
                  </Text>
                )}
              </div>
              
              {/* Indicador de mudança */}
              {data.change !== undefined && (
                <div className="text-right">
                  <Flex alignItems="center" justifyContent="end" className="gap-1">
                    {data.changeType === 'positive' ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : data.changeType === 'negative' ? (
                      <TrendingDown className="h-3 w-3 text-rose-500" />
                    ) : (
                      <DollarSign className="h-3 w-3 text-gray-400" />
                    )}
                    <Badge
                      color={
                        data.changeType === 'positive' ? 'emerald' :
                        data.changeType === 'negative' ? 'rose' : 'gray'
                      }
                      size="xs"
                    >
                      {data.change > 0 ? '+' : ''}{formatarPorcentagem(data.change)}
                    </Badge>
                  </Flex>
                  
                  {data.previousValue !== undefined && (
                    <Text className="text-xs text-gray-500 mt-1">
                      Anterior: {formatarMoeda(data.previousValue)}
                    </Text>
                  )}
                </div>
              )}
            </Flex>
          </div>
        )}

        {/* Items detalhados */}
        {data.items && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Flex key={index} alignItems="center" justifyContent="between">
                  <Flex alignItems="center" justifyContent="start" className="gap-2">
                    {IconComponent && (
                      <IconComponent className="h-3 w-3 text-gray-400" />
                    )}
                    {item.color && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <Text className="text-xs">
                      {item.label}
                    </Text>
                  </Flex>
                  <Text className="text-xs font-medium">
                    {formatValue(item.value, item.format)}
                  </Text>
                </Flex>
              );
            })}
          </div>
        )}

        {/* Metadata adicional */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Flex alignItems="center" className="gap-1 mb-2">
              <Info className="h-3 w-3 text-gray-400" />
              <Text className="text-xs text-gray-500">Detalhes</Text>
            </Flex>
            <div className="space-y-1">
              {Object.entries(data.metadata).map(([key, value]) => (
                <Flex key={key} alignItems="center" justifyContent="between">
                  <Text className="text-xs text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Text>
                  <Text className="text-xs">
                    {String(value)}
                  </Text>
                </Flex>
              ))}
            </div>
          </div>
        )}

        {/* Seta do tooltip */}
        {showArrow && (
          <div
            className={cn(
              'absolute w-2 h-2 transform rotate-45',
              theme === 'dark' ? 'bg-gray-900' : 'bg-white',
              'border-l border-t',
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            )}
            style={{
              left: -4,
              top: '50%',
              marginTop: -4
            }}
          />
        )}
      </Card>
    </div>
  );
}

// Hook para usar tooltip facilmente
export function useTooltip() {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = useCallback((
    data: TooltipData,
    event: React.MouseEvent | MouseEvent
  ) => {
    setTooltipData(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
    setTimeout(() => {
      setTooltipData(null);
      setTooltipPosition(null);
    }, 200);
  }, []);

  const updateTooltipPosition = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (tooltipVisible) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  }, [tooltipVisible]);

  return {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip,
    updateTooltipPosition
  };
}