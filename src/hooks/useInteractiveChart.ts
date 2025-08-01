import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChartInteraction {
  type: 'click' | 'hover' | 'drill' | 'filter' | 'export';
  data: any;
  timestamp: number;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface InteractiveChartState {
  selectedData: any | null;
  hoveredData: any | null;
  activeFilters: Record<string, any>;
  interactionHistory: ChartInteraction[];
  isInteracting: boolean;
}

export interface UseInteractiveChartOptions {
  persistState?: boolean;
  maxHistoryLength?: number;
  debounceMs?: number;
  onInteraction?: (interaction: ChartInteraction) => void | Promise<void>;
}

export function useInteractiveChart(
  chartId: string,
  options: UseInteractiveChartOptions = {}
) {
  const {
    persistState = false,
    maxHistoryLength = 50,
    debounceMs = 100,
    onInteraction
  } = options;

  // Estado principal
  const [state, setState] = useState<InteractiveChartState>(() => {
    const initialState: InteractiveChartState = {
      selectedData: null,
      hoveredData: null,
      activeFilters: {},
      interactionHistory: [],
      isInteracting: false
    };

    // Recuperar estado persistido se necessário
    if (persistState && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`chart-state-${chartId}`);
        if (saved) {
          const parsedState = JSON.parse(saved);
          return {
            ...initialState,
            activeFilters: parsedState.activeFilters || {},
            selectedData: parsedState.selectedData || null
          };
        }
      } catch (error) {
        console.warn('Falha ao recuperar estado do gráfico:', error);
      }
    }

    return initialState;
  });

  // Refs para debounce e controle
  const debounceRef = useRef<NodeJS.Timeout>();
  const isInteractingRef = useRef(false);

  // Persistir estado quando necessário
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      const stateToSave = {
        activeFilters: state.activeFilters,
        selectedData: state.selectedData
      };
      localStorage.setItem(`chart-state-${chartId}`, JSON.stringify(stateToSave));
    }
  }, [state.activeFilters, state.selectedData, chartId, persistState]);

  // Handler principal de interação
  const handleInteraction = useCallback(async (
    type: ChartInteraction['type'],
    data: any,
    metadata?: Record<string, any>
  ) => {
    // Debounce para evitar spam de interações
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const interaction: ChartInteraction = {
      type,
      data,
      timestamp: Date.now(),
      metadata
    };

    // Definir flag de interação ativa
    isInteractingRef.current = true;
    setState(prev => ({ ...prev, isInteracting: true }));

    debounceRef.current = setTimeout(async () => {
      try {
        // Callback personalizado
        if (onInteraction) {
          await onInteraction(interaction);
        }

        // Atualizar estado baseado no tipo de interação
        setState(prev => {
          const newState = { ...prev };

          switch (type) {
            case 'click':
              newState.selectedData = data;
              break;
            
            case 'hover':
              newState.hoveredData = data;
              break;
            
            case 'filter':
              newState.activeFilters = { ...prev.activeFilters, ...data };
              break;
            
            case 'drill':
              newState.selectedData = data;
              break;
          }

          // Atualizar histórico
          newState.interactionHistory = [
            interaction,
            ...prev.interactionHistory.slice(0, maxHistoryLength - 1)
          ];

          newState.isInteracting = false;
          return newState;
        });
      } catch (error) {
        console.error('Erro ao processar interação:', error);
        setState(prev => ({ ...prev, isInteracting: false }));
      } finally {
        isInteractingRef.current = false;
      }
    }, debounceMs);
  }, [onInteraction, maxHistoryLength, debounceMs]);

  // Handlers específicos para cada tipo de interação
  const handleClick = useCallback((data: any, metadata?: Record<string, any>) => {
    return handleInteraction('click', data, metadata);
  }, [handleInteraction]);

  const handleHover = useCallback((data: any, metadata?: Record<string, any>) => {
    return handleInteraction('hover', data, metadata);
  }, [handleInteraction]);

  const handleDrill = useCallback((data: any, metadata?: Record<string, any>) => {
    return handleInteraction('drill', data, metadata);
  }, [handleInteraction]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    return handleInteraction('filter', filters);
  }, [handleInteraction]);

  const handleExport = useCallback((data: any, format = 'json') => {
    return handleInteraction('export', { data, format });
  }, [handleInteraction]);

  // Limpar seleção
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedData: null,
      hoveredData: null
    }));
  }, []);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeFilters: {}
    }));
  }, []);

  // Reset completo do estado
  const resetState = useCallback(() => {
    setState({
      selectedData: null,
      hoveredData: null,
      activeFilters: {},
      interactionHistory: [],
      isInteracting: false
    });

    if (persistState && typeof window !== 'undefined') {
      localStorage.removeItem(`chart-state-${chartId}`);
    }
  }, [persistState, chartId]);

  // Obter última interação de um tipo específico
  const getLastInteraction = useCallback((type: ChartInteraction['type']) => {
    return state.interactionHistory.find(interaction => interaction.type === type);
  }, [state.interactionHistory]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useCallback(() => {
    return Object.keys(state.activeFilters).length > 0;
  }, [state.activeFilters]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // Estado
    selectedData: state.selectedData,
    hoveredData: state.hoveredData,
    activeFilters: state.activeFilters,
    interactionHistory: state.interactionHistory,
    isInteracting: state.isInteracting,

    // Handlers de interação
    handleInteraction,
    handleClick,
    handleHover,
    handleDrill,
    handleFilter,
    handleExport,

    // Utilitários
    clearSelection,
    clearFilters,
    resetState,
    getLastInteraction,
    hasActiveFilters
  };
}