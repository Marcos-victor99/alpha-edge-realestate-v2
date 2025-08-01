import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, Title, Text, Flex, Badge, Button, Select, SelectItem } from '@tremor/react';
import { Share2, Target, Users, Building2, DollarSign, Zap, Filter } from 'lucide-react';
import { useTooltip } from '@/components/ui/InteractiveTooltip';
import { FINANCIAL_COLORS, SEMANTIC_COLORS, calculateStatistics } from '@/lib/chart-utils';
import { formatarMoedaCompacta, formatarPorcentagem } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Tipos para Network Graph
export interface NetworkNode {
  id: string;
  label: string;
  value: number;
  group: string;
  x?: number;
  y?: number;
  vx?: number; // Velocidade X para simulação
  vy?: number; // Velocidade Y para simulação
  fx?: number; // Posição fixa X
  fy?: number; // Posição fixa Y
  color?: string;
  size?: number;
  type: 'shopping' | 'locatario' | 'fornecedor' | 'categoria';
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  value: number;
  strength?: number; // Força da conexão (0-1)
  color?: string;
  type?: 'transaction' | 'contract' | 'dependency';
  metadata?: Record<string, any>;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters: Record<string, NetworkNode[]>;
}

interface NetworkGraphProps {
  data: any[];
  sourceKey: string;
  targetKey: string;
  valueKey: string;
  groupKey?: string;
  title?: string;
  subtitle?: string;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  enablePhysics?: boolean;
  enableClustering?: boolean;
  enableFiltering?: boolean;
  nodeSize?: 'uniform' | 'proportional';
  edgeWeight?: 'uniform' | 'proportional';
  layoutAlgorithm?: 'force' | 'circular' | 'hierarchical';
  onNodeClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  className?: string;
}

export function NetworkGraph({
  data,
  sourceKey,
  targetKey,
  valueKey,
  groupKey = 'type',
  title = 'Rede de Relacionamentos',
  subtitle = 'Análise de conexões e fluxos',
  altura = 'lg',
  enablePhysics = true,
  enableClustering = true,
  enableFiltering = true,
  nodeSize = 'proportional',
  edgeWeight = 'proportional',
  layoutAlgorithm = 'force',
  onNodeClick,
  onEdgeClick,
  className
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], edges: [], clusters: {} });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    showTooltip,
    hideTooltip
  } = useTooltip();

  // Processar dados para formato de rede
  useEffect(() => {
    const nodeMap = new Map<string, NetworkNode>();
    const edgeMap = new Map<string, NetworkEdge>();

    // Criar nós únicos
    data.forEach((item, index) => {
      const source = String(item[sourceKey]);
      const target = String(item[targetKey]);
      const value = Number(item[valueKey]) || 0;
      const group = String(item[groupKey] || 'default');

      // Adicionar nó source
      if (!nodeMap.has(source)) {
        nodeMap.set(source, {
          id: source,
          label: source,
          value: 0,
          group,
          type: inferNodeType(source),
          color: getNodeColor(inferNodeType(source)),
          metadata: { connections: 0, totalValue: 0 }
        });
      }

      // Adicionar nó target
      if (!nodeMap.has(target)) {
        nodeMap.set(target, {
          id: target,
          label: target,
          value: 0,
          group,
          type: inferNodeType(target),
          color: getNodeColor(inferNodeType(target)),
          metadata: { connections: 0, totalValue: 0 }
        });
      }

      // Atualizar valores dos nós
      const sourceNode = nodeMap.get(source)!;
      const targetNode = nodeMap.get(target)!;
      
      sourceNode.value += value;
      targetNode.value += value;
      sourceNode.metadata!.connections++;
      targetNode.metadata!.connections++;
      sourceNode.metadata!.totalValue += value;
      targetNode.metadata!.totalValue += value;

      // Criar edge
      const edgeId = `${source}-${target}`;
      if (edgeMap.has(edgeId)) {
        const existingEdge = edgeMap.get(edgeId)!;
        existingEdge.value += value;
      } else {
        edgeMap.set(edgeId, {
          id: edgeId,
          source,
          target,
          value,
          type: 'transaction',
          metadata: { transactionCount: 1 }
        });
      }
    });

    const nodes = Array.from(nodeMap.values());
    const edges = Array.from(edgeMap.values());

    // Calcular tamanhos e forças
    const nodeValues = nodes.map(n => n.value);
    const edgeValues = edges.map(e => e.value);
    const nodeStats = calculateStatistics(nodeValues);
    const edgeStats = calculateStatistics(edgeValues);

    // Normalizar tamanhos
    nodes.forEach(node => {
      if (nodeSize === 'proportional') {
        node.size = 5 + ((node.value - nodeStats.min) / (nodeStats.max - nodeStats.min)) * 30;
      } else {
        node.size = 15;
      }
    });

    // Normalizar edges
    edges.forEach(edge => {
      if (edgeWeight === 'proportional') {
        edge.strength = 0.1 + ((edge.value - edgeStats.min) / (edgeStats.max - edgeStats.min)) * 0.9;
      } else {
        edge.strength = 0.5;
      }
      edge.color = getEdgeColor(edge.type || 'transaction');
    });

    // Agrupar por clusters
    const clusters = nodes.reduce((acc, node) => {
      if (!acc[node.group]) acc[node.group] = [];
      acc[node.group].push(node);
      return acc;
    }, {} as Record<string, NetworkNode[]>);

    setNetworkData({ nodes, edges, clusters });
  }, [data, sourceKey, targetKey, valueKey, groupKey, nodeSize, edgeWeight]);

  // Inferir tipo do nó baseado no nome
  const inferNodeType = useCallback((nodeName: string): NetworkNode['type'] => {
    const lower = nodeName.toLowerCase();
    if (lower.includes('shopping') || lower.includes('mall')) return 'shopping';
    if (lower.includes('fornecedor') || lower.includes('supplier')) return 'fornecedor';
    if (lower.includes('categoria') || lower.includes('category')) return 'categoria';
    return 'locatario';
  }, []);

  // Obter cor do nó baseado no tipo
  const getNodeColor = useCallback((type: NetworkNode['type']) => {
    const colorMap = {
      shopping: SEMANTIC_COLORS.info,
      locatario: SEMANTIC_COLORS.positive,
      fornecedor: SEMANTIC_COLORS.warning,
      categoria: SEMANTIC_COLORS.neutral
    };
    return colorMap[type];
  }, []);

  // Obter cor da edge baseado no tipo
  const getEdgeColor = useCallback((type: string) => {
    const colorMap = {
      transaction: '#6B7280',
      contract: '#3B82F6',
      dependency: '#EF4444'
    };
    return colorMap[type] || '#6B7280';
  }, []);

  // Algoritmo de layout force-directed
  const applyForceLayout = useCallback(() => {
    if (!enablePhysics || !networkData.nodes.length) return;

    const width = containerRef.current?.getBoundingClientRect().width || 600;
    const height = containerRef.current?.getBoundingClientRect().height || 400;
    const centerX = width / 2;
    const centerY = height / 2;

    // Inicializar posições se não existirem
    networkData.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) {
        node.x = centerX + (Math.random() - 0.5) * 200;
        node.y = centerY + (Math.random() - 0.5) * 200;
        node.vx = 0;
        node.vy = 0;
      }
    });

    const alpha = 0.3;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Força de repulsão entre nós
      networkData.nodes.forEach((nodeA, indexA) => {
        networkData.nodes.forEach((nodeB, indexB) => {
          if (indexA !== indexB) {
            const dx = nodeB.x! - nodeA.x!;
            const dy = nodeB.y! - nodeA.y!;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const repulsion = 1000 / (distance * distance);
            
            nodeA.vx! -= (dx / distance) * repulsion * alpha;
            nodeA.vy! -= (dy / distance) * repulsion * alpha;
          }
        });
      });

      // Força de atração das edges
      networkData.edges.forEach(edge => {
        const sourceNode = networkData.nodes.find(n => n.id === edge.source);
        const targetNode = networkData.nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!;
          const dy = targetNode.y! - sourceNode.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const attraction = (edge.strength || 0.5) * distance * 0.01;
          
          sourceNode.vx! += (dx / distance) * attraction * alpha;
          sourceNode.vy! += (dy / distance) * attraction * alpha;
          targetNode.vx! -= (dx / distance) * attraction * alpha;
          targetNode.vy! -= (dy / distance) * attraction * alpha;
        }
      });

      // Aplicar velocidades e damping
      networkData.nodes.forEach(node => {
        if (node.fx === undefined && node.fy === undefined) {
          node.x! += node.vx! * alpha;
          node.y! += node.vy! * alpha;
          node.vx! *= 0.9; // Damping
          node.vy! *= 0.9;
          
          // Manter dentro dos limites
          node.x = Math.max(20, Math.min(width - 20, node.x!));
          node.y = Math.max(20, Math.min(height - 20, node.y!));
        }
      });
    }

    setNetworkData({ ...networkData });
  }, [networkData, enablePhysics]);

  // Aplicar layout circular
  const applyCircularLayout = useCallback(() => {
    if (!networkData.nodes.length) return;

    const width = containerRef.current?.getBoundingClientRect().width || 600;
    const height = containerRef.current?.getBoundingClientRect().height || 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    networkData.nodes.forEach((node, index) => {
      const angle = (index / networkData.nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    setNetworkData({ ...networkData });
  }, [networkData]);

  // Aplicar layout hierárquico
  const applyHierarchicalLayout = useCallback(() => {
    if (!networkData.nodes.length) return;

    const width = containerRef.current?.getBoundingClientRect().width || 600;
    const height = containerRef.current?.getBoundingClientRect().height || 400;

    // Agrupar por tipo
    const nodesByType = networkData.nodes.reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = [];
      acc[node.type].push(node);
      return acc;
    }, {} as Record<string, NetworkNode[]>);

    const types = Object.keys(nodesByType);
    const layerHeight = height / (types.length + 1);

    types.forEach((type, typeIndex) => {
      const nodesInType = nodesByType[type];
      const nodeWidth = width / (nodesInType.length + 1);
      
      nodesInType.forEach((node, nodeIndex) => {
        node.x = nodeWidth * (nodeIndex + 1);
        node.y = layerHeight * (typeIndex + 1);
      });
    });

    setNetworkData({ ...networkData });
  }, [networkData]);

  // Aplicar layout baseado no algoritmo selecionado
  useEffect(() => {
    if (!networkData.nodes.length) return;

    switch (layoutAlgorithm) {
      case 'force':
        applyForceLayout();
        break;
      case 'circular':
        applyCircularLayout();
        break;
      case 'hierarchical':
        applyHierarchicalLayout();
        break;
    }
  }, [layoutAlgorithm, networkData.nodes.length]);

  // Handlers
  const handleNodeClick = useCallback((node: NetworkNode, event: React.MouseEvent) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Calcular estatísticas do nó
    const connectedEdges = networkData.edges.filter(e => 
      e.source === node.id || e.target === node.id
    );

    showTooltip({
      title: node.label,
      value: node.value,
      subtitle: `Tipo: ${node.type}`,
      items: [
        {
          label: 'Conexões',
          value: connectedEdges.length,
          format: 'number'
        },
        {
          label: 'Centralidade',
          value: (connectedEdges.length / networkData.edges.length) * 100,
          format: 'percentage'
        },
        {
          label: 'Valor Total',
          value: node.metadata?.totalValue || 0,
          format: 'currency'
        }
      ]
    }, event);
  }, [selectedNode, onNodeClick, networkData.edges, showTooltip]);

  const handleEdgeClick = useCallback((edge: NetworkEdge, event: React.MouseEvent) => {
    setSelectedEdge(edge.id === selectedEdge ? null : edge.id);
    
    if (onEdgeClick) {
      onEdgeClick(edge);
    }

    showTooltip({
      title: `${edge.source} → ${edge.target}`,
      value: edge.value,
      items: [
        {
          label: 'Força da Conexão',
          value: (edge.strength || 0) * 100,
          format: 'percentage'
        },
        {
          label: 'Tipo',
          value: edge.type || 'transaction'
        }
      ]
    }, event);
  }, [selectedEdge, onEdgeClick, showTooltip]);

  // Filtrar dados visíveis
  const visibleNodes = networkData.nodes.filter(node => !filteredGroups.has(node.group));
  const visibleEdges = networkData.edges.filter(edge => {
    const sourceVisible = visibleNodes.some(n => n.id === edge.source);
    const targetVisible = visibleNodes.some(n => n.id === edge.target);
    return sourceVisible && targetVisible;
  });

  // Estatísticas da rede
  const networkStats = useMemo(() => {
    const totalNodes = visibleNodes.length;
    const totalEdges = visibleEdges.length;
    const density = totalNodes > 1 ? (totalEdges / (totalNodes * (totalNodes - 1) / 2)) * 100 : 0;
    const avgConnections = totalNodes > 0 ? totalEdges * 2 / totalNodes : 0;

    return { totalNodes, totalEdges, density, avgConnections };
  }, [visibleNodes, visibleEdges]);

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
              {networkStats.totalNodes} nós
            </Badge>
            <Badge color="green" size="sm">
              {networkStats.totalEdges} conexões
            </Badge>
            <Badge color="purple" size="sm">
              {networkStats.density.toFixed(1)}% densidade
            </Badge>
          </Flex>
        </Flex>

        {/* Controls */}
        <Flex className="mb-4 gap-4">
          <div>
            <Text className="text-xs text-gray-500 mb-1">Layout</Text>
            <Select value={layoutAlgorithm} onValueChange={(value) => {
              setNetworkData(prev => ({ ...prev }));
            }}>
              <SelectItem value="force">Força</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="hierarchical">Hierárquico</SelectItem>
            </Select>
          </div>

          <div>
            <Text className="text-xs text-gray-500 mb-1">Tamanho dos Nós</Text>
            <Select value={nodeSize} onValueChange={(value) => {
              // Reprocessar tamanhos quando mudar
            }}>
              <SelectItem value="uniform">Uniforme</SelectItem>
              <SelectItem value="proportional">Proporcional</SelectItem>
            </Select>
          </div>

          {enableFiltering && (
            <div className="flex gap-2">
              <Text className="text-xs text-gray-500 self-end mb-1">Filtros:</Text>
              {Object.keys(networkData.clusters).map(group => (
                <Button
                  key={group}
                  size="xs"
                  variant={filteredGroups.has(group) ? "secondary" : "primary"}
                  onClick={() => {
                    setFilteredGroups(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(group)) {
                        newSet.delete(group);
                      } else {
                        newSet.add(group);
                      }
                      return newSet;
                    });
                  }}
                >
                  {group}
                </Button>
              ))}
            </div>
          )}
        </Flex>

        {/* Network Graph */}
        <div
          ref={containerRef}
          className={cn(
            'w-full bg-gray-50 rounded-lg border overflow-hidden relative',
            altura === 'sm' && 'h-64',
            altura === 'md' && 'h-80',
            altura === 'lg' && 'h-96',
            altura === 'xl' && 'h-[32rem]'
          )}
        >
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Renderizar edges */}
            {visibleEdges.map((edge, index) => {
              const sourceNode = visibleNodes.find(n => n.id === edge.source);
              const targetNode = visibleNodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;

              const isSelected = selectedEdge === edge.id;
              const strokeWidth = edgeWeight === 'proportional' 
                ? 1 + (edge.strength || 0) * 5 
                : 2;

              return (
                <line
                  key={`edge-${index}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isSelected ? '#3B82F6' : edge.color}
                  strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                  opacity={isSelected ? 1 : 0.6}
                  className={cn(
                    'transition-all duration-200',
                    'cursor-pointer hover:opacity-80'
                  )}
                  onClick={(e) => handleEdgeClick(edge, e as any)}
                  onMouseEnter={(e) => handleEdgeClick(edge, e as any)}
                  onMouseLeave={hideTooltip}
                />
              );
            })}

            {/* Renderizar nodes */}
            {visibleNodes.map((node, index) => {
              const isSelected = selectedNode === node.id;
              const radius = node.size || 10;

              return (
                <g key={`node-${index}`}>
                  {/* Círculo do nó */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={`var(--tremor-brand-${node.color})`}
                    stroke={isSelected ? '#3B82F6' : 'white'}
                    strokeWidth={isSelected ? 4 : 2}
                    className={cn(
                      'transition-all duration-200',
                      'cursor-pointer hover:brightness-110'
                    )}
                    onClick={(e) => handleNodeClick(node, e as any)}
                    onMouseEnter={(e) => handleNodeClick(node, e as any)}
                    onMouseLeave={hideTooltip}
                  />
                  
                  {/* Label do nó */}
                  {radius > 15 && (
                    <text
                      x={node.x}
                      y={node.y! + radius + 12}
                      textAnchor="middle"
                      className="text-xs fill-gray-700 font-medium pointer-events-none"
                    >
                      {node.label.length > 10 ? `${node.label.substring(0, 10)}...` : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Estatísticas da Rede */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Text className="text-sm text-gray-500">Nós</Text>
            <Text className="font-semibold">{networkStats.totalNodes}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Conexões</Text>
            <Text className="font-semibold">{networkStats.totalEdges}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Densidade</Text>
            <Text className="font-semibold">{networkStats.density.toFixed(1)}%</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-500">Conexões Médias</Text>
            <Text className="font-semibold">{networkStats.avgConnections.toFixed(1)}</Text>
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

export default NetworkGraph;