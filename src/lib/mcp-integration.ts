/**
 * Integração com MCP-SERVER-CHART para geração de gráficos avançados
 * Utiliza as ferramentas de geração de charts do MCP Server
 */

import { useState, useCallback } from 'react';

// Tipos para integração MCP
export interface McpChartConfig {
  type: 'treemap' | 'sankey' | 'heatmap' | 'network' | 'area' | 'column' | 'pie' | 'line';
  data: any[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  theme?: 'default' | 'academy';
  style?: {
    backgroundColor?: string;
    palette?: string[];
    texture?: 'default' | 'rough';
  };
  axisXTitle?: string;
  axisYTitle?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  enableInteraction?: boolean;
}

export interface McpChartResult {
  success: boolean;
  chartId?: string;
  imageUrl?: string;
  svgContent?: string;
  error?: string;
  metadata?: {
    generatedAt: string;
    chartType: string;
    dataPoints: number;
    processingTime: number;
  };
}

export interface McpChartRequest {
  config: McpChartConfig;
  format?: 'svg' | 'png' | 'pdf';
  quality?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

// Classe principal para integração MCP
export class McpChartIntegration {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(baseUrl = 'http://localhost:3001/generate-chart', apiKey?: string, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Gera gráfico treemap usando MCP
   */
  async generateTreemap(
    data: any[],
    options: {
      title?: string;
      width?: number;
      height?: number;
      hierarchyKeys: string[];
      valueKey: string;
      colorScheme?: string[];
    }
  ): Promise<McpChartResult> {
    const config: McpChartConfig = {
      type: 'treemap',
      data: this.transformDataForTreemap(data, options.hierarchyKeys, options.valueKey),
      title: options.title || 'Análise Hierárquica',
      width: options.width || 800,
      height: options.height || 600,
      style: {
        palette: options.colorScheme || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        texture: 'default'
      }
    };

    return this.sendChartRequest({ config, format: 'svg', interactive: true });
  }

  /**
   * Gera gráfico sankey usando MCP
   */
  async generateSankey(
    data: any[],
    options: {
      sourceKey: string;
      targetKey: string;
      valueKey: string;
      title?: string;
      width?: number;
      height?: number;
    }
  ): Promise<McpChartResult> {
    const config: McpChartConfig = {
      type: 'sankey',
      data: this.transformDataForSankey(data, options.sourceKey, options.targetKey, options.valueKey),
      title: options.title || 'Fluxo de Dados',
      width: options.width || 900,
      height: options.height || 600,
      style: {
        palette: ['#60A5FA', '#34D399', '#FBBF24', '#F87171'],
        backgroundColor: '#F9FAFB'
      }
    };

    return this.sendChartRequest({ config, format: 'svg', interactive: true });
  }

  /**
   * Gera heatmap usando MCP
   */
  async generateHeatmap(
    data: any[],
    options: {
      xKey: string;
      yKey: string;
      valueKey: string;
      title?: string;
      width?: number;
      height?: number;
      colorScheme?: 'sequential' | 'diverging';
    }
  ): Promise<McpChartResult> {
    const config: McpChartConfig = {
      type: 'heatmap',
      data: this.transformDataForHeatmap(data, options.xKey, options.yKey, options.valueKey),
      title: options.title || 'Mapa de Calor',
      width: options.width || 800,
      height: options.height || 600,
      style: {
        palette: options.colorScheme === 'diverging' 
          ? ['#EF4444', '#FFFFFF', '#10B981']
          : ['#EEF2FF', '#6366F1', '#312E81']
      }
    };

    return this.sendChartRequest({ config, format: 'svg', interactive: true });
  }

  /**
   * Gera network graph usando MCP (usando pin_map como aproximação)
   */
  async generateNetworkGraph(
    data: any[],
    options: {
      nodeKey: string;
      connectionKey?: string;
      valueKey?: string;
      title?: string;
      width?: number;
      height?: number;
    }
  ): Promise<McpChartResult> {
    // Para network graph, usamos pin_map como aproximação ou processamento customizado
    const processedData = this.transformDataForNetwork(data, options.nodeKey, options.valueKey);
    
    const config: McpChartConfig = {
      type: 'network',
      data: processedData,
      title: options.title || 'Rede de Relacionamentos',
      width: options.width || 800,
      height: options.height || 600,
      enableInteraction: true
    };

    return this.sendChartRequest({ config, format: 'svg', interactive: true });
  }

  /**
   * Gera gráfico de área usando MCP
   */
  async generateAreaChart(
    data: any[],
    options: {
      timeKey: string;
      valueKey: string;
      groupKey?: string;
      title?: string;
      stack?: boolean;
    }
  ): Promise<McpChartResult> {
    const config: McpChartConfig = {
      type: 'area',
      data: this.transformDataForTimeSeries(data, options.timeKey, options.valueKey, options.groupKey),
      title: options.title || 'Análise Temporal',
      axisXTitle: 'Tempo',
      axisYTitle: 'Valor',
      showLegend: !!options.groupKey,
      style: {
        palette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }
    };

    return this.sendChartRequest({ config, format: 'svg' });
  }

  /**
   * Envia requisição para gerar gráfico
   */
  private async sendChartRequest(request: McpChartRequest): Promise<McpChartResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        ...result,
        metadata: {
          generatedAt: new Date().toISOString(),
          chartType: request.config.type,
          dataPoints: request.config.data.length,
          processingTime: Date.now() - performance.now()
        }
      };
    } catch (error) {
      console.error('Erro ao gerar gráfico MCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar gráfico'
      };
    }
  }

  /**
   * Transforma dados para formato treemap
   */
  private transformDataForTreemap(data: any[], hierarchyKeys: string[], valueKey: string) {
    // Implementar lógica de transformação hierárquica
    const transformed = data.map(item => {
      const result: any = { value: item[valueKey] || 0 };
      hierarchyKeys.forEach((key, index) => {
        result[`level${index}`] = item[key];
      });
      return result;
    });

    return transformed;
  }

  /**
   * Transforma dados para formato sankey
   */
  private transformDataForSankey(data: any[], sourceKey: string, targetKey: string, valueKey: string) {
    return data.map(item => ({
      source: String(item[sourceKey]),
      target: String(item[targetKey]),
      value: Number(item[valueKey]) || 0
    }));
  }

  /**
   * Transforma dados para formato heatmap
   */
  private transformDataForHeatmap(data: any[], xKey: string, yKey: string, valueKey: string) {
    return data.map(item => ({
      x: String(item[xKey]),
      y: String(item[yKey]),
      value: Number(item[valueKey]) || 0
    }));
  }

  /**
   * Transforma dados para formato network
   */
  private transformDataForNetwork(data: any[], nodeKey: string, valueKey?: string) {
    // Para MCP, aproximamos network usando dados de pontos
    const uniqueNodes = [...new Set(data.map(item => item[nodeKey]))];
    
    return uniqueNodes.map(node => {
      const nodeData = data.filter(item => item[nodeKey] === node);
      const totalValue = valueKey 
        ? nodeData.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0)
        : nodeData.length;
      
      return {
        name: String(node),
        value: totalValue,
        connections: nodeData.length
      };
    });
  }

  /**
   * Transforma dados para série temporal
   */
  private transformDataForTimeSeries(data: any[], timeKey: string, valueKey: string, groupKey?: string) {
    if (groupKey) {
      return data.map(item => ({
        time: String(item[timeKey]),
        value: Number(item[valueKey]) || 0,
        group: String(item[groupKey])
      }));
    }

    return data.map(item => ({
      time: String(item[timeKey]),
      value: Number(item[valueKey]) || 0
    }));
  }
}

// Instância padrão para uso global
export const mcpCharts = new McpChartIntegration();

// Hook React para usar MCP Charts
export function useMcpCharts() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generateChart = React.useCallback(async (
    type: McpChartConfig['type'],
    data: any[],
    options: any = {}
  ): Promise<McpChartResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      let result: McpChartResult;

      switch (type) {
        case 'treemap':
          result = await mcpCharts.generateTreemap(data, options);
          break;
        case 'sankey':
          result = await mcpCharts.generateSankey(data, options);
          break;
        case 'heatmap':
          result = await mcpCharts.generateHeatmap(data, options);
          break;
        case 'network':
          result = await mcpCharts.generateNetworkGraph(data, options);
          break;
        case 'area':
          result = await mcpCharts.generateAreaChart(data, options);
          break;
        default:
          throw new Error(`Tipo de gráfico não suportado: ${type}`);
      }

      if (!result.success && result.error) {
        setError(result.error);
        return null;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar gráfico';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateChart,
    isLoading,
    error,
    clearError: React.useCallback(() => setError(null), [])
  };
}

// Export adicional para compatibilidade
export default McpChartIntegration;