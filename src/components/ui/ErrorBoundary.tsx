import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Title, Text, Flex, Badge } from '@tremor/react';
import { AlertTriangle, RefreshCw, Database, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// 🛡️ Tipos de erro para melhor categorização
type ErrorType = 'data' | 'render' | 'network' | 'validation' | 'unknown';

interface ErrorInfo {
  type: ErrorType;
  message: string;
  suggestion: string;
  icon: React.ElementType;
  color: 'red' | 'amber' | 'blue';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// 🔍 Função para classificar tipos de erro
const classifyError = (error: Error): ErrorInfo => {
  const message = error.message.toLowerCase();
  
  // Erro específico de .toFixed() - nosso caso principal
  if (message.includes('toFixed') || message.includes('read properties of undefined')) {
    return {
      type: 'data',
      message: 'Dados financeiros incompletos',
      suggestion: 'Verifique a conexão com o Supabase e tente recarregar',
      icon: Database,
      color: 'amber'
    };
  }
  
  // Erros de validação de dados
  if (message.includes('undefined') || message.includes('null') || message.includes('cannot read')) {
    return {
      type: 'validation',
      message: 'Dados ausentes ou malformados',
      suggestion: 'Aguarde o carregamento completo dos dados',
      icon: AlertTriangle,
      color: 'amber'
    };
  }
  
  // Erros de rede
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      type: 'network',
      message: 'Problema de conectividade',
      suggestion: 'Verifique sua conexão e tente novamente',
      icon: RefreshCw,
      color: 'blue'
    };
  }
  
  // Erros de renderização
  if (message.includes('render') || message.includes('hook')) {
    return {
      type: 'render',
      message: 'Erro de renderização do componente',
      suggestion: 'Problema técnico temporário',
      icon: Bug,
      color: 'red'
    };
  }
  
  // Erro desconhecido
  return {
    type: 'unknown',
    message: 'Erro inesperado',
    suggestion: 'Contate o suporte se o problema persistir',
    icon: AlertTriangle,
    color: 'red'
  };
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 🔍 Classifica o erro para melhor tratamento
    const errorInfo = classifyError(error);
    
    return { 
      hasError: true, 
      error, 
      errorInfo 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 📊 Log estruturado do erro para debugging
    const classification = classifyError(error);
    
    console.group(`🛡️ ErrorBoundary capturou erro [${classification.type.toUpperCase()}]`);
    console.error('Componente:', this.props.componentName || 'desconhecido');
    console.error('Tipo:', classification.type);
    console.error('Erro:', error);
    console.error('Stack:', errorInfo.componentStack);
    console.error('Sugestão:', classification.suggestion);
    console.groupEnd();
    
    // 🚨 Enviar para Sentry (preparação para Fase 4)
    if (typeof window !== 'undefined') {
      // Preparado para integração com Sentry
      window.dispatchEvent(new CustomEvent('dashboard-error', {
        detail: {
          error: error.message,
          component: this.props.componentName,
          type: classification.type,
          stack: errorInfo.componentStack
        }
      }));
    }
    
    // Callback customizado para tratamento de erro
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // 🔄 Recarregar página para errors críticos de dados
    if (this.state.errorInfo?.type === 'data') {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback customizada ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorInfo, error } = this.state;
      const IconComponent = errorInfo?.icon || AlertTriangle;
      const colorClass = errorInfo?.color || 'red';
      
      const borderColor = colorClass === 'amber' ? 'border-amber-200' : 
                         colorClass === 'blue' ? 'border-blue-200' : 'border-red-200';
      const bgColor = colorClass === 'amber' ? 'bg-amber-50' : 
                     colorClass === 'blue' ? 'bg-blue-50' : 'bg-red-50';
      const iconBgColor = colorClass === 'amber' ? 'bg-amber-100' : 
                         colorClass === 'blue' ? 'bg-blue-100' : 'bg-red-100';
      const iconColor = colorClass === 'amber' ? 'text-amber-600' : 
                       colorClass === 'blue' ? 'text-blue-600' : 'text-red-600';
      const titleColor = colorClass === 'amber' ? 'text-amber-800' : 
                        colorClass === 'blue' ? 'text-blue-800' : 'text-red-800';
      const textColor = colorClass === 'amber' ? 'text-amber-600' : 
                       colorClass === 'blue' ? 'text-blue-600' : 'text-red-600';
      const buttonColor = colorClass === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 
                         colorClass === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

      return (
        <Card className={`p-6 ${borderColor} ${bgColor}`}>
          <Flex alignItems="start" justifyContent="start" className="gap-3 mb-4">
            <div className={`p-2 rounded-lg ${iconBgColor}`}>
              <IconComponent className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Title className={titleColor}>
                  {errorInfo?.message || 'Erro no Componente'}
                </Title>
                <Badge color={colorClass} size="sm">
                  {errorInfo?.type?.toUpperCase() || 'ERROR'}
                </Badge>
              </div>
              <Text className={`${textColor} text-sm mb-2`}>
                {errorInfo?.suggestion || 'Ocorreu um erro inesperado'}
              </Text>
              <Text className="text-gray-500 text-xs">
                Componente: {this.props.componentName || 'Desconhecido'}
              </Text>
            </div>
          </Flex>

          {error && process.env.NODE_ENV === 'development' && (
            <div className={`mb-4 p-3 ${iconBgColor} rounded-lg`}>
              <Text className={`${titleColor} text-xs font-mono`}>
                {error.message}
              </Text>
            </div>
          )}

          <Flex alignItems="center" className="gap-3">
            <button
              onClick={this.handleRetry}
              className={`flex items-center gap-2 px-4 py-2 ${buttonColor} text-white rounded-lg transition-colors`}
            >
              <RefreshCw className="h-4 w-4" />
              {errorInfo?.type === 'data' ? 'Recarregar Dados' : 'Tentar Novamente'}
            </button>
            
            {errorInfo?.type === 'data' && (
              <Text className="text-xs text-gray-500">
                ⏳ Recarregando automaticamente...
              </Text>
            )}
          </Flex>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para usar Error Boundary com componentes funcionais
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// 📊 Fallback específico para gráficos
export const ChartErrorFallback = ({ 
  title = "Gráfico Indisponível", 
  message = "Dados insuficientes ou erro na renderização"
}: { 
  title?: string; 
  message?: string; 
}) => (
  <Card className="p-6 border-amber-200 bg-amber-50">
    <Flex alignItems="center" justifyContent="center" className="gap-3 min-h-[200px]">
      <div className="text-center">
        <div className="p-3 rounded-lg bg-amber-100 inline-block mb-3">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <Title className="text-amber-800 mb-2">{title}</Title>
        <Text className="text-amber-600">{message}</Text>
      </div>
    </Flex>
  </Card>
);

// 📈 Fallback específico para CategoryBarCard 
export const CategoryBarErrorFallback = ({ 
  title = "Dados Indisponíveis",
  message = "Aguardando carregamento dos dados financeiros..."
}: { 
  title?: string; 
  message?: string; 
}) => (
  <Card className="p-4 border-blue-200 bg-blue-50">
    <Flex alignItems="center" justifyContent="start" className="gap-3">
      <div className="p-2 rounded-lg bg-blue-100">
        <Database className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <Title className="text-blue-800 text-sm mb-1">{title}</Title>
        <Text className="text-blue-600 text-xs">{message}</Text>
      </div>
    </Flex>
    
    {/* Skeleton para CategoryBar */}
    <div className="mt-3 space-y-2">
      <div className="h-2 bg-blue-200 rounded-full animate-pulse"></div>
      <div className="flex justify-between text-xs">
        <span className="w-8 h-3 bg-blue-200 rounded animate-pulse"></span>
        <span className="w-12 h-3 bg-blue-200 rounded animate-pulse"></span>
      </div>
    </div>
  </Card>
);

// 💾 Fallback específico para dados ausentes
export const DataErrorFallback = ({ 
  componentName = "Componente",
  onRetry
}: { 
  componentName?: string;
  onRetry?: () => void;
}) => (
  <Card className="p-4 border-amber-200 bg-amber-50">
    <Flex alignItems="center" justifyContent="start" className="gap-3 mb-3">
      <div className="p-2 rounded-lg bg-amber-100">
        <Database className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <Title className="text-amber-800 text-sm mb-1">Dados Financeiros Indisponíveis</Title>
        <Text className="text-amber-600 text-xs">
          {componentName} não pôde carregar devido a dados ausentes
        </Text>
      </div>
    </Flex>
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Recarregar
      </button>
    )}
  </Card>
);

// 🔗 Error Boundary específico para hooks de dados
export const DataErrorBoundary: React.FC<{
  children: ReactNode;
  hookName: string;
  fallbackMessage?: string;
}> = ({ children, hookName, fallbackMessage }) => (
  <ErrorBoundary
    componentName={`Hook: ${hookName}`}
    fallback={
      <DataErrorFallback 
        componentName={hookName}
        onRetry={() => window.location.reload()}
      />
    }
    onError={(error, errorInfo) => {
      console.error(`🎣 Erro no hook ${hookName}:`, {
        error: error.message,
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        hookName
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

// 📊 Error Boundary específico para gráficos
export const ChartErrorBoundary: React.FC<{
  children: ReactNode;
  chartName: string;
  fallbackTitle?: string;
}> = ({ children, chartName, fallbackTitle }) => (
  <ErrorBoundary
    componentName={`Chart: ${chartName}`}
    fallback={
      <ChartErrorFallback 
        title={fallbackTitle || `${chartName} Indisponível`}
        message="Dados insuficientes ou erro na renderização do gráfico"
      />
    }
    onError={(error, errorInfo) => {
      console.error(`📊 Erro no gráfico ${chartName}:`, {
        error: error.message,
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        chartName
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

// 💳 Error Boundary específico para KPI Cards
export const KpiErrorBoundary: React.FC<{
  children: ReactNode;
  kpiName: string;
}> = ({ children, kpiName }) => (
  <ErrorBoundary
    componentName={`KPI: ${kpiName}`}
    fallback={
      <Card className="p-4 border-red-200 bg-red-50">
        <Flex alignItems="center" justifyContent="center" className="gap-3 min-h-[120px]">
          <div className="text-center">
            <div className="p-2 rounded-lg bg-red-100 inline-block mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <Title className="text-red-800 text-sm mb-1">KPI Indisponível</Title>
            <Text className="text-red-600 text-xs">{kpiName}</Text>
          </div>
        </Flex>
      </Card>
    }
    onError={(error, errorInfo) => {
      console.error(`💳 Erro no KPI ${kpiName}:`, {
        error: error.message,
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        kpiName
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

// 🔄 Error Boundary com retry automático
export const RetryErrorBoundary: React.FC<{
  children: ReactNode;
  componentName: string;
  maxRetries?: number;
  retryDelay?: number;
}> = ({ children, componentName, maxRetries = 3, retryDelay = 2000 }) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        setIsRetrying(false);
        window.location.reload();
      }, retryDelay);
    }
  };

  return (
    <ErrorBoundary
      componentName={componentName}
      fallback={
        <Card className="p-6 border-blue-200 bg-blue-50">
          <Flex alignItems="center" justifyContent="center" className="gap-3 min-h-[200px]">
            <div className="text-center">
              <div className="p-3 rounded-lg bg-blue-100 inline-block mb-3">
                <RefreshCw className={`h-8 w-8 text-blue-600 ${isRetrying ? 'animate-spin' : ''}`} />
              </div>
              <Title className="text-blue-800 mb-2">
                {isRetrying ? 'Tentando Reconectar...' : 'Erro Temporário'}
              </Title>
              <Text className="text-blue-600 mb-3">
                {isRetrying 
                  ? `Tentativa ${retryCount} de ${maxRetries}...` 
                  : `${componentName} encontrou um problema`
                }
              </Text>
              
              {!isRetrying && retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Tentar Novamente ({maxRetries - retryCount} restantes)
                </button>
              )}
              
              {retryCount >= maxRetries && (
                <Text className="text-red-600 text-sm">
                  Máximo de tentativas atingido. Contate o suporte.
                </Text>
              )}
            </div>
          </Flex>
        </Card>
      }
      onError={(error, errorInfo) => {
        console.error(`🔄 Erro com retry em ${componentName}:`, {
          error: error.message,
          stack: errorInfo.componentStack,
          retryCount,
          maxRetries,
          timestamp: new Date().toISOString()
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;