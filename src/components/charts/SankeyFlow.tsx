import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, Title, Text, Flex, Badge, Button } from '@tremor/react';
import { ArrowRight, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useTooltip } from '@/components/ui/InteractiveTooltip';
import { buildSankeyData, SEMANTIC_COLORS } from '@/lib/chart-utils';
import { formatarMoedaCompacta, formatarPorcentagem } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Tipos para Sankey
export interface SankeyNode {
  id: string;
  name: string;
  value: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  type?: 'source' | 'target' | 'intermediate';
  metadata?: Record<string, any>;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalFlow: number;
}

interface SankeyFlowProps {
  data: any[];
  sourceKey: string;
  targetKey: string;
  valueKey: string;
  title?: string;
  subtitle?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  nodeWidth?: number;
  nodePadding?: number;
  linkOpacity?: number;
  enableInteraction?: boolean;
  colorScheme?: Record<string, string>;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
  className?: string;
}

export function SankeyFlow({
  data,
  sourceKey,
  targetKey,
  valueKey,
  title = 'Fluxo Financeiro',
  subtitle = 'Visualização de entradas e saídas',
  altura = 'lg',
  nodeWidth = 20,
  nodePadding = 40,
  linkOpacity = 0.6,
  enableInteraction = true,
  colorScheme = {
    receitas: SEMANTIC_COLORS.positive,
    despesas: SEMANTIC_COLORS.negative,
    noi: SEMANTIC_COLORS.info,
    default: SEMANTIC_COLORS.neutral
  },
  onNodeClick,
  onLinkClick,
  className
}: SankeyFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sankeyData, setSankeyData] = useState<SankeyData>({ nodes: [], links: [], totalFlow: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<{ source: string; target: string } | null>(null);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip
  } = useTooltip();

  // Processar dados para formato Sankey
  useEffect(() => {
    const sankeyRaw = buildSankeyData(data, sourceKey, targetKey, valueKey);
    
    // Criar nós com metadados
    const nodes: SankeyNode[] = sankeyRaw.nodes.map((nodeName, index) => {
      const nodeData = data.filter(item => 
        item[sourceKey] === nodeName || item[targetKey] === nodeName
      );
      
      const totalValue = nodeData.reduce((sum, item) => 
        sum + (Number(item[valueKey]) || 0), 0
      );

      // Determinar tipo do nó
      const isSource = sankeyRaw.links.some(link => link.source === nodeName);
      const isTarget = sankeyRaw.links.some(link => link.target === nodeName);
      const type = isSource && !isTarget ? 'source' : 
                   !isSource && isTarget ? 'target' : 'intermediate';

      return {
        id: nodeName,
        name: nodeName,
        value: totalValue,
        type,
        color: getNodeColor(nodeName, type),
        metadata: {
          transactionCount: nodeData.length,
          avgValue: totalValue / nodeData.length,
          type
        }
      };
    });

    // Criar links
    const links: SankeyLink[] = sankeyRaw.links.map(link => ({
      source: link.source,
      target: link.target,
      value: link.value,
      color: getNodeColor(link.source, 'source'),
      metadata: {
        percentage: 0 // Será calculado depois
      }
    }));

    const totalFlow = links.reduce((sum, link) => sum + link.value, 0);

    // Calcular percentuais
    links.forEach(link => {
      if (link.metadata) {
        link.metadata.percentage = (link.value / totalFlow) * 100;
      }
    });

    setSankeyData({ nodes, links, totalFlow });
  }, [data, sourceKey, targetKey, valueKey]);

  // Função para determinar cor do nó
  const getNodeColor = useCallback((nodeName: string, type: 'source' | 'target' | 'intermediate') => {
    const lowerName = nodeName.toLowerCase();
    
    if (lowerName.includes('receita') || lowerName.includes('faturamento')) {
      return colorScheme.receitas || SEMANTIC_COLORS.positive;
    }
    if (lowerName.includes('despesa') || lowerName.includes('custo')) {
      return colorScheme.despesas || SEMANTIC_COLORS.negative;
    }
    if (lowerName.includes('noi') || lowerName.includes('lucro')) {
      return colorScheme.noi || SEMANTIC_COLORS.info;
    }
    
    return colorScheme.default || SEMANTIC_COLORS.neutral;
  }, [colorScheme]);

  // Calcular layout do Sankey
  const layout = useMemo(() => {
    if (!containerRef.current || sankeyData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;
    const margin = { top: 20, right: 40, bottom: 20, left: 40 };

    const effectiveWidth = width - margin.left - margin.right;
    const effectiveHeight = height - margin.top - margin.bottom;

    // Agrupar nós por coluna (source, intermediate, target)
    const sourceNodes = sankeyData.nodes.filter(n => n.type === 'source');
    const targetNodes = sankeyData.nodes.filter(n => n.type === 'target');
    const intermediateNodes = sankeyData.nodes.filter(n => n.type === 'intermediate');

    const columns = [sourceNodes, intermediateNodes, targetNodes].filter(col => col.length > 0);
    const columnWidth = effectiveWidth / Math.max(1, columns.length - 1);

    // Posicionar nós
    const positionedNodes = sankeyData.nodes.map(node => {
      let columnIndex = 0;
      if (node.type === 'intermediate') columnIndex = 1;
      if (node.type === 'target') columnIndex = columns.length - 1;

      const nodesInColumn = columns[columnIndex] || [];
      const nodeIndex = nodesInColumn.findIndex(n => n.id === node.id);
      const nodeHeight = Math.max(20, (node.value / sankeyData.totalFlow) * effectiveHeight * 0.8);
      
      const totalColumnHeight = nodesInColumn.reduce((sum, n) => 
        sum + Math.max(20, (n.value / sankeyData.totalFlow) * effectiveHeight * 0.8), 0
      );
      
      const spacing = (effectiveHeight - totalColumnHeight) / (nodesInColumn.length + 1);
      const y = margin.top + spacing * (nodeIndex + 1) + 
                 nodesInColumn.slice(0, nodeIndex).reduce((sum, n) => 
                   sum + Math.max(20, (n.value / sankeyData.totalFlow) * effectiveHeight * 0.8), 0
                 );

      return {
        ...node,
        x: margin.left + columnIndex * columnWidth,
        y,
        width: nodeWidth,
        height: nodeHeight
      };
    });

    // Calcular caminhos dos links
    const positionedLinks = sankeyData.links.map(link => {
      const sourceNode = positionedNodes.find(n => n.id === link.source);
      const targetNode = positionedNodes.find(n => n.id === link.target);

      if (!sourceNode || !targetNode) return null;

      const linkHeight = Math.max(2, (link.value / sankeyData.totalFlow) * effectiveHeight * 0.6);

      return {
        ...link,
        sourceX: sourceNode.x! + sourceNode.width!,
        sourceY: sourceNode.y! + sourceNode.height! / 2,
        targetX: targetNode.x!,
        targetY: targetNode.y! + targetNode.height! / 2,
        height: linkHeight
      };
    }).filter(Boolean);

    return { nodes: positionedNodes, links: positionedLinks };
  }, [sankeyData, nodeWidth]);

  // Handlers
  const handleNodeClick = useCallback((node: SankeyNode, event: React.MouseEvent) => {
    if (!enableInteraction) return;

    setSelectedNode(node.id === selectedNode ? null : node.id);
    
    if (onNodeClick) {
      onNodeClick(node);
    }

    showTooltip({
      title: node.name,
      value: node.value,
      subtitle: `Tipo: ${node.type}`,
      items: [
        {
          label: 'Participação',
          value: (node.value / sankeyData.totalFlow) * 100,
          format: 'percentage'
        },
        {
          label: 'Transações',
          value: node.metadata?.transactionCount || 0,
          format: 'number'
        },
        {
          label: 'Valor Médio',
          value: node.metadata?.avgValue || 0,
          format: 'currency'
        }
      ]
    }, event);
  }, [enableInteraction, selectedNode, onNodeClick, sankeyData.totalFlow, showTooltip]);

  const handleLinkClick = useCallback((link: any, event: React.MouseEvent) => {
    if (!enableInteraction) return;

    setSelectedLink(
      selectedLink?.source === link.source && selectedLink?.target === link.target
        ? null
        : { source: link.source, target: link.target }
    );

    if (onLinkClick) {
      onLinkClick(link);
    }

    showTooltip({
      title: `${link.source} → ${link.target}`,
      value: link.value,
      items: [
        {
          label: 'Percentual do Total',
          value: link.metadata?.percentage || 0,
          format: 'percentage'
        }
      ]
    }, event);
  }, [enableInteraction, selectedLink, onLinkClick, showTooltip]);

  const toggleNodeVisibility = useCallback((nodeId: string) => {
    setHiddenNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Filtrar dados visíveis
  const visibleNodes = layout.nodes.filter(node => !hiddenNodes.has(node.id));
  const visibleLinks = layout.links.filter(link => 
    !hiddenNodes.has(link.source) && !hiddenNodes.has(link.target)
  );

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
              {formatarMoedaCompacta(sankeyData.totalFlow)}
            </Badge>
            <Badge color="gray" size="sm">
              {sankeyData.nodes.length} nós
            </Badge>
          </Flex>
        </Flex>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          {sankeyData.nodes.map(node => (
            <Button
              key={node.id}
              size="xs"
              variant="secondary"
              icon={hiddenNodes.has(node.id) ? EyeOff : Eye}
              onClick={() => toggleNodeVisibility(node.id)}
              className={cn(
                'text-xs',
                hiddenNodes.has(node.id) && 'opacity-50'
              )}
            >
              {node.name}
            </Button>
          ))}
        </div>

        {/* Sankey Diagram */}
        <div
          ref={containerRef}
          className={cn(
            'w-full bg-gray-50 rounded-lg border overflow-hidden',
            altura === 'sm' && 'h-64',
            altura === 'md' && 'h-80',
            altura === 'lg' && 'h-96',
            altura === 'xl' && 'h-[32rem]'
          )}
        >
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Definir gradientes */}
            <defs>
              {visibleLinks.map((link, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`gradient-${link.source}-${link.target}`}
                  x1="0%" y1="0%" x2="100%" y2="0%"
                >
                  <stop offset="0%" stopColor={`var(--tremor-brand-${link.color})`} />
                  <stop offset="100%" stopColor={`var(--tremor-brand-${link.color})`} stopOpacity="0.5" />
                </linearGradient>
              ))}
            </defs>

            {/* Renderizar links */}
            {visibleLinks.map((link, index) => {
              const isSelected = selectedLink?.source === link.source && 
                                selectedLink?.target === link.target;
              const path = `M${link.sourceX},${link.sourceY} 
                           C${(link.sourceX + link.targetX) / 2},${link.sourceY} 
                           ${(link.sourceX + link.targetX) / 2},${link.targetY} 
                           ${link.targetX},${link.targetY}`;

              return (
                <path
                  key={`link-${index}`}
                  d={path}
                  stroke={`url(#gradient-${link.source}-${link.target})`}
                  strokeWidth={link.height}
                  fill="none"
                  opacity={isSelected ? 1 : linkOpacity}
                  className={cn(
                    'transition-all duration-200',
                    enableInteraction && 'cursor-pointer hover:opacity-80'
                  )}
                  onClick={(e) => handleLinkClick(link, e)}
                  onMouseEnter={(e) => handleLinkClick(link, e)}
                  onMouseLeave={hideTooltip}
                />
              );
            })}

            {/* Renderizar nós */}
            {visibleNodes.map((node, index) => {
              const isSelected = selectedNode === node.id;
              
              return (
                <g key={`node-${index}`}>
                  {/* Retângulo do nó */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    fill={`var(--tremor-brand-${node.color})`}
                    stroke={isSelected ? '#3B82F6' : 'white'}
                    strokeWidth={isSelected ? 3 : 1}
                    className={cn(
                      'transition-all duration-200',
                      enableInteraction && 'cursor-pointer hover:brightness-110'
                    )}
                    onClick={(e) => handleNodeClick(node, e)}
                    onMouseEnter={(e) => handleNodeClick(node, e)}
                    onMouseLeave={hideTooltip}
                  />
                  
                  {/* Label do nó */}
                  <text
                    x={node.x! + node.width! + 8}
                    y={node.y! + node.height! / 2}
                    dy="0.35em"
                    className="text-xs fill-gray-700 font-medium"
                    textAnchor="start"
                  >
                    {node.name}
                  </text>
                  
                  {/* Valor do nó */}
                  <text
                    x={node.x! + node.width! + 8}
                    y={node.y! + node.height! / 2 + 12}
                    dy="0.35em"
                    className="text-xs fill-gray-500"
                    textAnchor="start"
                  >
                    {formatarMoedaCompacta(node.value)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Text className="text-sm text-gray-500">Total de Fluxo</Text>
            <Text className="font-semibold">{formatarMoedaCompacta(sankeyData.totalFlow)}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Nós Ativos</Text>
            <Text className="font-semibold">{visibleNodes.length} / {sankeyData.nodes.length}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Conexões</Text>
            <Text className="font-semibold">{visibleLinks.length}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Eficiência</Text>
            <Text className="font-semibold">
              {formatarPorcentagem((visibleLinks.reduce((sum, link) => sum + link.value, 0) / sankeyData.totalFlow) * 100)}
            </Text>
          </div>
        </div>
      </Card>

      {/* Tooltip renderizado externamente */}
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

export default SankeyFlow;