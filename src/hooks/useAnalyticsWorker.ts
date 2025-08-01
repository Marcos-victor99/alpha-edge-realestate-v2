import { useCallback, useRef, useEffect } from 'react';
import type { AnalyticsWorkerMessage, AnalyticsWorkerResponse } from '@/workers/analytics.worker';

/**
 * Hook para usar o Web Worker de analytics de forma fácil e type-safe
 */
export function useAnalyticsWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Inicializar o worker
  useEffect(() => {
    // Criar o worker usando a sintaxe do Vite
    workerRef.current = new Worker(
      new URL('@/workers/analytics.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Listener para mensagens do worker
    workerRef.current.onmessage = (event: MessageEvent<AnalyticsWorkerResponse>) => {
      const { type, payload, requestId } = event.data;
      const pendingRequest = pendingRequestsRef.current.get(requestId);

      if (pendingRequest) {
        if (type === 'RESULT') {
          pendingRequest.resolve(payload);
        } else if (type === 'ERROR') {
          pendingRequest.reject(new Error(payload.message));
        }
        
        pendingRequestsRef.current.delete(requestId);
      }
    };

    // Listener para erros do worker
    workerRef.current.onerror = (error) => {
      console.error('Erro no Analytics Worker:', error);
      
      // Rejeitar todas as requisições pendentes
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error('Worker teve um erro'));
      });
      pendingRequestsRef.current.clear();
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequestsRef.current.clear();
    };
  }, []);

  // Função genérica para enviar mensagens para o worker
  const sendMessage = useCallback(<T = any>(
    type: AnalyticsWorkerMessage['type'],
    payload: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker não está disponível'));
        return;
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Armazenar as funções de callback
      pendingRequestsRef.current.set(requestId, { resolve, reject });

      // Timeout para evitar requisições pendentes infinitas
      setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error('Timeout na operação do worker'));
        }
      }, 30000); // 30 segundos de timeout

      // Enviar mensagem para o worker
      const message: AnalyticsWorkerMessage = {
        type,
        payload,
        requestId
      };

      workerRef.current.postMessage(message);
    });
  }, []);

  // Métodos específicos para cada tipo de operação

  const calculateKPIs = useCallback(async (data: {
    faturamento: any[];
    inadimplencia: any[];
    movimentacoes: any[];
    pagamentos: any[];
  }) => {
    return sendMessage('CALCULATE_KPI', data);
  }, [sendMessage]);

  const processFinancialData = useCallback(async (data: {
    faturamento: any[];
    inadimplencia: any[];
  }) => {
    return sendMessage('PROCESS_FINANCIAL_DATA', data);
  }, [sendMessage]);

  const calculateRiskMetrics = useCallback(async (data: {
    faturamento: any[];
    inadimplencia: any[];
  }) => {
    return sendMessage('CALCULATE_RISK_METRICS', data);
  }, [sendMessage]);

  const generatePredictions = useCallback(async (data: {
    faturamento: any[];
  }) => {
    return sendMessage('GENERATE_PREDICTIONS', data);
  }, [sendMessage]);

  // 🚀 NOVOS MÉTODOS: Conectando com as funções expandidas do Web Worker

  const processFaturamentoAnalytics = useCallback(async (data: {
    faturamento: any[];
    filters?: {
      periodo?: string;
      shopping?: string;
      categoria?: string;
    };
  }) => {
    return sendMessage('PROCESS_FATURAMENTO_ANALYTICS', data);
  }, [sendMessage]);

  const processFluxoCaixaData = useCallback(async (data: {
    movimentacoes: any[];
    periodo?: {
      inicio: string;
      fim: string;
    };
    aggregationType?: 'daily' | 'monthly' | 'weekly';
  }) => {
    return sendMessage('PROCESS_FLUXO_CAIXA_DATA', data);
  }, [sendMessage]);

  const processFornecedoresData = useCallback(async (data: {
    pagamentos: any[];
    filters?: {
      status?: string;
      categoria?: string;
      periodo?: string;
      fornecedor?: string;
    };
    analysisType?: 'ranking' | 'categoria' | 'status' | 'temporal';
  }) => {
    return sendMessage('PROCESS_FORNECEDORES_DATA', data);
  }, [sendMessage]);

  const processOrcamentoData = useCallback(async (data: {
    planejamento: any[];
    execucoes: any[];
    periodo?: string;
    categoria?: string;
  }) => {
    return sendMessage('PROCESS_ORCAMENTO_DATA', data);
  }, [sendMessage]);

  const calculateBrazilianMetrics = useCallback(async (data: {
    valores: any[];
    type: 'currency' | 'percentage' | 'date' | 'tax';
    locale?: string;
  }) => {
    return sendMessage('CALCULATE_BRAZILIAN_METRICS', data);
  }, [sendMessage]);

  // Verificar se o worker está disponível
  const isWorkerReady = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  // Cancelar todas as operações pendentes
  const cancelAllOperations = useCallback(() => {
    pendingRequestsRef.current.forEach(({ reject }) => {
      reject(new Error('Operação cancelada'));
    });
    pendingRequestsRef.current.clear();
  }, []);

  return {
    // Métodos existentes
    calculateKPIs,
    processFinancialData,
    calculateRiskMetrics,
    generatePredictions,
    
    // 🚀 Novos métodos para os hooks criados nas fases 1-2
    processFaturamentoAnalytics,
    processFluxoCaixaData,
    processFornecedoresData,
    processOrcamentoData,
    calculateBrazilianMetrics,
    
    // Utilitários
    isWorkerReady,
    cancelAllOperations
  };
}

// Hook para usar analytics com React Query (integração)
export function useAnalyticsWithQuery() {
  const analyticsWorker = useAnalyticsWorker();

  const calculateKPIsWithCache = useCallback(async (data: any, queryKey: string[]) => {
    // Aqui poderia implementar cache adicional se necessário
    return analyticsWorker.calculateKPIs(data);
  }, [analyticsWorker]);

  // 🚀 Métodos com cache para os novos processadores
  const processFaturamentoAnalyticsWithCache = useCallback(async (data: any, queryKey: string[]) => {
    return analyticsWorker.processFaturamentoAnalytics(data);
  }, [analyticsWorker]);

  const processFluxoCaixaDataWithCache = useCallback(async (data: any, queryKey: string[]) => {
    return analyticsWorker.processFluxoCaixaData(data);
  }, [analyticsWorker]);

  const processFornecedoresDataWithCache = useCallback(async (data: any, queryKey: string[]) => {
    return analyticsWorker.processFornecedoresData(data);
  }, [analyticsWorker]);

  const processOrcamentoDataWithCache = useCallback(async (data: any, queryKey: string[]) => {
    return analyticsWorker.processOrcamentoData(data);
  }, [analyticsWorker]);

  return {
    ...analyticsWorker,
    calculateKPIsWithCache,
    processFaturamentoAnalyticsWithCache,
    processFluxoCaixaDataWithCache,
    processFornecedoresDataWithCache,
    processOrcamentoDataWithCache
  };
}