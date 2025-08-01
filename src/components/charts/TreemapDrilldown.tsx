import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Title, Flex, Text, Badge } from '@tremor/react';
import { ChevronDown, ChevronUp, Building2, Users, DollarSign } from 'lucide-react';
import { DrilldownChart } from '@/components/ui/DrilldownChart';
import { useTooltip } from '@/components/ui/InteractiveTooltip';
import { buildHierarchy, FINANCIAL_COLORS, chartFormatters } from '@/lib/chart-utils';
import { formatarMoedaCompacta, formatarPorcentagem } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Tipos específicos para Treemap
export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  level?: number;
  parent?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TreemapData {
  nodes: TreemapNode[];
  totalValue: number;
  maxDepth: number;
}

interface TreemapDrilldownProps {
  data: any[];
  keyPath: string[]; // Ex: ['shopping', 'locatario']
  valueKey: string;
  title?: string;
  subtitle?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: string[];
  enableDrilldown?: boolean;
  onNodeClick?: (node: TreemapNode) => void;
  className?: string;
}

// Componente principal TreemapDrilldown
export function TreemapDrilldown({
  data,
  keyPath,
  valueKey,
  title = 'Análise Hierárquica',
  subtitle = 'Clique nos retângulos para explorar',
  altura = 'lg',
  colorScheme = FINANCIAL_COLORS,
  enableDrilldown = true,
  onNodeClick,
  className
}: TreemapDrilldownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [treemapData, setTreemapData] = useState<TreemapData>({ nodes: [], totalValue: 0, maxDepth: 0 });

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip
  } = useTooltip();

  // Processar dados hierárquicos
  useEffect(() => {
    try {
      // Validações de entrada
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('TreemapDrilldown: dados vazios ou inválidos', { data, keyPath, valueKey });
        setTreemapData({ nodes: [], totalValue: 0, maxDepth: keyPath?.length || 0 });
        return;
      }

      if (!keyPath || !Array.isArray(keyPath) || keyPath.length === 0) {
        console.error('TreemapDrilldown: keyPath inválido', { keyPath });
        setTreemapData({ nodes: [], totalValue: 0, maxDepth: 0 });
        return;
      }

      const hierarchicalData = buildHierarchy(data, keyPath, valueKey);
      const totalValue = hierarchicalData.reduce((sum, node) => sum + (node.value || 0), 0);
      
      const processedData: TreemapData = {
        nodes: hierarchicalData,
        totalValue,
        maxDepth: keyPath.length
      };

      setTreemapData(processedData);
    } catch (error) {
      console.error('TreemapDrilldown: erro ao processar dados hierárquicos', error);
      setTreemapData({ nodes: [], totalValue: 0, maxDepth: 0 });
    }
  }, [data, keyPath, valueKey]);

  // Calcular layout do treemap usando algoritmo de squarification
  const calculateTreemapLayout = useCallback((
    nodes: TreemapNode[],
    width: number,
    height: number,
    x = 0,
    y = 0
  ): Array<TreemapNode & { x: number; y: number; width: number; height: number }> => {
    if (!nodes.length) return [];

    const totalValue = nodes.reduce((sum, node) => sum + node.value, 0);
    const area = width * height;

    return squarify(nodes, [], width, height, x, y, totalValue, area);
  }, []);

  // Algoritmo de squarification para layout otimizado
  const squarify = (
    children: TreemapNode[],
    row: TreemapNode[],
    w: number,
    h: number,
    x: number,
    y: number,
    totalValue: number,
    totalArea: number
  ): Array<TreemapNode & { x: number; y: number; width: number; height: number }> => {
    if (!children.length) {
      return layoutRow(row, w, h, x, y, totalValue, totalArea);
    }

    const child = children[0];
    const newRow = [...row, child];
    const remainingChildren = children.slice(1);

    if (row.length === 0 || worst(row, w, h, totalValue, totalArea) >= worst(newRow, w, h, totalValue, totalArea)) {
      return squarify(remainingChildren, newRow, w, h, x, y, totalValue, totalArea);
    } else {
      const laid = layoutRow(row, w, h, x, y, totalValue, totalArea);
      const newX = w > h ? x + laid[0]?.width || 0 : x;
      const newY = w > h ? y : y + laid[0]?.height || 0;
      const newW = w > h ? w - (laid[0]?.width || 0) : w;
      const newH = w > h ? h : h - (laid[0]?.height || 0);
      
      return [
        ...laid,
        ...squarify(children, [], newW, newH, newX, newY, totalValue, totalArea)
      ];
    }
  };

  const layoutRow = (
    row: TreemapNode[],
    w: number,
    h: number,
    x: number,
    y: number,
    totalValue: number,
    totalArea: number
  ) => {
    const rowValue = row.reduce((sum, node) => sum + node.value, 0);
    const rowArea = (rowValue / totalValue) * totalArea;
    
    if (w > h) {
      const rowWidth = rowArea / h;
      let currentY = y;
      
      return row.map(node => {
        const nodeHeight = (node.value / rowValue) * h;
        const result = {
          ...node,
          x,
          y: currentY,
          width: rowWidth,
          height: nodeHeight
        };
        currentY += nodeHeight;
        return result;
      });
    } else {
      const rowHeight = rowArea / w;
      let currentX = x;
      
      return row.map(node => {
        const nodeWidth = (node.value / rowValue) * w;
        const result = {
          ...node,
          x: currentX,
          y,
          width: nodeWidth,
          height: rowHeight
        };
        currentX += nodeWidth;
        return result;
      });
    }
  };

  const worst = (row: TreemapNode[], w: number, h: number, totalValue: number, totalArea: number) => {
    if (!row.length) return Infinity;
    
    const rowValue = row.reduce((sum, node) => sum + node.value, 0);
    const rowArea = (rowValue / totalValue) * totalArea;
    const side = Math.min(w, h);
    
    const min = Math.min(...row.map(node => node.value));
    const max = Math.max(...row.map(node => node.value));
    
    return Math.max(
      (Math.pow(side, 2) * max) / Math.pow(rowArea, 2),
      Math.pow(rowArea, 2) / (Math.pow(side, 2) * min)
    );
  };

  // Filtrar nós baseado no caminho selecionado
  const getVisibleNodes = useCallback(() => {
    if (selectedPath.length === 0) {
      return treemapData.nodes.filter(node => node.level === 0 || !node.level);
    }

    // Navegar até o nível correto
    let currentNodes = treemapData.nodes;
    for (const pathSegment of selectedPath) {
      const parentNode = currentNodes.find(node => node.name === pathSegment);
      if (parentNode?.children) {
        currentNodes = parentNode.children;
      } else {
        break;
      }
    }

    return currentNodes;
  }, [treemapData.nodes, selectedPath]);

  // Handlers
  const handleNodeClick = useCallback((
    node: TreemapNode & { x: number; y: number; width: number; height: number },
    event: React.MouseEvent
  ) => {
    if (onNodeClick) {
      onNodeClick(node);
    }

    if (enableDrilldown && node.children && node.children.length > 0) {
      setSelectedPath(prev => [...prev, node.name]);
      setCurrentLevel(prev => prev + 1);
    }

    // Mostrar tooltip detalhado
    showTooltip({
      title: node.name,
      value: node.value,
      subtitle: `Nível ${currentLevel}`,
      items: [
        {
          label: 'Participação',
          value: (node.value / treemapData.totalValue) * 100,
          format: 'percentage'
        },
        ...(node.children ? [{
          label: 'Subitens',
          value: node.children.length,
          format: 'number'
        }] : []),
        ...(node.metadata ? Object.entries(node.metadata).map(([key, value]) => ({
          label: key,
          value: String(value)
        })) : [])
      ]
    }, event);
  }, [onNodeClick, enableDrilldown, currentLevel, treemapData.totalValue, showTooltip]);

  const handleNodeHover = useCallback((
    node: TreemapNode & { x: number; y: number; width: number; height: number },
    event: React.MouseEvent
  ) => {
    showTooltip({
      title: node.name,
      value: node.value,
      category: title,
      items: [{
        label: 'Participação',
        value: (node.value / treemapData.totalValue) * 100,
        format: 'percentage'
      }]
    }, event);
  }, [title, treemapData.totalValue, showTooltip]);

  const handleBackClick = useCallback(() => {
    if (selectedPath.length > 0) {
      setSelectedPath(prev => prev.slice(0, -1));
      setCurrentLevel(prev => Math.max(0, prev - 1));
    }
  }, [selectedPath]);

  // Renderizar treemap SVG
  const renderTreemap = useCallback(() => {
    if (!containerRef.current) return null;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;
    const padding = 2;

    const visibleNodes = getVisibleNodes();
    const layout = calculateTreemapLayout(visibleNodes, width - padding * 2, height - padding * 2, padding, padding);

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        {layout.map((node, index) => {
          const colorIndex = index % colorScheme.length;
          const color = colorScheme[colorIndex];
          const hasChildren = node.children && node.children.length > 0;
          
          return (
            <g key={`${node.name}-${index}`}>
              {/* Retângulo principal */}
              <rect
                x={node.x}
                y={node.y}
                width={Math.max(0, node.width - 1)}
                height={Math.max(0, node.height - 1)}
                fill={`var(--tremor-brand-${color})`}
                stroke="white"
                strokeWidth={1}
                className={cn(
                  'transition-all duration-200',
                  hasChildren && enableDrilldown && 'cursor-pointer hover:opacity-80'
                )}
                onClick={(e) => handleNodeClick(node, e as any)}
                onMouseEnter={(e) => handleNodeHover(node, e as any)}
                onMouseLeave={hideTooltip}
              />
              
              {/* Texto do nó */}
              {node.width > 50 && node.height > 30 && (
                <foreignObject
                  x={node.x + 4}
                  y={node.y + 4}
                  width={Math.max(0, node.width - 8)}
                  height={Math.max(0, node.height - 8)}
                  className="pointer-events-none"
                >
                  <div className="flex flex-col h-full p-1 text-white text-xs">
                    <div className="font-semibold truncate">
                      {node.name}
                    </div>
                    <div className="text-white/80 truncate">
                      {formatarMoedaCompacta(node.value)}
                    </div>
                    {node.height > 50 && (
                      <div className="text-white/70 text-xs">
                        {formatarPorcentagem((node.value / treemapData.totalValue) * 100)}
                      </div>
                    )}
                    {hasChildren && enableDrilldown && node.height > 70 && (
                      <div className="mt-auto flex items-center text-white/60">
                        <ChevronDown className="h-3 w-3" />
                        <span className="text-xs ml-1">Expandir</span>
                      </div>
                    )}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    );
  }, [
    getVisibleNodes,
    calculateTreemapLayout,
    colorScheme,
    enableDrilldown,
    handleNodeClick,
    handleNodeHover,
    hideTooltip,
    treemapData.totalValue
  ]);

  const currentPath = ['Raiz', ...selectedPath];

  // Renderizar estado vazio quando não há dados
  if (!treemapData.nodes || treemapData.nodes.length === 0) {
    return (
      <div className={cn('relative', className)}>
        <Card className="h-full">
          <Flex className="mb-4" alignItems="center" justifyContent="between">
            <div>
              <Title>{title}</Title>
              {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
            </div>
          </Flex>
          
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <Title className="text-lg text-gray-600 mb-2">Nenhum dado disponível</Title>
            <Text className="text-gray-500">
              Aguardando dados do Supabase ou verifique a conectividade
            </Text>
          </div>
        </Card>
      </div>
    );
  }

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
            {selectedPath.length > 0 && (
              <button
                onClick={handleBackClick}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ChevronUp className="h-3 w-3" />
                Voltar
              </button>
            )}
            
            <Badge color="blue" size="sm">
              Nível {currentLevel}
            </Badge>
          </Flex>
        </Flex>

        {/* Breadcrumb */}
        {currentPath.length > 1 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            {currentPath.map((segment, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                <span className={index === currentPath.length - 1 ? 'font-semibold' : ''}>
                  {segment}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Treemap Container */}
        <div
          ref={containerRef}
          className={cn(
            'w-full bg-gray-50 rounded-lg border',
            altura === 'sm' && 'h-64',
            altura === 'md' && 'h-80',
            altura === 'lg' && 'h-96',
            altura === 'xl' && 'h-[32rem]'
          )}
        >
          {renderTreemap()}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <Text className="text-sm text-gray-500">Total</Text>
            <Text className="font-semibold">{formatarMoedaCompacta(treemapData.totalValue)}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Itens</Text>
            <Text className="font-semibold">{getVisibleNodes().length}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Nível</Text>
            <Text className="font-semibold">{currentLevel} / {treemapData.maxDepth - 1}</Text>
          </div>
        </div>
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
            {tooltipData?.items?.map((item, index) => (
              <Flex key={index} className="text-xs" alignItems="center" justifyContent="between">
                <Text>{item.label}:</Text>
                <Text className="font-medium">{
                  item.format === 'percentage' 
                    ? formatarPorcentagem(Number(item.value))
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

export default TreemapDrilldown;