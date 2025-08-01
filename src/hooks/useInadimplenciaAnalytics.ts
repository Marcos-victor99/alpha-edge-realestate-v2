import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  InadimplenciaRecord, 
  RiskScore, 
  PredictiveAnalysis, 
  AnomalyDetection, 
  SegmentationAnalysis 
} from '@/workers/inadimplencia-analytics.worker';

interface AnalyticsWorkerResult<T = any> {
  requestId: string;
  success: boolean;
  result?: T;
  error?: string;
}

interface UseInadimplenciaAnalyticsReturn {
  calculateRiskScores: (data: InadimplenciaRecord[]) => Promise<RiskScore[]>;
  generatePredictions: (data: InadimplenciaRecord[]) => Promise<PredictiveAnalysis[]>;
  detectAnomalies: (data: InadimplenciaRecord[]) => Promise<AnomalyDetection[]>;
  analyzeSegmentation: (data: InadimplenciaRecord[]) => Promise<SegmentationAnalysis[]>;
  isCalculating: boolean;
  error: string | null;
  workerSupported: boolean;
}

export function useInadimplenciaAnalytics(): UseInadimplenciaAnalyticsReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerSupported, setWorkerSupported] = useState(true);
  
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Inicializar worker
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      setWorkerSupported(false);
      console.warn('Web Workers não suportados neste navegador');
      return;
    }

    try {
      workerRef.current = new Worker(
        new URL('../workers/inadimplencia-analytics.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<AnalyticsWorkerResult>) => {
        const { requestId, success, result, error: workerError } = e.data;
        const request = pendingRequests.current.get(requestId);
        
        if (request) {
          pendingRequests.current.delete(requestId);
          
          if (success) {
            request.resolve(result);
          } else {
            request.reject(new Error(workerError || 'Erro desconhecido no worker'));
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Erro no worker de analytics:', error);
        setError('Erro no worker de analytics de inadimplência');
        setWorkerSupported(false);
      };

    } catch (error) {
      console.error('Falha ao inicializar worker:', error);
      setWorkerSupported(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      pendingRequests.current.clear();
    };
  }, []);

  // Função genérica para executar análises no worker
  const executeAnalysis = useCallback(async <T>(
    type: string, 
    data: InadimplenciaRecord[]
  ): Promise<T> => {
    if (!workerSupported) {
      throw new Error('Web Workers não suportados');
    }

    if (!workerRef.current) {
      throw new Error('Worker não inicializado');
    }

    if (!data || data.length === 0) {
      throw new Error('Dados de inadimplência não fornecidos');
    }

    setIsCalculating(true);
    setError(null);

    const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<T>((resolve, reject) => {
      pendingRequests.current.set(requestId, { resolve, reject });

      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        pendingRequests.current.delete(requestId);
        reject(new Error('Timeout na análise de inadimplência'));
      }, 30000);

      try {
        workerRef.current!.postMessage({
          type,
          data,
          requestId
        });

        // Limpar timeout quando completar
        const originalResolve = resolve;
        const originalReject = reject;
        
        pendingRequests.current.set(requestId, {
          resolve: (value) => {
            clearTimeout(timeout);
            setIsCalculating(false);
            originalResolve(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            setIsCalculating(false);
            setError(error.message);
            originalReject(error);
          }
        });

      } catch (error) {
        clearTimeout(timeout);
        pendingRequests.current.delete(requestId);
        setIsCalculating(false);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        reject(error);
      }
    });
  }, [workerSupported]);

  // Implementações específicas das análises
  const calculateRiskScores = useCallback(async (data: InadimplenciaRecord[]): Promise<RiskScore[]> => {
    try {
      const result = await executeAnalysis<RiskScore[]>('calculateRiskScores', data);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao calcular risk scores:', error);
      throw error;
    }
  }, [executeAnalysis]);

  const generatePredictions = useCallback(async (data: InadimplenciaRecord[]): Promise<PredictiveAnalysis[]> => {
    try {
      const result = await executeAnalysis<PredictiveAnalysis[]>('generatePredictions', data);
      
      return result;
    } catch (error) {
      console.error('❌ Erro na análise preditiva:', error);
      throw error;
    }
  }, [executeAnalysis]);

  const detectAnomalies = useCallback(async (data: InadimplenciaRecord[]): Promise<AnomalyDetection[]> => {
    try {
      const result = await executeAnalysis<AnomalyDetection[]>('detectAnomalies', data);
      
      return result;
    } catch (error) {
      console.error('❌ Erro na detecção de anomalias:', error);
      throw error;
    }
  }, [executeAnalysis]);

  const analyzeSegmentation = useCallback(async (data: InadimplenciaRecord[]): Promise<SegmentationAnalysis[]> => {
    try {
      const result = await executeAnalysis<SegmentationAnalysis[]>('analyzeSegmentation', data);
      
      return result;
    } catch (error) {
      console.error('❌ Erro na análise de segmentação:', error);
      throw error;
    }
  }, [executeAnalysis]);

  return {
    calculateRiskScores,
    generatePredictions,
    detectAnomalies,
    analyzeSegmentation,
    isCalculating,
    error,
    workerSupported
  };
}

// Hook simplificado para usar junto com dados de inadimplência
export function useInadimplenciaIntelligence(data: InadimplenciaRecord[] | undefined) {
  const analytics = useInadimplenciaAnalytics();
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalysis[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [lastProcessedData, setLastProcessedData] = useState<InadimplenciaRecord[]>([]);

  // Auto-processar quando dados mudarem
  useEffect(() => {
    if (!data || data.length === 0) return;
    if (analytics.isCalculating) return;
    
    // Verificar se dados mudaram significativamente
    const dataChanged = data.length !== lastProcessedData.length ||
      data.some((record, index) => 
        !lastProcessedData[index] || record.id !== lastProcessedData[index].id
      );

    if (!dataChanged) return;

    const processData = async () => {
      try {
        
        // Executar análises em paralelo (limitando para não sobrecarregar)
        const [riskScoresResult, predictionsResult, anomaliesResult] = await Promise.allSettled([
          analytics.calculateRiskScores(data),
          analytics.generatePredictions(data),
          analytics.detectAnomalies(data)
        ]);

        if (riskScoresResult.status === 'fulfilled') {
          setRiskScores(riskScoresResult.value);
        } else {
          console.error('Erro ao calcular risk scores:', riskScoresResult.reason);
        }

        if (predictionsResult.status === 'fulfilled') {
          setPredictions(predictionsResult.value);
        } else {
          console.error('Erro nas predições:', predictionsResult.reason);
        }

        if (anomaliesResult.status === 'fulfilled') {
          setAnomalies(anomaliesResult.value);
        } else {
          console.error('Erro na detecção de anomalias:', anomaliesResult.reason);
        }

        setLastProcessedData([...data]);
        
      } catch (error) {
        console.error('❌ Erro no processamento de inteligência:', error);
      }
    };

    // Debounce para evitar processamento excessivo
    const timeoutId = setTimeout(processData, 500);
    return () => clearTimeout(timeoutId);
    
  }, [data, analytics, lastProcessedData]);

  return {
    ...analytics,
    riskScores,
    predictions,
    anomalies,
    insights: {
      highRiskClients: riskScores.filter(r => r.riskCategory === 'alto' || r.riskCategory === 'critico').length,
      criticalAnomalies: anomalies.filter(a => a.severidade === 'critica').length,
      avgRiskScore: riskScores.length > 0 ? riskScores.reduce((sum, r) => sum + r.riskScore, 0) / riskScores.length : 0,
      totalPredictedIncrease: predictions.reduce((sum, p) => sum + p.previsao30Dias.inadimplenciaEsperada, 0)
    }
  };
}