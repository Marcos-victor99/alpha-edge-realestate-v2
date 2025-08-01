import { useState, useCallback, useRef, useEffect } from 'react';

export interface DrilldownLevel {
  id: string;
  title: string;
  subtitle?: string;
  data: any[];
  chartType: 'bar' | 'line' | 'area' | 'donut' | 'combo' | 'custom';
  chartProps: any;
  customComponent?: React.ComponentType<any>;
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  parentData?: any;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'date' | 'range';
  options?: any[];
  defaultValue?: any;
}

export interface ActionConfig {
  id: string;
  label: string;
  icon: React.ComponentType;
  onClick: (data: any) => void;
}

export interface NavigationHistoryItem {
  level: number;
  data: any;
  timestamp: number;
  title: string;
}

export interface BreadcrumbItem {
  level: number;
  title: string;
  data?: any;
  isActive: boolean;
}

export interface UseDrilldownNavigationOptions {
  maxHistoryLength?: number;
  persistHistory?: boolean;
  onNavigate?: (fromLevel: number, toLevel: number, data?: any) => void;
}

export function useDrilldownNavigation(
  levels: DrilldownLevel[],
  persistHistory = false,
  options: UseDrilldownNavigationOptions = {}
) {
  const {
    maxHistoryLength = 20,
    onNavigate
  } = options;

  // Estado de navegação
  const [currentLevel, setCurrentLevel] = useState(0);
  const [history, setHistory] = useState<NavigationHistoryItem[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Refs para controle
  const historyRef = useRef<NavigationHistoryItem[]>([]);
  const navigationId = useRef(`nav-${Date.now()}-${Math.random()}`);

  // Sincronizar history ref
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Recuperar histórico persistido
  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`drilldown-history-${navigationId.current}`);
        if (saved) {
          const parsedHistory = JSON.parse(saved);
          setHistory(parsedHistory);
          historyRef.current = parsedHistory;
        }
      } catch (error) {
        console.warn('Falha ao recuperar histórico de navegação:', error);
      }
    }
  }, [persistHistory]);

  // Persistir histórico quando mudado
  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined' && history.length > 0) {
      localStorage.setItem(`drilldown-history-${navigationId.current}`, JSON.stringify(history));
    }
  }, [history, persistHistory]);

  // Adicionar item ao histórico
  const addToHistory = useCallback((level: number, data: any, title?: string) => {
    const historyItem: NavigationHistoryItem = {
      level,
      data,
      timestamp: Date.now(),
      title: title || levels[level]?.title || `Nível ${level}`
    };

    setHistory(prev => {
      const filtered = prev.filter(item => item.level !== level);
      const newHistory = [historyItem, ...filtered].slice(0, maxHistoryLength);
      return newHistory;
    });
  }, [levels, maxHistoryLength]);

  // Navegar para nível específico
  const goToLevel = useCallback((targetLevel: number, data?: any) => {
    if (targetLevel < 0 || targetLevel >= levels.length) {
      console.warn(`Nível inválido: ${targetLevel}. Deve estar entre 0 e ${levels.length - 1}`);
      return currentLevel;
    }

    if (targetLevel === currentLevel) {
      return currentLevel;
    }

    setIsNavigating(true);

    try {
      // Callback de navegação
      if (onNavigate) {
        onNavigate(currentLevel, targetLevel, data);
      }

      // Atualizar nível atual
      const previousLevel = currentLevel;
      setCurrentLevel(targetLevel);

      // Adicionar ao histórico se não for navegação para trás
      if (targetLevel > currentLevel && data) {
        addToHistory(targetLevel, data, levels[targetLevel]?.title);
      }

      return targetLevel;
    } finally {
      // Reset flag com delay para animações
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [currentLevel, levels, onNavigate, addToHistory]);

  // Voltar um nível
  const goBack = useCallback(() => {
    if (currentLevel > 0) {
      return goToLevel(currentLevel - 1);
    }
    return currentLevel;
  }, [currentLevel, goToLevel]);

  // Avançar um nível (se houver histórico)
  const goForward = useCallback(() => {
    const nextLevelItem = history.find(item => item.level === currentLevel + 1);
    if (nextLevelItem && currentLevel < levels.length - 1) {
      return goToLevel(currentLevel + 1, nextLevelItem.data);
    }
    return currentLevel;
  }, [currentLevel, history, levels.length, goToLevel]);

  // Ir para o nível raiz
  const goToRoot = useCallback(() => {
    return goToLevel(0);
  }, [goToLevel]);

  // Verificar se pode voltar
  const canGoBack = useCallback(() => {
    return currentLevel > 0;
  }, [currentLevel]);

  // Verificar se pode avançar
  const canGoForward = useCallback(() => {
    return currentLevel < levels.length - 1 && 
           history.some(item => item.level === currentLevel + 1);
  }, [currentLevel, levels.length, history]);

  // Obter breadcrumbs para navegação visual
  const getBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Sempre incluir o nível raiz
    breadcrumbs.push({
      level: 0,
      title: levels[0]?.title || 'Início',
      isActive: currentLevel === 0
    });

    // Adicionar níveis intermediários baseados no histórico
    for (let i = 1; i <= currentLevel; i++) {
      const historyItem = history.find(item => item.level === i);
      breadcrumbs.push({
        level: i,
        title: historyItem?.title || levels[i]?.title || `Nível ${i}`,
        data: historyItem?.data,
        isActive: currentLevel === i
      });
    }

    return breadcrumbs;
  }, [currentLevel, levels, history]);

  // Obter dados do nível atual
  const getCurrentLevelData = useCallback(() => {
    return levels[currentLevel];
  }, [levels, currentLevel]);

  // Obter dados do histórico para um nível específico
  const getHistoryForLevel = useCallback((level: number) => {
    return history.find(item => item.level === level);
  }, [history]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (persistHistory && typeof window !== 'undefined') {
      localStorage.removeItem(`drilldown-history-${navigationId.current}`);
    }
  }, [persistHistory]);

  // Reset completo para nível raiz
  const reset = useCallback(() => {
    setCurrentLevel(0);
    clearHistory();
  }, [clearHistory]);

  // Obter caminho completo da navegação atual
  const getNavigationPath = useCallback(() => {
    const path = [];
    for (let i = 0; i <= currentLevel; i++) {
      const historyItem = history.find(item => item.level === i);
      path.push({
        level: i,
        title: levels[i]?.title || `Nível ${i}`,
        data: historyItem?.data
      });
    }
    return path;
  }, [currentLevel, history, levels]);

  // Verificar se há dados no histórico para um nível
  const hasDataForLevel = useCallback((level: number) => {
    return history.some(item => item.level === level);
  }, [history]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (persistHistory && typeof window !== 'undefined' && history.length === 0) {
        localStorage.removeItem(`drilldown-history-${navigationId.current}`);
      }
    };
  }, [persistHistory, history.length]);

  return {
    // Estado atual
    currentLevel,
    history,
    isNavigating,

    // Navegação principal
    goToLevel,
    goBack,
    goForward,
    goToRoot,

    // Verificações
    canGoBack,
    canGoForward,
    hasDataForLevel,

    // Dados e informações
    getCurrentLevelData,
    getHistoryForLevel,
    getBreadcrumbs,
    getNavigationPath,

    // Controle do histórico
    addToHistory,
    clearHistory,
    reset
  };
}