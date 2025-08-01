import React, { useState, useCallback } from 'react';
import { Card, Title, Text, Flex, Button } from '@tremor/react';
import { 
  BarChart3, 
  RefreshCw, 
  Share2
} from 'lucide-react';
import { GlobalFiltersProvider, useGlobalFilters } from '@/components/ui/GlobalFilters';
import GlobalFilters from '@/components/ui/GlobalFilters';
import { ChartGrid } from '@/components/ui/ChartGrid';
import { softColors, semanticTokens } from '@/lib/design-tokens';

// Componente interno simplificado
const VisualizacoesDashboardContent: React.FC = () => {
  const { filters, resetFilters } = useGlobalFilters();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Handlers simplificados
  const handleManualRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  const handleShareDashboard = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Dashboard Financeiro',
        text: 'Visualizações financeiras do Shopping Park Botucatu',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  }, []);

  // Filtros ativos (simplificado)
  const filtrosAtivos = [
    ...(filters.selectedShopping.length > 0 ? [`${filters.selectedShopping.length} shopping(s)`] : []),
    ...(filters.selectedCategoria.length > 0 ? [`${filters.selectedCategoria.length} categoria(s)`] : []),
    ...(filters.selectedStatus !== 'todos' ? [`Status: ${filters.selectedStatus}`] : []),
  ];

  return (
    <div 
      className="min-h-screen p-8 space-y-8"
      style={{ backgroundColor: semanticTokens.background.primary }}
    >
      {/* Header Limpo e Moderno */}
      <Card 
        className="p-8 border-0"
        style={{ 
          backgroundColor: semanticTokens.surface.primary,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Flex justifyContent="between" alignItems="center" className="mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: softColors.accent[50] }}
            >
              <BarChart3 
                className="h-8 w-8" 
                style={{ color: softColors.accent[600] }}
              />
            </div>
            <div>
              <Title 
                className="text-3xl font-semibold mb-1"
                style={{ color: semanticTokens.text.primary }}
              >
                Visualizações Financeiras
              </Title>
              <Text style={{ color: semanticTokens.text.secondary }}>
                Dashboard unificado com gráficos em layout fixo e cores suaves
              </Text>
            </div>
          </div>

          <Flex className="gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleManualRefresh}
              className="transition-all hover:scale-105"
            >
              Atualizar
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              icon={Share2}
              onClick={handleShareDashboard}
              className="transition-all hover:scale-105"
            >
              Compartilhar
            </Button>
          </Flex>
        </Flex>

        {/* Status simplificado */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-xl"
          style={{ backgroundColor: semanticTokens.surface.secondary }}
        >
          <div className="text-center">
            <Text 
              className="text-sm mb-1"
              style={{ color: semanticTokens.text.secondary }}
            >
              Última Atualização
            </Text>
            <Text 
              className="font-semibold"
              style={{ color: semanticTokens.text.primary }}
            >
              {lastRefresh.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </div>

          <div className="text-center">
            <Text 
              className="text-sm mb-1"
              style={{ color: semanticTokens.text.secondary }}
            >
              Filtros Aplicados
            </Text>
            <Text 
              className="font-semibold"
              style={{ color: softColors.accent[600] }}
            >
              {filtrosAtivos.length > 0 ? filtrosAtivos.join(', ') : 'Nenhum filtro ativo'}
            </Text>
          </div>
        </div>

        {/* Botão para limpar filtros (apenas se houver filtros) */}
        {filtrosAtivos.length > 0 && (
          <div className="mt-4 text-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={resetFilters}
              style={{ 
                backgroundColor: softColors.danger[50],
                color: softColors.danger[600],
                border: `1px solid ${softColors.danger[200]}`
              }}
            >
              Limpar Filtros ({filtrosAtivos.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Filtros Globais */}
      <Card 
        className="border-0"
        style={{ 
          backgroundColor: semanticTokens.surface.primary,
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <GlobalFilters 
          className="border-none shadow-none"
          onApplyFilters={() => setLastRefresh(new Date())}
        />
      </Card>

      {/* Grid de Gráficos com CSS Grid Fixo */}
      <div>
        <ChartGrid />
      </div>

      {/* Footer minimalista */}
      <Card 
        className="p-6 text-center border-0"
        style={{ 
          backgroundColor: semanticTokens.surface.secondary,
          boxShadow: 'none'
        }}
      >
        <Text 
          className="text-sm"
          style={{ color: semanticTokens.text.tertiary }}
        >
          Shopping Park Botucatu • Dashboard Financeiro • {lastRefresh.toLocaleDateString('pt-BR')}
        </Text>
      </Card>
    </div>
  );
};

// Componente principal com Provider
const VisualizacoesDashboard: React.FC = () => {
  return (
    <GlobalFiltersProvider>
      <VisualizacoesDashboardContent />
    </GlobalFiltersProvider>
  );
};

export default VisualizacoesDashboard;