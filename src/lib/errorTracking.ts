/**
 * 🚨 Sistema de Rastreamento de Erros - Preparado para Sentry
 * 
 * Este módulo centraliza o logging e rastreamento de erros do dashboard,
 * com integração futura para Sentry e análise automática de padrões.
 */

// 📊 Interface para eventos de erro estruturados
interface ErrorEvent {
  id: string;
  timestamp: string;
  type: 'data' | 'render' | 'network' | 'validation' | 'unknown';
  component: string;
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  metadata: Record<string, unknown>;
}

// 🎯 Interface para contexto de dashboard
interface DashboardContext {
  financialDataStatus: 'loading' | 'loaded' | 'error';
  activeRoute: string;
  viewport: { width: number; height: number };
  timestamp: string;
}

// 📈 Classe principal de rastreamento de erros
class ErrorTracker {
  private sessionId: string;
  private errorBuffer: ErrorEvent[] = [];
  private context: Partial<DashboardContext> = {};
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeEventListeners();
    this.startPeriodicFlush();
  }

  // 🆔 Gerar ID único de sessão
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🎧 Configurar listeners para eventos de erro
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Capturar eventos do ErrorBoundary
    window.addEventListener('dashboard-error', (event: CustomEvent) => {
      this.captureError({
        type: event.detail.type || 'unknown',
        component: event.detail.component || 'unknown',
        message: event.detail.error || 'Erro desconhecido',
        stack: event.detail.stack,
        metadata: event.detail
      });
    });

    // Capturar erros JavaScript globais
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'render',
        component: 'global',
        message: event.message,
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Capturar erros de promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'network',
        component: 'promise',
        message: event.reason?.message || 'Promise rejeitada',
        stack: event.reason?.stack,
        metadata: {
          reason: event.reason
        }
      });
    });
  }

  // 📝 Atualizar contexto do dashboard
  public updateContext(newContext: Partial<DashboardContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  // 🚨 Capturar erro específico
  public captureError(error: {
    type: ErrorEvent['type'];
    component: string;
    message: string;
    stack?: string;
    metadata?: Record<string, unknown>;
  }): void {
    if (!this.isEnabled) return;

    const errorEvent: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: error.type,
      component: error.component,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      metadata: {
        ...error.metadata,
        context: this.context
      }
    };

    this.errorBuffer.push(errorEvent);

    // Log estruturado para desenvolvimento
    this.logError(errorEvent);

    // Flush imediato para erros críticos
    if (error.type === 'data' || error.type === 'validation') {
      this.flushErrors();
    }
  }

  // 📊 Log estruturado para desenvolvimento
  private logError(error: ErrorEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 [ErrorTracker] ${error.type.toUpperCase()} - ${error.component}`);
      console.error('Mensagem:', error.message);
      console.error('Timestamp:', error.timestamp);
      console.error('Sessão:', error.sessionId);
      console.error('URL:', error.url);
      if (error.stack) console.error('Stack:', error.stack);
      console.error('Contexto:', error.metadata.context);
      console.error('Metadata:', error.metadata);
      console.groupEnd();
    }
  }

  // 💾 Enviar erros para serviço de tracking
  private async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const errorsToSend = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      // 🔮 Preparado para integração com Sentry
      if (typeof window !== 'undefined' && (window as { Sentry?: unknown }).Sentry) {
        errorsToSend.forEach(error => {
          (window as { Sentry: { captureException: (error: Error, options: unknown) => void } }).Sentry.captureException(new Error(error.message), {
            tags: {
              component: error.component,
              type: error.type,
              sessionId: error.sessionId
            },
            extra: error.metadata,
            level: this.getSentryLevel(error.type)
          });
        });
      }

      // 📊 Fallback: localStorage para análise local
      this.storeErrorsLocally(errorsToSend);

      // 📈 Análise de padrões em tempo real
      this.analyzeErrorPatterns(errorsToSend);

    } catch (flushError) {
      console.error('Erro ao enviar logs de erro:', flushError);
      // Recolocar erros no buffer se falha
      this.errorBuffer.unshift(...errorsToSend);
    }
  }

  // 🎚️ Converter tipo de erro para nível Sentry
  private getSentryLevel(type: ErrorEvent['type']): string {
    const levelMap = {
      'data': 'warning',
      'validation': 'warning', 
      'network': 'error',
      'render': 'error',
      'unknown': 'error'
    };
    return levelMap[type] || 'error';
  }

  // 💾 Armazenar erros localmente para análise
  private storeErrorsLocally(errors: ErrorEvent[]): void {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('dashboard-errors') || '[]');
      const allErrors = [...existingErrors, ...errors];
      
      // Manter apenas os 100 erros mais recentes
      const recentErrors = allErrors.slice(-100);
      localStorage.setItem('dashboard-errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Erro ao armazenar logs localmente:', e);
    }
  }

  // 🔍 Análise automática de padrões de erro
  private analyzeErrorPatterns(errors: ErrorEvent[]): void {
    const patterns = {
      frequentComponents: new Map<string, number>(),
      errorTypes: new Map<string, number>(),
      timePatterns: new Map<string, number>()
    };

    errors.forEach(error => {
      // Contabilizar componentes com mais erros
      patterns.frequentComponents.set(
        error.component, 
        (patterns.frequentComponents.get(error.component) || 0) + 1
      );

      // Contabilizar tipos de erro
      patterns.errorTypes.set(
        error.type,
        (patterns.errorTypes.get(error.type) || 0) + 1
      );

      // Análise temporal (hora do dia)
      const hour = new Date(error.timestamp).getHours();
      patterns.timePatterns.set(
        hour.toString(),
        (patterns.timePatterns.get(hour.toString()) || 0) + 1
      );
    });

    // Log de insights automáticos
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Análise de Padrões de Erro');
      console.log('Componentes mais problemáticos:', Object.fromEntries(patterns.frequentComponents));
      console.log('Tipos de erro mais comuns:', Object.fromEntries(patterns.errorTypes));
      console.log('Padrões temporais:', Object.fromEntries(patterns.timePatterns));
      console.groupEnd();
    }
  }

  // ⏰ Flush periódico de erros
  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.errorBuffer.length > 0) {
        this.flushErrors();
      }
    }, 30000); // Flush a cada 30 segundos
  }

  // 📈 Obter estatísticas de erro da sessão
  public getSessionStats(): {
    sessionId: string;
    errorCount: number;
    lastError?: ErrorEvent;
    context: Partial<DashboardContext>;
  } {
    const storedErrors = JSON.parse(localStorage.getItem('dashboard-errors') || '[]');
    const sessionErrors = storedErrors.filter((e: ErrorEvent) => e.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      errorCount: sessionErrors.length,
      lastError: sessionErrors[sessionErrors.length - 1],
      context: this.context
    };
  }

  // 🎛️ Controlar tracking
  public disable(): void {
    this.isEnabled = false;
  }

  public enable(): void {
    this.isEnabled = true;
  }
}

// 🌟 Instância global do tracker
export const errorTracker = new ErrorTracker();

// 🎣 Hook para componentes React
export const useErrorTracking = () => {
  return {
    captureError: (error: Parameters<typeof errorTracker.captureError>[0]) => 
      errorTracker.captureError(error),
    updateContext: (context: Partial<DashboardContext>) => 
      errorTracker.updateContext(context),
    getStats: () => errorTracker.getSessionStats()
  };
};

// 📊 Função utilitária para inicializar no main.tsx
export const initializeErrorTracking = () => {
  if (typeof window !== 'undefined') {
    // Contexto inicial
    errorTracker.updateContext({
      activeRoute: window.location.pathname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    });

    // Atualizar contexto em mudanças de rota
    window.addEventListener('popstate', () => {
      errorTracker.updateContext({
        activeRoute: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    });

    console.log('🚨 Sistema de rastreamento de erros inicializado');
  }
};

export default errorTracker;