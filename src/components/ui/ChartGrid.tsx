import React from 'react';
import { Card, Title, Text } from '@tremor/react';
import { useGlobalFilters } from '@/components/ui/GlobalFilters';
import { softColors, semanticTokens } from '@/lib/design-tokens';

// Importar apenas gráficos essenciais (8 selecionados)
import { FluxoCaixaChart } from '@/components/charts/FluxoCaixaChart';
import { FornecedoresChart } from '@/components/charts/FornecedoresChart';
import { PerformanceLocatarioChart } from '@/components/charts/PerformanceLocatarioChart';
import MovimentacaoFinanceiraChart from '@/components/charts/MovimentacaoFinanceiraChart';
import FluxoCaixaCategoriaChart from '@/components/charts/FluxoCaixaCategoriaChart';
import TiposLancamentoChart from '@/components/charts/TiposLancamentoChart';
import FornecedorClienteChart from '@/components/charts/FornecedorClienteChart';
import FaturamentoLocatarioChart from '@/components/charts/FaturamentoLocatarioChart';

// Configuração simplificada - apenas gráficos essenciais
const ESSENTIAL_CHARTS = [
  {
    id: 'fluxo-caixa',
    component: FluxoCaixaChart,
    title: 'Fluxo de Caixa',
    props: { periodo: '30d', altura: 'md' }
  },
  {
    id: 'performance-locatario', 
    component: PerformanceLocatarioChart,
    title: 'Performance por Locatário',
    props: { limite: 10, showComparison: true }
  },
  {
    id: 'fornecedores',
    component: FornecedoresChart, 
    title: 'Análise de Fornecedores',
    props: { limite: 8 }
  },
  {
    id: 'movimentacao-financeira',
    component: MovimentacaoFinanceiraChart,
    title: 'Movimentações Financeiras', 
    props: { periodo: 'mensal' }
  },
  {
    id: 'fluxo-categoria',
    component: FluxoCaixaCategoriaChart,
    title: 'Fluxo por Categoria',
    props: { visualizacao: 'donut' }
  },
  {
    id: 'tipos-lancamento',
    component: TiposLancamentoChart,
    title: 'Tipos de Lançamento',
    props: { visualizacao: 'pie' }
  },
  {
    id: 'fornecedor-cliente', 
    component: FornecedorClienteChart,
    title: 'Fornecedores vs Clientes',
    props: { tipoVisualizacao: 'network' }
  },
  {
    id: 'faturamento-locatario',
    component: FaturamentoLocatarioChart,
    title: 'Faturamento por Locatário',
    props: { periodo: 'anual' }
  }
];

interface ChartGridProps {
  className?: string;
  onChartClick?: (chartId: string) => void;
  onChartFullscreen?: (chartId: string) => void;
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  className,
  onChartClick,
  onChartFullscreen
}) => {
  const { filters } = useGlobalFilters();

  return (
    <div className="w-full">
      {/* Header simplificado */}
      <div className="mb-8">
        <Title 
          className="text-2xl font-semibold mb-2"
          style={{ color: semanticTokens.text.primary }}
        >
          Visualizações Financeiras
        </Title>
        <Text style={{ color: semanticTokens.text.secondary }}>
          {ESSENTIAL_CHARTS.length} gráficos essenciais organizados em layout fixo
        </Text>
      </div>

      {/* CSS Grid Fixo Responsivo */}
      <div 
        className={`
          grid gap-8 w-full
          grid-cols-1 
          md:grid-cols-2 
          lg:grid-cols-3
          ${className || ''}
        `}
        style={{
          gridAutoRows: 'min-content'
        }}
      >
        {ESSENTIAL_CHARTS.map((chart, index) => {
          const ChartComponent = chart.component;
          
          return (
            <div
              key={chart.id}
              className="min-h-[400px] transform transition-all duration-300 hover:scale-[1.02]"
              onClick={() => onChartClick?.(chart.id)}
              style={{
                backgroundColor: semanticTokens.surface.primary,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${semanticTokens.border.primary}`
              }}
            >
              <ChartComponent
                {...chart.props}
                filtros={{
                  dataInicio: filters.dateRange.startDate,
                  dataFim: filters.dateRange.endDate,
                  shopping: filters.selectedShopping,
                  categoria: filters.selectedCategoria,
                  status: filters.selectedStatus !== 'todos' ? filters.selectedStatus : undefined
                }}
                titulo={chart.title}
                altura="md"
                onFullscreen={() => onChartFullscreen?.(chart.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading state minimalista */}
      {filters.isLoading && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: semanticTokens.background.overlay }}
        >
          <Card 
            className="p-8 text-center"
            style={{ 
              backgroundColor: semanticTokens.surface.primary,
              border: `1px solid ${semanticTokens.border.primary}`
            }}
          >
            <div 
              className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4"
              style={{ borderColor: softColors.accent[500] }}
            />
            <Text style={{ color: semanticTokens.text.primary }}>
              Atualizando visualizações...
            </Text>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChartGrid;