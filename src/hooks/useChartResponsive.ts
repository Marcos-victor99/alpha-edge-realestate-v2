import { useState, useEffect, useCallback, useRef } from 'react';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ChartHeight = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig {
  breakpoints: Record<BreakpointSize, number>;
  chartHeights: Record<ChartHeight, string>;
  gridColumns: Record<BreakpointSize, number>;
  hideOnMobile: string[];
  hideOnTablet: string[];
}

export interface ChartDimensions {
  width: number;
  height: number;
  containerWidth: number;
  containerHeight: number;
}

export interface ResponsiveChartConfig {
  currentBreakpoint: BreakpointSize;
  deviceType: DeviceType;
  dimensions: ChartDimensions;
  gridColumns: number;
  chartHeight: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  shouldHideOnMobile: (element: string) => boolean;
  shouldHideOnTablet: (element: string) => boolean;
}

const defaultConfig: ResponsiveConfig = {
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  chartHeights: {
    xs: '200px',
    sm: '250px',
    md: '300px',
    lg: '400px',
    xl: '500px',
    full: '100%'
  },
  gridColumns: {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4
  },
  hideOnMobile: ['subtitle', 'legend', 'tooltip', 'breadcrumb'],
  hideOnTablet: ['subtitle', 'breadcrumb']
};

export function useChartResponsive(
  containerRef?: React.RefObject<HTMLElement>,
  config: Partial<ResponsiveConfig> = {}
) {
  const mergedConfig: ResponsiveConfig = { ...defaultConfig, ...config };
  
  // Estado responsivo
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0
  });

  // Refs para observadores
  const resizeObserverRef = useRef<ResizeObserver>();

  // Determinar breakpoint atual
  const getCurrentBreakpoint = useCallback((width: number): BreakpointSize => {
    const breakpoints = mergedConfig.breakpoints;
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, [mergedConfig.breakpoints]);

  // Determinar tipo de dispositivo
  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < mergedConfig.breakpoints.md) return 'mobile';
    if (width < mergedConfig.breakpoints.lg) return 'tablet';
    return 'desktop';
  }, [mergedConfig.breakpoints]);

  // Calcular dimensões do gráfico
  const calculateChartDimensions = useCallback((
    containerWidth: number,
    containerHeight: number,
    breakpoint: BreakpointSize
  ): ChartDimensions => {
    // Considerar padding e margens
    const padding = breakpoint === 'xs' || breakpoint === 'sm' ? 16 : 24;
    
    return {
      width: Math.max(containerWidth - (padding * 2), 280),
      height: Math.max(containerHeight - (padding * 2), 200),
      containerWidth,
      containerHeight
    };
  }, []);

  // Configuração responsiva atual
  const currentBreakpoint = getCurrentBreakpoint(windowDimensions.width);
  const deviceType = getDeviceType(windowDimensions.width);
  const dimensions = calculateChartDimensions(
    containerDimensions.width || windowDimensions.width,
    containerDimensions.height || 400,
    currentBreakpoint
  );

  const responsiveConfig: ResponsiveChartConfig = {
    currentBreakpoint,
    deviceType,
    dimensions,
    gridColumns: mergedConfig.gridColumns[currentBreakpoint],
    chartHeight: mergedConfig.chartHeights.md, // Default
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    
    shouldHideOnMobile: (element: string) => {
      return deviceType === 'mobile' && mergedConfig.hideOnMobile.includes(element);
    },
    
    shouldHideOnTablet: (element: string) => {
      return deviceType === 'tablet' && mergedConfig.hideOnTablet.includes(element);
    }
  };

  // Handler para resize da janela
  const handleWindowResize = useCallback(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // Observer para container específico
  useEffect(() => {
    if (!containerRef?.current) return;

    const element = containerRef.current;

    // Configurar ResizeObserver
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
      }
    });

    resizeObserverRef.current.observe(element);

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [containerRef]);

  // Listener para resize da janela
  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, [handleWindowResize]);

  // Utilitários para configurações específicas de gráficos
  const getChartProps = useCallback((chartType: string) => {
    const baseProps = {
      showLegend: !responsiveConfig.shouldHideOnMobile('legend'),
      showTooltip: !responsiveConfig.shouldHideOnMobile('tooltip'),
      showGridLines: responsiveConfig.isDesktop,
      className: `h-full w-full`
    };

    // Configurações específicas por tipo de gráfico
    const chartSpecificProps: Record<string, any> = {
      bar: {
        layout: responsiveConfig.isMobile ? 'vertical' : 'horizontal',
        showXAxis: !responsiveConfig.isMobile,
        showYAxis: true
      },
      line: {
        showDots: responsiveConfig.isDesktop,
        strokeWidth: responsiveConfig.isMobile ? 2 : 3,
        connectNulls: true
      },
      area: {
        showDots: false,
        strokeWidth: responsiveConfig.isMobile ? 1 : 2,
        fillOpacity: responsiveConfig.isMobile ? 0.3 : 0.4
      },
      donut: {
        showLabel: responsiveConfig.isDesktop,
        innerRadius: responsiveConfig.isMobile ? '40%' : '50%'
      },
      treemap: {
        tile: responsiveConfig.isMobile ? 'squarify' : 'binary',
        aspectRatio: responsiveConfig.isMobile ? 1 : 1.6
      }
    };

    return {
      ...baseProps,
      ...(chartSpecificProps[chartType] || {})
    };
  }, [responsiveConfig]);

  // Obter altura ideal para um tipo de componente
  const getComponentHeight = useCallback((component: 'chart' | 'kpi' | 'table'): ChartHeight => {
    if (responsiveConfig.isMobile) {
      return component === 'kpi' ? 'xs' : 'sm';
    }
    if (responsiveConfig.isTablet) {
      return component === 'kpi' ? 'sm' : 'md';
    }
    return component === 'kpi' ? 'md' : 'lg';
  }, [responsiveConfig]);

  // Obter configuração de grid responsiva
  const getGridConfig = useCallback(() => {
    return {
      numItems: 1,
      numItemsSm: Math.min(responsiveConfig.gridColumns, 2),
      numItemsMd: Math.min(responsiveConfig.gridColumns, 3),
      numItemsLg: responsiveConfig.gridColumns,
      className: `gap-${responsiveConfig.isMobile ? '4' : '6'}`
    };
  }, [responsiveConfig]);

  // Obter configuração de margens e padding
  const getSpacing = useCallback(() => {
    return {
      padding: responsiveConfig.isMobile ? 'p-4' : 'p-6',
      margin: responsiveConfig.isMobile ? 'space-y-4' : 'space-y-6',
      gap: responsiveConfig.isMobile ? 'gap-4' : 'gap-6'
    };
  }, [responsiveConfig]);

  // Determinar se deve usar layout compacto
  const shouldUseCompactLayout = useCallback(() => {
    return responsiveConfig.isMobile || 
           (responsiveConfig.isTablet && dimensions.width < 600);
  }, [responsiveConfig, dimensions.width]);

  // Obter configuração de fonte
  const getFontConfig = useCallback(() => {
    if (responsiveConfig.isMobile) {
      return {
        titleSize: 'text-lg',
        subtitleSize: 'text-sm',
        labelSize: 'text-xs'
      };
    }
    if (responsiveConfig.isTablet) {
      return {
        titleSize: 'text-xl',
        subtitleSize: 'text-base',
        labelSize: 'text-sm'
      };
    }
    return {
      titleSize: 'text-2xl',
      subtitleSize: 'text-lg',
      labelSize: 'text-base'
    };
  }, [responsiveConfig]);

  return {
    // Configuração atual
    ...responsiveConfig,

    // Utilitários
    getChartProps,
    getComponentHeight,
    getGridConfig,
    getSpacing,
    getFontConfig,
    shouldUseCompactLayout,

    // Dados brutos
    windowDimensions,
    containerDimensions
  };
}