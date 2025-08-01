import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, Title, Text, Flex, Badge, Button, Select, SelectItem } from '@tremor/react';
import { Calendar, BarChart3, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useTooltip } from '@/components/ui/InteractiveTooltip';
import { buildHeatmapData, normalizeValues, calculateStatistics } from '@/lib/chart-utils';
import { formatarMoedaCompacta, formatarData, formatarPorcentagem } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Tipos para Heatmap
export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  normalizedValue: number;
  color: string;
  metadata?: Record<string, any>;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  minValue: number;
  maxValue: number;
  avgValue: number;
}

interface HeatmapAnalysisProps {
  data: any[];
  xKey: string; // Ex: 'mes' para análise temporal
  yKey: string; // Ex: 'shopping' para análise espacial
  valueKey: string;
  title?: string;
  subtitle?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: 'sequential' | 'diverging' | 'categorical';
  enableInteraction?: boolean;
  showLabels?: boolean;
  cellSize?: number;
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
}

// Esquemas de cores
const COLOR_SCHEMES = {
  sequential: {
    low: '#EEF2FF',
    medium: '#6366F1',
    high: '#312E81'
  },
  diverging: {
    low: '#FEE2E2',
    medium: '#FFFFFF',
    high: '#DCFCE7',
    negative: '#EF4444',
    positive: '#10B981'
  },
  categorical: {
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
  }
};

export function HeatmapAnalysis({
  data,
  xKey,
  yKey,
  valueKey,
  title = 'Análise de Calor',
  subtitle = 'Mapa de performance multidimensional',
  altura = 'lg',
  colorScheme = 'sequential',
  enableInteraction = true,
  showLabels = true,
  cellSize = 40,
  onCellClick,
  className
}: HeatmapAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    cells: [],
    xLabels: [],
    yLabels: [],
    minValue: 0,
    maxValue: 0,
    avgValue: 0
  });
  const [selectedCell, setSelectedCell] = useState<{ x: string; y: string } | null>(null);
  const [aggregationMode, setAggregationMode] = useState<'sum' | 'avg' | 'count'>('sum');
  const [viewMode, setViewMode] = useState<'absolute' | 'normalized'>('absolute');

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip
  } = useTooltip();

  // Processar dados para heatmap
  useEffect(() => {
    const heatmapRaw = buildHeatmapData(data, xKey, yKey, valueKey);
    
    // Obter labels únicos e ordenados
    const xLabels = [...new Set(heatmapRaw.map(item => item.x))].sort();
    const yLabels = [...new Set(heatmapRaw.map(item => item.y))].sort();

    // Criar matriz completa (incluindo células vazias)
    const cellMap = new Map<string, HeatmapCell>();
    
    // Processar células com dados
    heatmapRaw.forEach(item => {
      const key = `${item.x}-${item.y}`;
      if (cellMap.has(key)) {
        const existing = cellMap.get(key)!;
        switch (aggregationMode) {
          case 'sum':
            existing.value += item.value;
            break;
          case 'avg':
            existing.value = (existing.value + item.value) / 2;
            break;
          case 'count':
            existing.value += 1;
            break;
        }
      } else {
        cellMap.set(key, {
          x: item.x,
          y: item.y,
          value: aggregationMode === 'count' ? 1 : item.value,
          normalizedValue: 0,
          color: '',
          metadata: {
            originalData: data.filter(d => d[xKey] === item.x && d[yKey] === item.y)
          }
        });
      }
    });

    // Preencher células vazias
    xLabels.forEach(x => {
      yLabels.forEach(y => {
        const key = `${x}-${y}`;
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            x,
            y,
            value: 0,
            normalizedValue: 0,
            color: '',
            metadata: { isEmpty: true }
          });
        }
      });
    });

    const cells = Array.from(cellMap.values());
    const values = cells.map(cell => cell.value);
    const stats = calculateStatistics(values);

    // Normalizar valores
    const normalizedValues = normalizeValues(values, 0, 1);
    cells.forEach((cell, index) => {
      cell.normalizedValue = normalizedValues[index];
      cell.color = getCellColor(cell.normalizedValue, cell.value, stats);
    });

    setHeatmapData({
      cells,
      xLabels,
      yLabels,
      minValue: stats.min,
      maxValue: stats.max,
      avgValue: stats.mean
    });
  }, [data, xKey, yKey, valueKey, aggregationMode]);

  // Função para determinar cor da célula
  const getCellColor = useCallback((normalizedValue: number, actualValue: number, stats: any) => {
    if (actualValue === 0) return '#F3F4F6'; // Cinza para células vazias

    switch (colorScheme) {
      case 'sequential':
        const intensity = Math.floor(normalizedValue * 255);
        return `rgb(${255 - intensity}, ${255 - intensity * 0.5}, 255)`;
      
      case 'diverging':
        const midpoint = stats.mean;
        if (actualValue < midpoint) {
          const intensity = (midpoint - actualValue) / (midpoint - stats.min);
          return `rgba(239, 68, 68, ${Math.min(1, intensity)})`;
        } else {
          const intensity = (actualValue - midpoint) / (stats.max - midpoint);
          return `rgba(16, 185, 129, ${Math.min(1, intensity)})`;
        }
      
      case 'categorical':
        const colorIndex = Math.floor(normalizedValue * (COLOR_SCHEMES.categorical.colors.length - 1));
        return COLOR_SCHEMES.categorical.colors[colorIndex];
      
      default:
        return `rgba(59, 130, 246, ${normalizedValue})`;
    }
  }, [colorScheme]);

  // Handlers
  const handleCellClick = useCallback((cell: HeatmapCell, event: React.MouseEvent) => {
    if (!enableInteraction) return;

    setSelectedCell(
      selectedCell?.x === cell.x && selectedCell?.y === cell.y 
        ? null 
        : { x: cell.x, y: cell.y }
    );

    if (onCellClick) {
      onCellClick(cell);
    }

    // Mostrar tooltip detalhado
    const percentile = ((cell.value - heatmapData.minValue) / (heatmapData.maxValue - heatmapData.minValue)) * 100;

    showTooltip({
      title: `${cell.y} - ${cell.x}`,
      value: cell.value,
      subtitle: `${formatarPorcentagem(percentile)}º percentil`,
      items: [
        {
          label: 'Valor Normalizado',
          value: cell.normalizedValue,
          format: 'number'
        },
        {
          label: 'Valor Médio',
          value: heatmapData.avgValue,
          format: 'currency'
        },
        {
          label: 'Desvio da Média',
          value: ((cell.value - heatmapData.avgValue) / heatmapData.avgValue) * 100,
          format: 'percentage'
        },
        ...(cell.metadata?.originalData ? [{
          label: 'Registros',
          value: cell.metadata.originalData.length,
          format: 'number'
        }] : [])
      ]
    }, event);
  }, [enableInteraction, selectedCell, onCellClick, heatmapData, showTooltip]);

  const handleCellHover = useCallback((cell: HeatmapCell, event: React.MouseEvent) => {
    showTooltip({
      title: `${cell.y} - ${cell.x}`,
      value: cell.value,
      category: 'Heatmap'
    }, event);
  }, [showTooltip]);

  // Cálculos de layout
  const layout = useMemo(() => {
    if (!containerRef.current) return { width: 600, height: 400, cellWidth: 40, cellHeight: 40 };

    const rect = containerRef.current.getBoundingClientRect();
    const availableWidth = (rect.width || 600) - 100; // Espaço para labels
    const availableHeight = (rect.height || 400) - 80; // Espaço para labels

    const cellWidth = Math.max(20, Math.min(cellSize, availableWidth / heatmapData.xLabels.length));
    const cellHeight = Math.max(20, Math.min(cellSize, availableHeight / heatmapData.yLabels.length));

    return {
      width: rect.width || 600,
      height: rect.height || 400,
      cellWidth,
      cellHeight
    };
  }, [heatmapData.xLabels.length, heatmapData.yLabels.length, cellSize]);

  // Estatísticas da seleção
  const selectionStats = useMemo(() => {
    if (!selectedCell) return null;

    const selectedCells = heatmapData.cells.filter(cell => 
      cell.x === selectedCell.x || cell.y === selectedCell.y
    );

    const values = selectedCells.map(cell => cell.value);
    return calculateStatistics(values);
  }, [selectedCell, heatmapData.cells]);

  return (
    <div className={cn('relative', className)}>
      <Card className="h-full">
        {/* Header */}
        <Flex className="mb-4" alignItems="center" justifyContent="between">
          <div>
            <Title>{title}</Title>
            {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
          </div>
          
          <Flex className="gap-2">
            <Badge color="blue" size="sm">
              {heatmapData.cells.filter(cell => cell.value > 0).length} células ativas
            </Badge>
          </Flex>
        </Flex>

        {/* Controls */}
        <Flex className="mb-4 gap-4">
          <div>
            <Text className="text-xs text-gray-500 mb-1">Agregação</Text>
            <Select value={aggregationMode} onValueChange={setAggregationMode}>
              <SelectItem value="sum">Soma</SelectItem>
              <SelectItem value="avg">Média</SelectItem>
              <SelectItem value="count">Contagem</SelectItem>
            </Select>
          </div>
          
          <div>
            <Text className="text-xs text-gray-500 mb-1">Visualização</Text>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectItem value="absolute">Valores Absolutos</SelectItem>
              <SelectItem value="normalized">Valores Normalizados</SelectItem>
            </Select>
          </div>

          <div>
            <Text className="text-xs text-gray-500 mb-1">Esquema de Cores</Text>
            <Select value={colorScheme} onValueChange={(value) => {
              // Reprocessar cores quando esquema mudar
              const updatedCells = heatmapData.cells.map(cell => ({
                ...cell,
                color: getCellColor(cell.normalizedValue, cell.value, {
                  min: heatmapData.minValue,
                  max: heatmapData.maxValue,
                  mean: heatmapData.avgValue
                })
              }));
              setHeatmapData(prev => ({ ...prev, cells: updatedCells }));
            }}>
              <SelectItem value="sequential">Sequencial</SelectItem>
              <SelectItem value="diverging">Divergente</SelectItem>
              <SelectItem value="categorical">Categórico</SelectItem>
            </Select>
          </div>
        </Flex>

        {/* Heatmap */}
        <div
          ref={containerRef}
          className={cn(
            'w-full bg-gray-50 rounded-lg border overflow-auto',
            altura === 'sm' && 'h-64',
            altura === 'md' && 'h-80',
            altura === 'lg' && 'h-96',
            altura === 'xl' && 'h-[32rem]'
          )}
        >
          <div className="p-4 min-w-fit">
            <svg
              width={layout.cellWidth * heatmapData.xLabels.length + 80}
              height={layout.cellHeight * heatmapData.yLabels.length + 60}
              className="overflow-visible"
            >
              {/* Labels do eixo X */}
              {showLabels && heatmapData.xLabels.map((label, index) => (
                <text
                  key={`x-label-${index}`}
                  x={80 + index * layout.cellWidth + layout.cellWidth / 2}
                  y={15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {label.length > 8 ? `${label.substring(0, 8)}...` : label}
                </text>
              ))}

              {/* Labels do eixo Y */}
              {showLabels && heatmapData.yLabels.map((label, index) => (
                <text
                  key={`y-label-${index}`}
                  x={75}
                  y={30 + index * layout.cellHeight + layout.cellHeight / 2}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                  dominantBaseline="middle"
                >
                  {label.length > 12 ? `${label.substring(0, 12)}...` : label}
                </text>
              ))}

              {/* Células do heatmap */}
              {heatmapData.cells.map((cell, index) => {
                const xIndex = heatmapData.xLabels.indexOf(cell.x);
                const yIndex = heatmapData.yLabels.indexOf(cell.y);
                const isSelected = selectedCell?.x === cell.x && selectedCell?.y === cell.y;
                const isHighlighted = selectedCell && 
                  (selectedCell.x === cell.x || selectedCell.y === cell.y);

                const x = 80 + xIndex * layout.cellWidth;
                const y = 30 + yIndex * layout.cellHeight;

                const displayValue = viewMode === 'normalized' 
                  ? cell.normalizedValue 
                  : cell.value;

                return (
                  <g key={`cell-${index}`}>
                    {/* Célula */}
                    <rect
                      x={x}
                      y={y}
                      width={layout.cellWidth - 1}
                      height={layout.cellHeight - 1}
                      fill={cell.color}
                      stroke={isSelected ? '#3B82F6' : isHighlighted ? '#6B7280' : '#E5E7EB'}
                      strokeWidth={isSelected ? 3 : isHighlighted ? 2 : 0.5}
                      className={cn(
                        'transition-all duration-200',
                        enableInteraction && 'cursor-pointer hover:brightness-110'
                      )}
                      onClick={(e) => handleCellClick(cell, e as any)}
                      onMouseEnter={(e) => handleCellHover(cell, e as any)}
                      onMouseLeave={hideTooltip}
                    />
                    
                    {/* Texto do valor (se a célula for grande o suficiente) */}
                    {layout.cellWidth > 30 && layout.cellHeight > 20 && cell.value > 0 && (
                      <text
                        x={x + layout.cellWidth / 2}
                        y={y + layout.cellHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white pointer-events-none"
                        style={{
                          textShadow: '0 0 2px rgba(0,0,0,0.8)'
                        }}
                      >
                        {viewMode === 'normalized' 
                          ? displayValue.toFixed(2)
                          : formatarMoedaCompacta(displayValue)
                        }
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Text className="text-sm text-gray-500">Mínimo</Text>
            <Text className="font-semibold">{formatarMoedaCompacta(heatmapData.minValue)}</Text>
          </div>
          <div className="text-center">
            <Text className="text-sm text-gray-500">Máximo</Text>
            <Text className="font-semibold">{formatarMoedaCompacta(heatmapData.maxValue)}</Text>
          </div>
          <div className="text-center">
            <Text className="text-sm text-gray-500">Média</Text>
            <Text className="font-semibold">{formatarMoedaCompacta(heatmapData.avgValue)}</Text>
          </div>
          <div className="text-center">
            <Text className="text-sm text-gray-500">Amplitude</Text>
            <Text className="font-semibold">
              {formatarMoedaCompacta(heatmapData.maxValue - heatmapData.minValue)}
            </Text>
          </div>
        </div>

        {/* Estatísticas da seleção */}
        {selectionStats && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <Text className="text-sm font-medium text-blue-900 mb-2">
              Estatísticas da Seleção ({selectedCell?.x || selectedCell?.y})
            </Text>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Text className="text-xs text-blue-700">Média</Text>
                <Text className="font-medium text-blue-900">
                  {formatarMoedaCompacta(selectionStats.mean)}
                </Text>
              </div>
              <div>
                <Text className="text-xs text-blue-700">Mediana</Text>
                <Text className="font-medium text-blue-900">
                  {formatarMoedaCompacta(selectionStats.median)}
                </Text>
              </div>
              <div>
                <Text className="text-xs text-blue-700">Desvio Padrão</Text>
                <Text className="font-medium text-blue-900">
                  {formatarMoedaCompacta(selectionStats.stdDev)}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tooltip */}
      {tooltipVisible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition?.x,
            top: tooltipPosition?.y
          }}
        >
          <Card className="bg-white shadow-lg border p-3 max-w-xs">
            <Title className="text-sm mb-1">{tooltipData?.title}</Title>
            <Text className="font-semibold text-lg mb-2">
              {formatarMoedaCompacta(tooltipData?.value || 0)}
            </Text>
            {tooltipData?.subtitle && (
              <Text className="text-xs text-gray-500 mb-2">{tooltipData.subtitle}</Text>
            )}
            {tooltipData?.items?.map((item, index) => (
              <Flex key={index} className="text-xs" alignItems="center" justifyContent="between">
                <Text>{item.label}:</Text>
                <Text className="font-medium">{
                  item.format === 'percentage' 
                    ? formatarPorcentagem(Number(item.value))
                    : item.format === 'currency'
                    ? formatarMoedaCompacta(Number(item.value))
                    : String(item.value)
                }</Text>
              </Flex>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

export default HeatmapAnalysis;