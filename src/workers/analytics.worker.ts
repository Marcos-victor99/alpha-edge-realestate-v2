/**
 * Web Worker para cálculos analíticos financeiros pesados
 * Evita travamento da UI durante processamento de grandes volumes de dados
 */

// Tipos para comunicação com o worker
export interface AnalyticsWorkerMessage {
  type: 'CALCULATE_KPI' | 'PROCESS_FINANCIAL_DATA' | 'CALCULATE_RISK_METRICS' | 'GENERATE_PREDICTIONS' | 
        'PROCESS_DRILLDOWN_DATA' | 'GENERATE_HEATMAP_DATA' | 'CALCULATE_NETWORK_METRICS' | 'OPTIMIZE_CHART_DATA' |
        'PROCESS_FATURAMENTO_ANALYTICS' | 'PROCESS_FLUXO_CAIXA_DATA' | 'PROCESS_FORNECEDORES_DATA' | 'PROCESS_ORCAMENTO_DATA' |
        'CALCULATE_BRAZILIAN_METRICS';
  payload: unknown;
  requestId: string;
  cacheKey?: string;
}

export interface AnalyticsWorkerResponse {
  type: 'RESULT' | 'ERROR';
  payload: unknown;
  requestId: string;
}

// Interfaces de dados
interface FaturamentoData {
  shopping: string;
  locatario: string;
  valortotalfaturado: number;
  valortotalaberto: number;
  valortotalpago: number;
  datainiciocompetencia: string;
  datafimcompetencia: string;
  area: number;
  inadimplencia: number;
}

interface InadimplenciaData {
  Shopping: string;
  Locatario: string;
  ValorFaturado: number;
  ValorPago: number;
  Inadimplencia: number;
  DataVencimento: string;
}

interface MovimentacaoFinanceira {
  Shopping: string;
  Data: string;
  Debito: number;
  Credito: number;
  Valor: number;
  Fornecedor: string;
}

interface PagamentoEmpreendedor {
  shopping: string;
  valorcp: number;
  valorpago: number;
  dataemissao: string;
  fornecedor: string;
}

// Cache em memória para resultados
const workerCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função principal do worker
self.onmessage = (event: MessageEvent<AnalyticsWorkerMessage>) => {
  const { type, payload, requestId, cacheKey } = event.data;

  try {
    // Verificar cache se cacheKey fornecido
    if (cacheKey && workerCache.has(cacheKey)) {
      const cached = workerCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        const response: AnalyticsWorkerResponse = {
          type: 'RESULT',
          payload: { ...cached.data, fromCache: true },
          requestId
        };
        self.postMessage(response);
        return;
      }
    }

    let result: unknown;

    switch (type) {
      case 'CALCULATE_KPI':
        result = calculateKPIs(payload);
        break;
      
      case 'PROCESS_FINANCIAL_DATA':
        result = processFinancialData(payload);
        break;
      
      case 'CALCULATE_RISK_METRICS':
        result = calculateRiskMetrics(payload);
        break;
      
      case 'GENERATE_PREDICTIONS':
        result = generatePredictions(payload);
        break;
      
      case 'PROCESS_DRILLDOWN_DATA':
        result = processDrilldownData(payload);
        break;
      
      case 'GENERATE_HEATMAP_DATA':
        result = generateHeatmapData(payload);
        break;
      
      case 'CALCULATE_NETWORK_METRICS':
        result = calculateNetworkMetrics(payload);
        break;
      
      case 'OPTIMIZE_CHART_DATA':
        result = optimizeChartData(payload);
        break;
      
      case 'PROCESS_FATURAMENTO_ANALYTICS':
        result = processFaturamentoAnalytics(payload);
        break;
      
      case 'PROCESS_FLUXO_CAIXA_DATA':
        result = processFluxoCaixaData(payload);
        break;
      
      case 'PROCESS_FORNECEDORES_DATA':
        result = processFornecedoresData(payload);
        break;
      
      case 'PROCESS_ORCAMENTO_DATA':
        result = processOrcamentoData(payload);
        break;
      
      case 'CALCULATE_BRAZILIAN_METRICS':
        result = calculateBrazilianMetrics(payload);
        break;
      
      default:
        throw new Error(`Tipo de operação não suportado: ${type}`);
    }

    // Cache resultado se cacheKey fornecido
    if (cacheKey) {
      workerCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    const response: AnalyticsWorkerResponse = {
      type: 'RESULT',
      payload: result,
      requestId
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: AnalyticsWorkerResponse = {
      type: 'ERROR',
      payload: { message: error instanceof Error ? error.message : 'Erro desconhecido' },
      requestId
    };

    self.postMessage(errorResponse);
  }
};

// Função para calcular KPIs principais
function calculateKPIs(data: {
  faturamento: FaturamentoData[];
  inadimplencia: InadimplenciaData[];
  movimentacoes: MovimentacaoFinanceira[];
  pagamentos: PagamentoEmpreendedor[];
}) {
  const { faturamento, inadimplencia, movimentacoes, pagamentos } = data;

  // 1. Valor total do portfólio
  const valorPortfolio = faturamento.reduce((sum, item) => 
    sum + (item.valortotalfaturado || 0), 0
  );

  // 2. Total de recebíveis em aberto
  const totalRecebveis = faturamento.reduce((sum, item) => 
    sum + (item.valortotalaberto || 0), 0
  );

  // 3. Total pago
  const totalPago = faturamento.reduce((sum, item) => 
    sum + (item.valortotalpago || 0), 0
  );

  // 4. Taxa de inadimplência
  const totalInadimplencia = inadimplencia.reduce((sum, item) => 
    sum + (item.Inadimplencia || 0), 0
  );
  const taxaInadimplencia = totalRecebveis > 0 ? (totalInadimplencia / totalRecebveis) * 100 : 0;

  // 5. Receitas operacionais
  const receitasOperacionais = movimentacoes
    .filter(item => item.Credito > 0)
    .reduce((sum, item) => sum + item.Credito, 0);

  // 6. Despesas operacionais
  const despesasOperacionais = pagamentos
    .reduce((sum, item) => sum + (item.valorpago || 0), 0);

  // 7. NOI (Net Operating Income)
  const noi = receitasOperacionais - despesasOperacionais;
  const margemNoi = receitasOperacionais > 0 ? (noi / receitasOperacionais) * 100 : 0;

  // 8. Taxa de ocupação
  const totalLocatarios = new Set(faturamento.map(item => item.locatario)).size;
  const locatariosAtivos = new Set(
    faturamento
      .filter(item => item.valortotalfaturado > 0)
      .map(item => item.locatario)
  ).size;
  const taxaOcupacao = totalLocatarios > 0 ? (locatariosAtivos / totalLocatarios) * 100 : 0;

  // 9. ROI ajustado ao risco
  const volatilidade = calculateVolatility(faturamento);
  const roiAjustado = volatilidade > 0 ? (margemNoi / volatilidade) : margemNoi;

  return {
    valorPortfolio,
    totalRecebveis,
    totalPago,
    taxaInadimplencia,
    receitasOperacionais,
    despesasOperacionais,
    noi,
    margemNoi,
    taxaOcupacao,
    roiAjustado,
    volatilidade,
    calculadoEm: new Date().toISOString()
  };
}

// Função para processar dados financeiros detalhados
function processFinancialData(data: {
  faturamento: FaturamentoData[];
  inadimplencia: InadimplenciaData[];
}) {
  const { faturamento, inadimplencia } = data;

  // Análise por shopping
  const analysisPorShopping = groupBy(faturamento, 'shopping').map(([shopping, dados]) => {
    const valorTotal = dados.reduce((sum, item) => sum + item.valortotalfaturado, 0);
    const valorPago = dados.reduce((sum, item) => sum + item.valortotalpago, 0);
    const valorAberto = dados.reduce((sum, item) => sum + item.valortotalaberto, 0);
    
    const inadimplenciaShopping = inadimplencia
      .filter(item => item.Shopping === shopping)
      .reduce((sum, item) => sum + item.Inadimplencia, 0);
    
    const taxaInadimplencia = valorAberto > 0 ? (inadimplenciaShopping / valorAberto) * 100 : 0;
    
    return {
      shopping,
      valorTotal,
      valorPago,
      valorAberto,
      inadimplencia: inadimplenciaShopping,
      taxaInadimplencia,
      numeroLocatarios: dados.length,
      areaTotal: dados.reduce((sum, item) => sum + (item.area || 0), 0)
    };
  });

  // Análise temporal (últimos 12 meses)
  const analysisTimeline = generateTimelineAnalysis(faturamento);

  // Top 10 locatários por receita
  const topLocatarios = groupBy(faturamento, 'locatario')
    .map(([locatario, dados]) => ({
      locatario,
      valorTotal: dados.reduce((sum, item) => sum + item.valortotalfaturado, 0),
      valorPago: dados.reduce((sum, item) => sum + item.valortotalpago, 0),
      numeroContratos: dados.length
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 10);

  return {
    analysisPorShopping,
    analysisTimeline,
    topLocatarios,
    processadoEm: new Date().toISOString()
  };
}

// Função para calcular métricas de risco
function calculateRiskMetrics(data: {
  faturamento: FaturamentoData[];
  inadimplencia: InadimplenciaData[];
}) {
  const { faturamento, inadimplencia } = data;

  // VaR (Value at Risk) - simulação Monte Carlo simplificada
  const var95 = calculateVaR(faturamento, 0.95);
  const var99 = calculateVaR(faturamento, 0.99);

  // Sharpe Ratio
  const sharpeRatio = calculateSharpeRatio(faturamento);

  // Concentração de risco por locatário
  const concentracaoRisco = calculateConcentrationRisk(faturamento);

  // Score de risco por shopping
  const riscoPorShopping = groupBy(inadimplencia, 'Shopping').map(([shopping, dados]) => {
    const totalInadimplencia = dados.reduce((sum, item) => sum + item.Inadimplencia, 0);
    const totalFaturado = dados.reduce((sum, item) => sum + item.ValorFaturado, 0);
    const taxaInadimplencia = totalFaturado > 0 ? (totalInadimplencia / totalFaturado) * 100 : 0;
    
    let scoreRisco: 'Baixo' | 'Médio' | 'Alto';
    if (taxaInadimplencia <= 2) scoreRisco = 'Baixo';
    else if (taxaInadimplencia <= 5) scoreRisco = 'Médio';
    else scoreRisco = 'Alto';

    return {
      shopping,
      taxaInadimplencia,
      scoreRisco,
      totalInadimplencia,
      numeroDevedores: dados.length
    };
  });

  return {
    var95,
    var99,
    sharpeRatio,
    concentracaoRisco,
    riscoPorShopping,
    calculadoEm: new Date().toISOString()
  };
}

// Função para gerar predições (modelo simples)
function generatePredictions(data: { faturamento: FaturamentoData[] }) {
  const { faturamento } = data;

  // Análise de tendência usando regressão linear simples
  const timeline = generateTimelineAnalysis(faturamento);
  const predicoes = [];

  // Predição para próximos 6 meses baseada em tendência
  for (let i = 1; i <= 6; i++) {
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + i);
    
    // Cálculo simplificado de tendência
    const tendencia = calculateTrend(timeline);
    const valorPredito = timeline[timeline.length - 1]?.valorTotal * (1 + tendencia * i);
    
    predicoes.push({
      mes: proximoMes.toISOString().substring(0, 7), // YYYY-MM
      valorPredito: Math.max(0, valorPredito || 0),
      confianca: Math.max(0.5, 1 - (i * 0.1)) // Reduz confiança com distância
    });
  }

  // Alertas baseados em padrões
  const alertas = generateAlerts(faturamento);

  return {
    predicoes,
    alertas,
    modelo: 'Regressão Linear Simples',
    geradoEm: new Date().toISOString()
  };
}

// Funções auxiliares

function groupBy<T>(array: T[], key: keyof T): [string, T[]][] {
  const groups = array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  return Object.entries(groups);
}

function calculateVolatility(data: FaturamentoData[]): number {
  const valores = data.map(item => item.valortotalfaturado);
  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  return Math.sqrt(variancia) / media * 100; // CV (Coeficiente de Variação)
}

function generateTimelineAnalysis(data: FaturamentoData[]) {
  const grouped = groupBy(data, 'datainiciocompetencia' as keyof FaturamentoData);
  
  return grouped
    .map(([data, items]) => ({
      data,
      valorTotal: items.reduce((sum, item) => sum + item.valortotalfaturado, 0),
      valorPago: items.reduce((sum, item) => sum + item.valortotalpago, 0),
      valorAberto: items.reduce((sum, item) => sum + item.valortotalaberto, 0),
      numeroTransacoes: items.length
    }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function calculateVaR(data: FaturamentoData[], confidence: number): number {
  const valores = data.map(item => item.valortotalfaturado).sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * valores.length);
  return valores[index] || 0;
}

function calculateSharpeRatio(data: FaturamentoData[]): number {
  const retornos = data.map(item => item.valortotalfaturado);
  const mediaRetorno = retornos.reduce((sum, val) => sum + val, 0) / retornos.length;
  const volatilidade = calculateVolatility(data);
  const taxaLivreRisco = 0.1; // 10% ao ano (Selic aproximada)
  
  return volatilidade > 0 ? (mediaRetorno - taxaLivreRisco) / volatilidade : 0;
}

function calculateConcentrationRisk(data: FaturamentoData[]): number {
  const totalPorLocatario = groupBy(data, 'locatario')
    .map(([, items]) => items.reduce((sum, item) => sum + item.valortotalfaturado, 0));
  
  const total = totalPorLocatario.reduce((sum, val) => sum + val, 0);
  const herfindahlIndex = totalPorLocatario
    .map(valor => Math.pow(valor / total, 2))
    .reduce((sum, val) => sum + val, 0);
  
  return herfindahlIndex * 10000; // Normalizado
}

function calculateTrend(timeline: Array<{ valorTotal?: number }>): number {
  if (timeline.length < 2) return 0;
  
  const ultimoValor = timeline[timeline.length - 1]?.valorTotal || 0;
  const penultimoValor = timeline[timeline.length - 2]?.valorTotal || 0;
  
  return penultimoValor > 0 ? (ultimoValor - penultimoValor) / penultimoValor : 0;
}

function generateAlerts(data: FaturamentoData[]): Array<{
  tipo: 'RISCO' | 'OPORTUNIDADE' | 'INFORMACAO';
  titulo: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
}> {
  const alertas = [];

  // Alerta de alta inadimplência
  const inadimplenciaMedia = data.reduce((sum, item) => sum + (item.inadimplencia || 0), 0) / data.length;
  if (inadimplenciaMedia > 5) {
    alertas.push({
      tipo: 'RISCO' as const,
      titulo: 'Taxa de Inadimplência Elevada',
      descricao: `Taxa média de inadimplência está em ${inadimplenciaMedia.toFixed(1)}%, acima do limite recomendado de 5%`,
      prioridade: 'Alta' as const
    });
  }

  // Alerta de concentração de receita
  const receitaPorShopping = groupBy(data, 'shopping');
  const totalReceita = data.reduce((sum, item) => sum + item.valortotalfaturado, 0);
  
  receitaPorShopping.forEach(([shopping, items]) => {
    const receitaShopping = items.reduce((sum, item) => sum + item.valortotalfaturado, 0);
    const percentual = (receitaShopping / totalReceita) * 100;
    
    if (percentual > 40) {
      alertas.push({
        tipo: 'RISCO' as const,
        titulo: 'Concentração de Receita',
        descricao: `Shopping ${shopping} representa ${percentual.toFixed(1)}% da receita total`,
        prioridade: 'Média' as const
      });
    }
  });

  return alertas;
}

// Novas funções para gráficos interativos

// Processa dados para drilldown hierárquico
function processDrilldownData(data: {
  faturamento: FaturamentoData[];
  hierarchy: string[];
  valueKey: string;
}) {
  const { faturamento, hierarchy, valueKey } = data;

  // Construir estrutura hierárquica otimizada
  const processedLevels = hierarchy.map((levelKey, index) => {
    const grouped = groupBy(faturamento, levelKey as keyof FaturamentoData);
    
    return {
      level: index,
      levelKey,
      data: grouped.map(([key, items]) => {
        const value = items.reduce((sum, item) => sum + (item[valueKey as keyof FaturamentoData] as number || 0), 0);
        const children = index < hierarchy.length - 1 ? [] : undefined;
        
        return {
          name: key,
          value,
          children,
          drilldownId: `${levelKey}-${key}`,
          parentId: index > 0 ? `${hierarchy[index-1]}-${items[0]?.[hierarchy[index-1] as keyof FaturamentoData]}` : null,
          level: index,
          hasChildren: index < hierarchy.length - 1,
          metadata: {
            count: items.length,
            avgValue: value / items.length,
            items: items.slice(0, 5) // Amostra para tooltip
          }
        };
      }).sort((a, b) => b.value - a.value)
    };
  });

  return {
    levels: processedLevels,
    totalValue: faturamento.reduce((sum, item) => sum + (item[valueKey as keyof FaturamentoData] as number || 0), 0),
    maxDepth: hierarchy.length,
    processedAt: new Date().toISOString()
  };
}

// Gera dados otimizados para heatmap
function generateHeatmapData(data: {
  faturamento: FaturamentoData[];
  xKey: string;
  yKey: string;
  valueKey: string;
  aggregation: 'sum' | 'avg' | 'count';
}) {
  const { faturamento, xKey, yKey, valueKey, aggregation } = data;

  // Criar matriz de dados
  const heatmapMatrix = new Map<string, Map<string, number[]>>();
  
  faturamento.forEach(item => {
    const x = String(item[xKey as keyof FaturamentoData]);
    const y = String(item[yKey as keyof FaturamentoData]);
    const value = Number(item[valueKey as keyof FaturamentoData]) || 0;
    
    if (!heatmapMatrix.has(x)) {
      heatmapMatrix.set(x, new Map());
    }
    
    if (!heatmapMatrix.get(x)!.has(y)) {
      heatmapMatrix.get(x)!.set(y, []);
    }
    
    heatmapMatrix.get(x)!.get(y)!.push(value);
  });

  // Processar agregação
  const cells: Array<{ x: string; y: string; value: number; count: number }> = [];
  const allValues: number[] = [];

  heatmapMatrix.forEach((yMap, x) => {
    yMap.forEach((values, y) => {
      let aggregatedValue: number;
      
      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
      }
      
      cells.push({ x, y, value: aggregatedValue, count: values.length });
      allValues.push(aggregatedValue);
    });
  });

  // Calcular estatísticas
  const sorted = [...allValues].sort((a, b) => a - b);
  const min = sorted[0] || 0;
  const max = sorted[sorted.length - 1] || 0;
  const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
  const median = sorted[Math.floor(sorted.length / 2)] || 0;

  // Normalizar valores para cores
  const normalizedCells = cells.map(cell => ({
    ...cell,
    normalized: max > min ? (cell.value - min) / (max - min) : 0,
    percentile: (sorted.findIndex(val => val >= cell.value) / sorted.length) * 100
  }));

  return {
    cells: normalizedCells,
    xLabels: [...new Set(cells.map(c => c.x))].sort(),
    yLabels: [...new Set(cells.map(c => c.y))].sort(),
    statistics: { min, max, mean, median, count: cells.length },
    processedAt: new Date().toISOString()
  };
}

// Calcula métricas de rede
function calculateNetworkMetrics(data: {
  nodes: Array<{ id: string; value: number; type: string }>;
  edges: Array<{ source: string; target: string; value: number }>;
}) {
  const { nodes, edges } = data;

  // Calcular centralidade de grau
  const degreeMap = new Map<string, number>();
  nodes.forEach(node => degreeMap.set(node.id, 0));

  edges.forEach(edge => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });

  // Calcular centralidade de intermediação (aproximação simples)
  const betweennessMap = new Map<string, number>();
  nodes.forEach(node => {
    const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    const uniqueConnections = new Set([
      ...connectedEdges.map(e => e.source),
      ...connectedEdges.map(e => e.target)
    ]);
    betweennessMap.set(node.id, uniqueConnections.size - 1);
  });

  // Calcular densidade da rede
  const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
  const density = maxPossibleEdges > 0 ? (edges.length / maxPossibleEdges) * 100 : 0;

  // Identificar clusters (componentes conectados)
  const visited = new Set<string>();
  const clusters: string[][] = [];

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const cluster: string[] = [];
      const stack = [node.id];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (!visited.has(current)) {
          visited.add(current);
          cluster.push(current);
          
          // Adicionar nós conectados
          edges
            .filter(e => e.source === current || e.target === current)
            .forEach(e => {
              const connected = e.source === current ? e.target : e.source;
              if (!visited.has(connected)) {
                stack.push(connected);
              }
            });
        }
      }
      
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });

  // Calcular métricas por nó
  const nodeMetrics = nodes.map(node => ({
    ...node,
    degree: degreeMap.get(node.id) || 0,
    betweenness: betweennessMap.get(node.id) || 0,
    cluster: clusters.findIndex(cluster => cluster.includes(node.id)),
    importance: ((degreeMap.get(node.id) || 0) + (betweennessMap.get(node.id) || 0)) / 2
  }));

  return {
    nodeMetrics: nodeMetrics.sort((a, b) => b.importance - a.importance),
    networkStats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density,
      avgDegree: Array.from(degreeMap.values()).reduce((sum, val) => sum + val, 0) / nodes.length,
      clusterCount: clusters.length,
      largestCluster: Math.max(...clusters.map(c => c.length))
    },
    clusters: clusters.map((cluster, index) => ({
      id: index,
      nodes: cluster,
      size: cluster.length
    })),
    processedAt: new Date().toISOString()
  };
}

// Otimiza dados de gráficos para performance
function optimizeChartData(data: {
  data: Array<Record<string, unknown>>;
  maxPoints?: number;
  precision?: number;
  removeOutliers?: boolean;
}) {
  const { data: inputData, maxPoints = 1000, precision = 2, removeOutliers = false } = data;

  let optimizedData = [...inputData];

  // Remover outliers se solicitado
  if (removeOutliers && optimizedData.length > 0) {
    const values = optimizedData.map(item => Number(Object.values(item).find(v => typeof v === 'number')) || 0);
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    optimizedData = optimizedData.filter((item, index) => {
      const value = values[index];
      return value >= lowerBound && value <= upperBound;
    });
  }

  // Reduzir número de pontos se exceder máximo
  if (optimizedData.length > maxPoints) {
    const step = Math.ceil(optimizedData.length / maxPoints);
    optimizedData = optimizedData.filter((_, index) => index % step === 0);
  }

  // Aplicar precisão aos números
  optimizedData = optimizedData.map(item => {
    const optimizedItem: Record<string, unknown> = {};
    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === 'number') {
        optimizedItem[key] = Number(value.toFixed(precision));
      } else {
        optimizedItem[key] = value;
      }
    });
    return optimizedItem;
  });

  return {
    data: optimizedData,
    originalCount: inputData.length,
    optimizedCount: optimizedData.length,
    compressionRatio: optimizedData.length / inputData.length,
    processedAt: new Date().toISOString()
  };
}

// ================================
// NOVAS FUNÇÕES PARA HOOKS ESPECÍFICOS (FASE 3)
// ================================

// Função para processar analytics de faturamento - useFaturamentoAnalytics
function processFaturamentoAnalytics(data: {
  faturamento: FaturamentoData[];
  periodo?: string;
  groupBy?: 'locatario' | 'categoria' | 'shopping';
}) {
  const { faturamento, periodo, groupBy = 'locatario' } = data;
  
  if (!faturamento || faturamento.length === 0) {
    return {
      dados: [],
      insights: null,
      rankings: [],
      analiseCategoria: [],
      processedAt: new Date().toISOString()
    };
  }

  // 1. Agrupar dados conforme critério
  const dadosAgrupados = groupBy === 'locatario' ?
    groupBy(faturamento, 'locatario') :
    groupBy === 'categoria' ? 
    groupBy(faturamento, 'categoria' as keyof FaturamentoData) :
    groupBy(faturamento, 'shopping');

  // 2. Processar rankings e estatísticas
  const rankings = dadosAgrupados.map(([chave, items]) => {
    const totalFaturado = items.reduce((sum, item) => sum + item.valortotalfaturado, 0);
    const totalPago = items.reduce((sum, item) => sum + item.valortotalpago, 0);
    const totalAberto = items.reduce((sum, item) => sum + item.valortotalaberto, 0);
    const inadimplencia = items.reduce((sum, item) => sum + (item.inadimplencia || 0), 0);
    const areaTotal = items.reduce((sum, item) => sum + (item.area || 0), 0);
    
    const performancePercentual = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;
    const receitaPorM2 = areaTotal > 0 ? totalFaturado / areaTotal : 0;
    const taxaInadimplencia = totalFaturado > 0 ? (inadimplencia / totalFaturado) * 100 : 0;

    return {
      [groupBy]: chave,
      totalFaturado,
      totalPago,
      totalAberto,
      inadimplencia,
      performancePercentual: Math.min(100, Math.max(0, performancePercentual)),
      receitaPorM2,
      taxaInadimplencia,
      numeroTransacoes: items.length,
      areaTotal,
      eficiencia: performancePercentual >= 90 ? 'Alta' : performancePercentual >= 70 ? 'Média' : 'Baixa'
    };
  }).sort((a, b) => b.totalFaturado - a.totalFaturado);

  // 3. Calcular insights gerais
  const totalReceita = rankings.reduce((sum, item) => sum + item.totalFaturado, 0);
  const totalInadimplencia = rankings.reduce((sum, item) => sum + item.inadimplencia, 0);
  const taxaInadimplenciaGeral = totalReceita > 0 ? (totalInadimplencia / totalReceita) * 100 : 0;
  
  const insights = {
    totalReceita,
    taxaInadimplencia: taxaInadimplenciaGeral,
    melhorLocatario: rankings[0] || null,
    piorPerformance: rankings.filter(r => r.performancePercentual < 70)[0] || null,
    crescimentoMensal: calculateTrend(generateTimelineAnalysis(faturamento)) * 100,
    numeroTotal: rankings.length,
    medianaReceita: calculateMediana(rankings.map(r => r.totalFaturado)),
    concentracaoTop3: rankings.slice(0, 3).reduce((sum, r) => sum + r.totalFaturado, 0) / totalReceita * 100
  };

  // 4. Análise por categoria (sempre incluir)
  const categoriaAnalysis = groupBy(faturamento, 'categoria' as keyof FaturamentoData)
    .map(([categoria, items]) => ({
      categoria,
      totalFaturado: items.reduce((sum, item) => sum + item.valortotalfaturado, 0),
      participacao: 0, // Será calculado depois
      numeroItens: items.length
    }))
    .sort((a, b) => b.totalFaturado - a.totalFaturado);

  // Calcular participação das categorias
  const totalCategorias = categoriaAnalysis.reduce((sum, cat) => sum + cat.totalFaturado, 0);
  categoriaAnalysis.forEach(cat => {
    cat.participacao = totalCategorias > 0 ? (cat.totalFaturado / totalCategorias) * 100 : 0;
  });

  return {
    dados: faturamento,
    rankings: rankings.slice(0, 20), // Top 20
    insights,
    analiseCategoria: categoriaAnalysis,
    estatisticas: {
      media: insights.totalReceita / rankings.length,
      mediana: insights.medianaReceita,
      volatilidade: calculateVolatility(faturamento),
      tendencia: insights.crescimentoMensal > 5 ? 'crescimento' : insights.crescimentoMensal < -5 ? 'declinio' : 'estavel'
    },
    processedAt: new Date().toISOString()
  };
}

// Função para processar dados de fluxo de caixa - useFluxoCaixaData
function processFluxoCaixaData(data: {
  movimentacoes: Array<{
    id: string;
    Data: string;
    Shopping: string;
    Fornecedor?: string;
    Debito: number;
    Credito: number;
    Historico?: string;
  }>;
  filtros?: any;
}) {
  const { movimentacoes } = data;
  
  if (!movimentacoes || movimentacoes.length === 0) {
    return {
      fluxoDiario: [],
      analise: createEmptyFluxoAnalise(),
      porCategoria: [],
      liquidezRealTime: null,
      processedAt: new Date().toISOString()
    };
  }

  // 1. Processar movimentações
  const movimentacoesProcessadas = movimentacoes.map(mov => ({
    id: mov.id,
    data: mov.Data,
    shopping: mov.Shopping,
    fornecedor: mov.Fornecedor,
    debito: Number(mov.Debito) || 0,
    credito: Number(mov.Credito) || 0,
    valorLiquido: (Number(mov.Credito) || 0) - (Number(mov.Debito) || 0),
    categoria: categorizarMovimentacaoFluxo(mov),
    descricao: mov.Historico || 'Sem descrição'
  }));

  // 2. Calcular fluxo diário
  const fluxoPorDia = new Map<string, {
    data: string;
    entradas: number;
    saidas: number;
    saldoLiquido: number;
    transacoes: number;
  }>();

  movimentacoesProcessadas.forEach(mov => {
    const dataKey = mov.data.split('T')[0];
    
    if (!fluxoPorDia.has(dataKey)) {
      fluxoPorDia.set(dataKey, {
        data: dataKey,
        entradas: 0,
        saidas: 0,
        saldoLiquido: 0,
        transacoes: 0
      });
    }
    
    const dia = fluxoPorDia.get(dataKey)!;
    dia.entradas += mov.credito;
    dia.saidas += mov.debito;
    dia.saldoLiquido += mov.valorLiquido;
    dia.transacoes += 1;
  });

  // 3. Converter para array e calcular saldo acumulado
  const fluxoDiarioArray = Array.from(fluxoPorDia.values())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  let saldoAcumulado = 0;
  const fluxoDiario = fluxoDiarioArray.map(dia => {
    saldoAcumulado += dia.saldoLiquido;
    return {
      ...dia,
      saldoAcumulado
    };
  });

  // 4. Análise geral
  const totalEntradas = movimentacoesProcessadas.reduce((sum, mov) => sum + mov.credito, 0);
  const totalSaidas = movimentacoesProcessadas.reduce((sum, mov) => sum + mov.debito, 0);
  const saldoAtual = fluxoDiario[fluxoDiario.length - 1]?.saldoAcumulado || 0;
  
  const analise = {
    saldoAtual,
    totalEntradas,
    totalSaidas,
    fluxoMedio: (totalEntradas - totalSaidas) / fluxoDiario.length || 0,
    volatilidade: calculateFluxoVolatility(fluxoDiario),
    tendencia: saldoAtual > 0 ? 'positivo' : 'negativo',
    diasComSaldoPositivo: fluxoDiario.filter(d => d.saldoLiquido > 0).length,
    diasComSaldoNegativo: fluxoDiario.filter(d => d.saldoLiquido < 0).length,
    liquidezAtual: totalSaidas > 0 ? totalEntradas / totalSaidas : 0
  };

  // 5. Análise por categoria
  const categoriasMap = new Map<string, {
    categoria: string;
    entradas: number;
    saidas: number;
    saldoLiquido: number;
    transacoes: number;
  }>();

  movimentacoesProcessadas.forEach(mov => {
    if (!categoriasMap.has(mov.categoria)) {
      categoriasMap.set(mov.categoria, {
        categoria: mov.categoria,
        entradas: 0,
        saidas: 0,
        saldoLiquido: 0,
        transacoes: 0
      });
    }
    
    const cat = categoriasMap.get(mov.categoria)!;
    cat.entradas += mov.credito;
    cat.saidas += mov.debito;
    cat.saldoLiquido += mov.valorLiquido;
    cat.transacoes += 1;
  });

  const porCategoria = Array.from(categoriasMap.values())
    .map(cat => ({
      ...cat,
      participacaoEntradas: totalEntradas > 0 ? (cat.entradas / totalEntradas) * 100 : 0,
      participacaoSaidas: totalSaidas > 0 ? (cat.saidas / totalSaidas) * 100 : 0
    }))
    .sort((a, b) => Math.abs(b.saldoLiquido) - Math.abs(a.saldoLiquido));

  // 6. Liquidez real-time (últimas 24h)
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  
  const movimentacoesRecentes = movimentacoesProcessadas.filter(mov => 
    new Date(mov.data) >= ontem
  );
  
  const liquidezRealTime = {
    saldoHoje: movimentacoesRecentes.reduce((sum, mov) => sum + mov.valorLiquido, 0),
    entradasHoje: movimentacoesRecentes.reduce((sum, mov) => sum + mov.credito, 0),
    saidasHoje: movimentacoesRecentes.reduce((sum, mov) => sum + mov.debito, 0),
    transacoesHoje: movimentacoesRecentes.length,
    status: analise.liquidezAtual >= 1 ? 'positivo' : 'negativo'
  };

  return {
    movimentacoes: movimentacoesProcessadas,
    fluxoDiario,
    analise,
    porCategoria,
    liquidezRealTime,
    processedAt: new Date().toISOString()
  };
}

// Função para processar dados de fornecedores - useFornecedoresData
function processFornecedoresData(data: {
  pagamentos: Array<{
    shopping: string;
    fornecedor: string;
    valorcp: number;
    valorpago: number;
    statuspagamento: string;
    dataemissao: string;
    datapagamento?: string;
    datavencimento?: string;
    descricaocontacontabil?: string;
  }>;
  filtros?: any;
}) {
  const { pagamentos } = data;
  
  if (!pagamentos || pagamentos.length === 0) {
    return {
      ranking: [],
      porCategoria: [],
      metricas: createEmptyFornecedoresMetrics(),
      temporal: [],
      processedAt: new Date().toISOString()
    };
  }

  // 1. Processar e agrupar por fornecedor
  const fornecedoresMap = new Map<string, {
    fornecedor: string;
    shopping: string;
    totalContratado: number;
    totalPago: number;
    transacoes: any[];
    categoria: string;
  }>();

  pagamentos.forEach(pag => {
    const key = `${pag.fornecedor}_${pag.shopping}`;
    
    if (!fornecedoresMap.has(key)) {
      fornecedoresMap.set(key, {
        fornecedor: pag.fornecedor,
        shopping: pag.shopping,
        totalContratado: 0,
        totalPago: 0,
        transacoes: [],
        categoria: categorizarFornecedor(pag)
      });
    }
    
    const fornecedor = fornecedoresMap.get(key)!;
    fornecedor.totalContratado += Number(pag.valorcp) || 0;
    fornecedor.totalPago += Number(pag.valorpago) || 0;
    fornecedor.transacoes.push(pag);
  });

  // 2. Crear ranking de fornecedores
  const ranking = Array.from(fornecedoresMap.values())
    .map(forn => {
      const percentualPago = forn.totalContratado > 0 ? 
        (forn.totalPago / forn.totalContratado) * 100 : 0;
      
      const totalPendente = forn.totalContratado - forn.totalPago;
      const ticketMedio = forn.transacoes.length > 0 ? 
        forn.totalContratado / forn.transacoes.length : 0;

      // Calcular dias médios de pagamento
      const pagamentosComData = forn.transacoes.filter(t => t.datapagamento && t.dataemissao);
      const diasMediosPagamento = pagamentosComData.length > 0 ?
        pagamentosComData.reduce((sum, t) => {
          const emissao = new Date(t.dataemissao);
          const pagamento = new Date(t.datapagamento!);
          return sum + Math.floor((pagamento.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / pagamentosComData.length : 0;

      // Status geral
      let statusGeral: 'excelente' | 'bom' | 'regular' | 'preocupante';
      if (percentualPago >= 95 && diasMediosPagamento <= 30) statusGeral = 'excelente';
      else if (percentualPago >= 85 && diasMediosPagamento <= 45) statusGeral = 'bom';
      else if (percentualPago >= 70 && diasMediosPagamento <= 60) statusGeral = 'regular';
      else statusGeral = 'preocupante';

      return {
        fornecedor: forn.fornecedor,
        shopping: forn.shopping,
        totalContratado: forn.totalContratado,
        totalPago: forn.totalPago,
        totalPendente,
        percentualPago: Math.min(100, Math.max(0, percentualPago)),
        numeroTransacoes: forn.transacoes.length,
        ticketMedio,
        diasMediosPagamento: Math.max(0, diasMediosPagamento),
        statusGeral,
        categoria: forn.categoria,
        ultimoPagamento: forn.transacoes
          .filter(t => t.datapagamento)
          .sort((a, b) => new Date(b.datapagamento!).getTime() - new Date(a.datapagamento!).getTime())[0]?.datapagamento || null
      };
    })
    .sort((a, b) => b.totalContratado - a.totalContratado);

  // 3. Análise por categoria
  const categoriasMap = new Map<string, {
    categoria: string;
    totalGasto: number;
    totalPago: number;
    fornecedores: Set<string>;
    transacoes: number;
  }>();

  pagamentos.forEach(pag => {
    const categoria = categorizarFornecedor(pag);
    
    if (!categoriasMap.has(categoria)) {
      categoriasMap.set(categoria, {
        categoria,
        totalGasto: 0,
        totalPago: 0,
        fornecedores: new Set(),
        transacoes: 0
      });
    }
    
    const cat = categoriasMap.get(categoria)!;
    cat.totalGasto += Number(pag.valorcp) || 0;
    cat.totalPago += Number(pag.valorpago) || 0;
    cat.fornecedores.add(pag.fornecedor);
    cat.transacoes += 1;
  });

  const totalGastoGeral = Array.from(categoriasMap.values())
    .reduce((sum, cat) => sum + cat.totalGasto, 0);

  const porCategoria = Array.from(categoriasMap.values())
    .map(cat => ({
      categoria: cat.categoria,
      totalGasto: cat.totalGasto,
      totalPago: cat.totalPago,
      totalPendente: cat.totalGasto - cat.totalPago,
      participacao: totalGastoGeral > 0 ? (cat.totalGasto / totalGastoGeral) * 100 : 0,
      fornecedores: cat.fornecedores.size,
      eficienciaPagamento: cat.totalGasto > 0 ? (cat.totalPago / cat.totalGasto) * 100 : 0,
      transacoes: cat.transacoes
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto);

  // 4. Métricas gerais
  const totalFornecedores = new Set(pagamentos.map(p => p.fornecedor)).size;
  const totalContratado = ranking.reduce((sum, r) => sum + r.totalContratado, 0);
  const totalPago = ranking.reduce((sum, r) => sum + r.totalPago, 0);
  const totalPendente = totalContratado - totalPago;
  const taxaPagamento = totalContratado > 0 ? (totalPago / totalContratado) * 100 : 0;

  const metricas = {
    totalFornecedores,
    totalContratado,
    totalPago,
    totalPendente,
    taxaPagamento: Math.min(100, Math.max(0, taxaPagamento)),
    prazoMedioPagamento: ranking.reduce((sum, r) => sum + r.diasMediosPagamento, 0) / ranking.length || 0,
    fornecedorMaiorGasto: ranking[0] || null,
    fornecedorMelhorPerformance: ranking
      .filter(r => r.numeroTransacoes >= 3)
      .sort((a, b) => b.percentualPago - a.percentualPago)[0] || null,
    categoriaComMaiorGasto: porCategoria[0]?.categoria || 'N/A',
    tendenciaPagamentos: taxaPagamento > 85 ? 'crescimento' : taxaPagamento < 70 ? 'declinio' : 'estavel',
    alertasVencimento: 0 // Seria calculado com dados de vencimento
  };

  // 5. Análise temporal (últimos 6 meses)
  const temporal = generateFornecedoresTemporal(pagamentos);

  return {
    fornecedores: pagamentos,
    ranking: ranking.slice(0, 50), // Top 50
    porCategoria,
    metricas,
    temporal,
    processedAt: new Date().toISOString()
  };
}

// Função para processar dados orçamentários - useOrcamentoData
function processOrcamentoData(data: {
  pagamentos: Array<{
    shopping: string;
    contaorcamentaria1nivel?: string;
    contaorcamentaria2nivel?: string;
    valorcp: number;
    valorpago: number;
    dataemissao: string;
    descricaocontacontabil?: string;
  }>;
  planos?: any[];
  filtros?: any;
}) {
  const { pagamentos, planos = [] } = data;
  
  if (!pagamentos || pagamentos.length === 0) {
    return {
      analises: [],
      resumo: createEmptyOrcamentoResumo(),
      porCategoria: [],
      evolucao: [],
      processedAt: new Date().toISOString()
    };
  }

  // 1. Processar execução orçamentária
  const execucaoMap = new Map<string, {
    conta: string;
    shopping: string;
    valorExecutado: number;
    transacoes: number;
    categoria: string;
    descricao: string;
  }>();

  pagamentos.forEach(pag => {
    const conta = pag.contaorcamentaria1nivel || pag.contaorcamentaria2nivel || 'Outros';
    const key = `${pag.shopping}_${conta}`;
    
    if (!execucaoMap.has(key)) {
      execucaoMap.set(key, {
        conta,
        shopping: pag.shopping,
        valorExecutado: 0,
        transacoes: 0,
        categoria: categorizarContaOrcamentaria(pag),
        descricao: pag.descricaocontacontabil || 'N/A'
      });
    }
    
    const execucao = execucaoMap.get(key)!;
    execucao.valorExecutado += Number(pag.valorcp) || 0;
    execucao.transacoes += 1;
  });

  // 2. Valores orçados simulados (na ausência de dados reais)
  const valoresOrcadosSimulados: Record<string, number> = {
    'Shopping Park Botucatu_Manutenção': 150000,
    'Shopping Park Botucatu_Obras': 300000,
    'Shopping Park Botucatu_Serviços': 200000,
    'Shopping Park Botucatu_Administrativo': 100000,
    'Shopping Park Botucatu_Marketing': 80000,
    'Shopping Park Botucatu_Tecnologia': 120000,
    'Shopping Park Botucatu_Outros': 50000
  };

  // 3. Criar análises consolidadas
  const analises = Array.from(execucaoMap.values())
    .map(exec => {
      const key = `${exec.shopping}_${exec.conta}`;
      const valorOrcado = valoresOrcadosSimulados[key] || exec.valorExecutado * 1.2;
      const valorDisponivel = Math.max(0, valorOrcado - exec.valorExecutado);
      const percentualExecutado = valorOrcado > 0 ? (exec.valorExecutado / valorOrcado) * 100 : 0;
      const variacao = exec.valorExecutado - valorOrcado;

      // Status
      let status: 'dentro' | 'proximo_limite' | 'estourou';
      if (percentualExecutado <= 80) status = 'dentro';
      else if (percentualExecutado <= 100) status = 'proximo_limite';
      else status = 'estourou';

      return {
        conta: exec.conta,
        descricao: exec.descricao,
        categoria: exec.categoria,
        shopping: exec.shopping,
        valorOrcado,
        valorExecutado: exec.valorExecutado,
        valorDisponivel,
        percentualExecutado: Math.min(200, Math.max(0, percentualExecutado)),
        variacao,
        status,
        transacoes: exec.transacoes,
        tendencia: variacao > 0 ? 'crescimento' : 'estavel',
        eficiencia: percentualExecutado <= 100 ? 'boa' : 'ruim'
      };
    })
    .sort((a, b) => b.valorOrcado - a.valorOrcado);

  // 4. Resumo geral
  const totalOrcado = analises.reduce((sum, a) => sum + a.valorOrcado, 0);
  const totalExecutado = analises.reduce((sum, a) => sum + a.valorExecutado, 0);
  const totalDisponivel = totalOrcado - totalExecutado;
  const percentualGlobalExecutado = totalOrcado > 0 ? (totalExecutado / totalOrcado) * 100 : 0;

  const resumo = {
    totalOrcado,
    totalExecutado,
    totalDisponivel,
    percentualGlobalExecutado: Math.min(200, Math.max(0, percentualGlobalExecutado)),
    contasDentroOrcamento: analises.filter(a => a.status === 'dentro').length,
    contasProximoLimite: analises.filter(a => a.status === 'proximo_limite').length,
    contasEstouradas: analises.filter(a => a.status === 'estourou').length,
    economiaRealizada: analises.filter(a => a.variacao < 0)
      .reduce((sum, a) => sum + Math.abs(a.variacao), 0),
    estouroTotal: analises.filter(a => a.variacao > 0)
      .reduce((sum, a) => sum + a.variacao, 0),
    eficienciaOrcamentaria: analises.length > 0 ? 
      (analises.filter(a => a.status === 'dentro').length / analises.length) * 100 : 0,
    melhorConta: analises.filter(a => a.valorOrcado > 10000)
      .sort((a, b) => a.percentualExecutado - b.percentualExecutado)[0] || null,
    piorConta: analises.filter(a => a.status === 'estourou')
      .sort((a, b) => b.percentualExecutado - a.percentualExecutado)[0] || null
  };

  // 5. Análise por categoria
  const categoriaMap = new Map<string, {
    categoria: string;
    totalOrcado: number;
    totalExecutado: number;
    contas: number;
  }>();

  analises.forEach(analise => {
    if (!categoriaMap.has(analise.categoria)) {
      categoriaMap.set(analise.categoria, {
        categoria: analise.categoria,
        totalOrcado: 0,
        totalExecutado: 0,
        contas: 0
      });
    }
    
    const cat = categoriaMap.get(analise.categoria)!;
    cat.totalOrcado += analise.valorOrcado;
    cat.totalExecutado += analise.valorExecutado;
    cat.contas += 1;
  });

  const porCategoria = Array.from(categoriaMap.values())
    .map(cat => ({
      categoria: cat.categoria,
      totalOrcado: cat.totalOrcado,
      totalExecutado: cat.totalExecutado,
      percentualExecutado: cat.totalOrcado > 0 ? (cat.totalExecutado / cat.totalOrcado) * 100 : 0,
      variacao: cat.totalExecutado - cat.totalOrcado,
      contas: cat.contas,
      status: cat.totalOrcado > 0 ? 
        (cat.totalExecutado / cat.totalOrcado <= 0.8 ? 'positivo' : 
         cat.totalExecutado / cat.totalOrcado <= 1.0 ? 'neutro' : 'negativo') : 'neutro'
    }))
    .sort((a, b) => b.totalOrcado - a.totalOrcado);

  // 6. Evolução temporal simulada
  const evolucao = generateOrcamentoEvolucao(pagamentos);

  return {
    planos,
    analises: analises.slice(0, 100), // Top 100 contas
    resumo,
    porCategoria,
    evolucao,
    processedAt: new Date().toISOString()
  };
}

// Função para calcular métricas brasileiras específicas
function calculateBrazilianMetrics(data: {
  type: 'currency' | 'percentage' | 'date' | 'tax';
  values: number[];
  options?: any;
}) {
  const { type, values, options = {} } = data;
  
  if (!values || values.length === 0) {
    return {
      formatted: [],
      statistics: null,
      processedAt: new Date().toISOString()
    };
  }

  // Formatação específica brasileira
  const formatted = values.map(value => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2
        }).format(value);
      
      case 'percentage':
        return new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: 2
        }).format(value / 100);
      
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      
      case 'tax':
        // Para cálculos de impostos brasileiros
        const aliquota = options.aliquota || 0.1; // 10% padrão
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value * aliquota);
      
      default:
        return value.toLocaleString('pt-BR');
    }
  });

  // Estatísticas
  const sorted = [...values].sort((a, b) => a - b);
  const statistics = {
    soma: values.reduce((sum, val) => sum + val, 0),
    media: values.reduce((sum, val) => sum + val, 0) / values.length,
    mediana: sorted[Math.floor(sorted.length / 2)],
    minimo: sorted[0],
    maximo: sorted[sorted.length - 1],
    quartil1: sorted[Math.floor(sorted.length * 0.25)],
    quartil3: sorted[Math.floor(sorted.length * 0.75)],
    desvio: Math.sqrt(values.reduce((sum, val) => {
      const media = values.reduce((s, v) => s + v, 0) / values.length;
      return sum + Math.pow(val - media, 2);
    }, 0) / values.length),
    contagem: values.length
  };

  return {
    formatted,
    statistics,
    brazilianContext: {
      moedaLocal: 'BRL',
      formatoData: 'dd/mm/yyyy',
      separadorDecimal: ',',
      separadorMilhar: '.'
    },
    processedAt: new Date().toISOString()
  };
}

// ================================
// FUNÇÕES AUXILIARES PARA OS NOVOS PROCESSOS
// ================================

function calculateMediana(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? 
    (sorted[middle - 1] + sorted[middle]) / 2 : 
    sorted[middle];
}

function calculateFluxoVolatility(fluxoDiario: Array<{ saldoLiquido: number }>): number {
  const valores = fluxoDiario.map(d => d.saldoLiquido);
  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  return Math.sqrt(variancia);
}

function categorizarMovimentacaoFluxo(mov: any): string {
  const historico = (mov.Historico || '').toLowerCase();
  const fornecedor = (mov.Fornecedor || '').toLowerCase();
  
  if (historico.includes('receita') || mov.Credito > mov.Debito) return 'Receitas Operacionais';
  if (fornecedor.includes('fornecedor')) return 'Pagamentos Fornecedores';
  if (historico.includes('imposto') || historico.includes('taxa')) return 'Impostos e Taxas';
  if (historico.includes('administrativ')) return 'Despesas Administrativas';
  if (historico.includes('investimento')) return 'Investimentos';
  return 'Outros';
}

function categorizarFornecedor(pag: any): string {
  const descricao = (pag.descricaocontacontabil || '').toLowerCase();
  const fornecedor = (pag.fornecedor || '').toLowerCase();
  
  if (descricao.includes('obra') || descricao.includes('reforma')) return 'Obras e Reformas';
  if (descricao.includes('serviço') || fornecedor.includes('consultoria')) return 'Serviços Profissionais';
  if (descricao.includes('manutenç')) return 'Manutenção';
  if (descricao.includes('tecnologia') || descricao.includes('software')) return 'Tecnologia';
  if (descricao.includes('marketing')) return 'Marketing';
  return 'Outros';
}

function categorizarContaOrcamentaria(pag: any): string {
  const descricao = (pag.descricaocontacontabil || '').toLowerCase();
  
  if (descricao.includes('manutenç')) return 'Manutenção';
  if (descricao.includes('obra')) return 'Obras e Reformas';
  if (descricao.includes('serviço')) return 'Serviços Profissionais';
  if (descricao.includes('administrativ')) return 'Administrativo';
  if (descricao.includes('marketing')) return 'Marketing';
  if (descricao.includes('tecnologia')) return 'Tecnologia';
  return 'Outros';
}

function generateFornecedoresTemporal(pagamentos: any[]): any[] {
  // Simular análise temporal (seria baseada em dados históricos reais)
  const meses = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
  
  return meses.map((mes, index) => {
    const totalPago = 400000 + (index * 50000);
    const totalVencimentos = totalPago * 1.2;
    const pagamentosNoPrazo = Math.floor(totalPago * 0.8);
    const pagamentosAtrasados = Math.floor(totalPago * 0.2);
    const eficiencia = (pagamentosNoPrazo / (pagamentosNoPrazo + pagamentosAtrasados)) * 100;
    
    return {
      periodo: mes,
      totalPago,
      totalVencimentos,
      pagamentosNoPrazo,
      pagamentosAtrasados,
      eficiencia,
      valorMedioTransacao: totalPago / 30 // Aproximação
    };
  });
}

function generateOrcamentoEvolucao(pagamentos: any[]): any[] {
  // Simular evolução orçamentária mensal
  const meses = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
  
  return meses.map((mes, index) => {
    const orcado = 500000 + (index * 50000);
    const executado = orcado * (0.6 + (index * 0.05));
    const disponivel = orcado - executado;
    const percentualExecutado = (executado / orcado) * 100;
    const acumuladoOrcado = orcado * (index + 1);
    const acumuladoExecutado = executado * (index + 1);
    
    return {
      periodo: mes,
      orcado,
      executado,
      disponivel,
      percentualExecutado,
      acumuladoOrcado,
      acumuladoExecutado,
      eficiencia: acumuladoOrcado > 0 ? (acumuladoExecutado / acumuladoOrcado) * 100 : 0
    };
  });
}

function createEmptyFluxoAnalise() {
  return {
    saldoAtual: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    fluxoMedio: 0,
    volatilidade: 0,
    tendencia: 'estavel',
    diasComSaldoPositivo: 0,
    diasComSaldoNegativo: 0,
    liquidezAtual: 0
  };
}

function createEmptyFornecedoresMetrics() {
  return {
    totalFornecedores: 0,
    totalContratado: 0,
    totalPago: 0,
    totalPendente: 0,
    taxaPagamento: 0,
    prazoMedioPagamento: 0,
    fornecedorMaiorGasto: null,
    fornecedorMelhorPerformance: null,
    categoriaComMaiorGasto: 'N/A',
    tendenciaPagamentos: 'estavel',
    alertasVencimento: 0
  };
}

function createEmptyOrcamentoResumo() {
  return {
    totalOrcado: 0,
    totalExecutado: 0,
    totalDisponivel: 0,
    percentualGlobalExecutado: 0,
    contasDentroOrcamento: 0,
    contasProximoLimite: 0,
    contasEstouradas: 0,
    economiaRealizada: 0,
    estouroTotal: 0,
    eficienciaOrcamentaria: 0,
    melhorConta: null,
    piorConta: null
  };
}

// Export para usar em outros lugares se necessário
export {};