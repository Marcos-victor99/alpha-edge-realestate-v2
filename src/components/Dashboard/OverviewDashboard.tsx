import { 
  Card, 
  Title, 
  Text, 
  Grid, 
  Flex, 
  Badge,
  LineChart,
  DonutChart,
  Color
} from "@tremor/react";
import { 
  AlertTriangle,
  Zap,
  Layers,
  Brain,
  Activity,
  DollarSign,
  TrendingUp,
  Building2,
  Target,
  BarChart3
} from "lucide-react";
import { useFaturamentoData } from "@/hooks/useFinancialData";
import { useFinancialAnalyticsSimple } from "@/hooks/useFinancialDataSimple";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { KpiCard } from "@/components/ui/KpiCard";
import { CategoryBarCard } from "@/components/ui/CategoryBarCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { InsightGrid } from "@/components/ui/InsightCard";
import { TreemapDrilldown } from "@/components/charts/TreemapDrilldown";
import { PerformanceLocatarioChart } from "@/components/charts/PerformanceLocatarioChart";
import { FluxoCaixaChart } from "@/components/charts/FluxoCaixaChart";
import { ErrorBoundary, ChartErrorFallback } from "@/components/ui/ErrorBoundary";
import { validarDadoNumerico } from "@/lib/formatters";
import { FinancialTooltip } from "@/components/ui/FinancialTooltip";

// Cores para os gráficos usando o sistema Tremor
const chartColors: Color[] = ['blue', 'emerald', 'rose', 'amber', 'violet'];

const OverviewDashboard = () => {
  const { data: financialData, isLoading, error } = useFinancialAnalyticsSimple();
  const { data: faturamentoData } = useFaturamentoData();
  const { insights, isLoading: insightsLoading, criticalInsights } = useFinancialInsights();

  if (isLoading) {
    return (
      <div className="p-6">
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <KpiCard
              key={i}
              titulo="Carregando..."
              valor={0}
              loading={true}
            />
          ))}
        </Grid>
        <div className="flex items-center justify-center h-64">
          <Text className="text-lg">Carregando dados financeiros...</Text>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <Title className="text-xl mb-2">Erro ao carregar dados</Title>
          <Text>Não foi possível carregar os dados financeiros. Tente novamente.</Text>
        </Card>
      </div>
    );
  }

  // 🛡️ Validação defensiva para KPIs - criar fallbacks seguros
  const kpisSeguro = financialData.kpis || {
    portfolioValue: 0,
    noiYield: 0,
    occupancyRate: 0,
    riskAdjustedReturn: 0
  };
  
  const trendsSeguro = financialData.trendsAnalysis || {
    monthlyGrowth: 0,
    yearOverYear: 0
  };

  // Valores seguros para CategoryBarCard
  const occupancyRateSegura = validarDadoNumerico(kpisSeguro.occupancyRate);
  const portfolioValueSegura = validarDadoNumerico(kpisSeguro.portfolioValue);
  const noiYieldSegura = validarDadoNumerico(kpisSeguro.noiYield);
  const riskAdjustedReturnSegura = validarDadoNumerico(kpisSeguro.riskAdjustedReturn);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1">
          <Title className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Visão Geral do Portfólio</Title>
          <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Inteligência em tempo real e análise de performance
          </Text>
        </div>
        <Badge 
          icon={Activity}
          size="lg"
          className="bg-blue-50 text-blue-700 border-blue-200 self-start sm:self-auto"
        >
          Dados ao Vivo
        </Badge>
      </div>

      {/* KPI Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 sm:gap-6">
        <KpiCard
          titulo="Valor do Portfólio"
          valor={portfolioValueSegura}
          variacao={validarDadoNumerico(trendsSeguro.monthlyGrowth)}
          icone={DollarSign}
          formato="moeda-compacta"
          cor="blue"
          descricao="Valor total consolidado"
        />
        
        <KpiCard
          titulo="Rendimento NOI"
          valor={noiYieldSegura}
          variacao={validarDadoNumerico(trendsSeguro.yearOverYear) - 10}
          icone={TrendingUp}
          formato="percentual"
          cor="emerald"
          descricao="Net Operating Income"
        />
        
        <KpiCard
          titulo="Taxa de Ocupação"
          valor={occupancyRateSegura}
          variacao={occupancyRateSegura - 90}
          icone={Building2}
          formato="percentual"
          cor={occupancyRateSegura > 90 ? "emerald" : "amber"}
          descricao="Ocupação dos imóveis"
        />
        
        <KpiCard
          titulo="Retorno Ajustado ao Risco"
          valor={riskAdjustedReturnSegura}
          variacao={riskAdjustedReturnSegura * 0.1}
          icone={Target}
          formato="percentual"
          cor="violet"
          descricao="Performance vs volatilidade"
        />
      </Grid>

      {/* Métricas de Progresso com CategoryBar */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4 sm:gap-6">
        <CategoryBarCard
          titulo="Taxa de Ocupação"
          dados={[
            { label: "Ocupado", value: occupancyRateSegura, color: "emerald" },
            { label: "Disponível", value: Math.max(0, 100 - occupancyRateSegura), color: "gray" }
          ]}
          meta={95}
          icone={Building2}
          cor="emerald"
          descricao="Meta: 95% de ocupação dos imóveis"
          mostrarMarker={true}
        />
        
        <CategoryBarCard
          titulo="Performance vs Benchmark"
          dados={[
            { label: "Portfólio", value: 65, color: "blue" },
            { label: "Benchmark", value: 35, color: "gray" }
          ]}
          meta={70}
          icone={Target}
          cor="blue"
          descricao="Comparativo de performance relativa"
          mostrarMarker={true}
        />
        
        <CategoryBarCard
          titulo="Execução Orçamentária"
          dados={[
            { label: "Executado", value: 82.5, color: "violet" },
            { label: "Pendente", value: 17.5, color: "amber" }
          ]}
          meta={85}
          icone={DollarSign}
          cor="violet"
          descricao="Execução do orçamento anual"
          mostrarMarker={true}
        />
      </Grid>

      {/* Performance Chart & Portfolio Composition */}
      <Grid numItems={1} numItemsLg={3} className="gap-4 sm:gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            titulo="Performance vs Benchmark"
            subtitulo="Comparativo de rendimento do portfólio"
            icone={BarChart3}
            altura="lg"
            periodo="Últimos 6 meses"
            fonte="Dados consolidados do Supabase"
          >
            {/* Versão Desktop - Completa com eixos e legenda */}
            <LineChart
              data={financialData.performanceData}
              index="month"
              categories={["portfolio", "noi", "benchmark"]}
              colors={["blue", "emerald", "gray"]}
              valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
              showLegend={true}
              showTooltip={true}
              showGridLines={true}
              yAxisWidth={50}
              className="h-full hidden sm:block"
              customTooltip={(props) => (
                <FinancialTooltip {...props} type="performance" />
              )}
            />
            
            {/* Versão Mobile - Otimizada para telas pequenas */}
            <LineChart
              data={financialData.performanceData}
              index="month"
              categories={["portfolio", "noi", "benchmark"]}
              colors={["blue", "emerald", "gray"]}
              valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
              showLegend={false}
              showTooltip={true}
              showGridLines={false}
              showYAxis={false}
              startEndOnly={true}
              className="h-full sm:hidden"
              customTooltip={(props) => (
                <FinancialTooltip {...props} type="performance" />
              )}
            />
          </ChartCard>
        </div>

        {/* Portfolio Composition */}
        <ChartCard
          titulo="Composição do Portfólio"
          subtitulo="Distribuição por tipo de imóvel"
          altura="lg"
        >
          {/* Versão Desktop - Completa com labels */}
          <DonutChart
            data={financialData.portfolioComposition}
            category="value"
            index="name"
            colors={chartColors}
            valueFormatter={(value) => `${value}%`}
            showLabel={true}
            showTooltip={true}
            className="h-full hidden sm:block"
          />
          
          {/* Versão Mobile - Compacta sem labels */}
          <DonutChart
            data={financialData.portfolioComposition}
            category="value"
            index="name"
            colors={chartColors}
            valueFormatter={(value) => `${value}%`}
            showLabel={false}
            showTooltip={true}
            className="h-full sm:hidden"
          />
        </ChartCard>
      </Grid>

      {/* Hierarchical Portfolio Analysis */}
      <Card className="p-4 sm:p-6">
        <Flex alignItems="center" justifyContent="start" className="gap-2 mb-4 sm:mb-6">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <Title className="text-lg sm:text-xl font-semibold">Análise Hierárquica do Portfólio</Title>
            <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Navegação interativa: Shopping Centers → Locatários → Receitas
            </Text>
          </div>
        </Flex>

        <ErrorBoundary
          componentName="TreemapDrilldown"
          fallback={
            <ChartErrorFallback 
              title="Análise Hierárquica Indisponível"
              message="Aguardando dados do Supabase ou erro na visualização. O dashboard continua funcional nos outros componentes."
            />
          }
          onError={(error, errorInfo) => {
            console.error('🚨 TreemapDrilldown Error:', error);
            console.error('📍 Component Stack:', errorInfo.componentStack);
          }}
        >
          <TreemapDrilldown
            data={(() => {
              // Transformar dados para formato hierárquico
              if (!faturamentoData || !Array.isArray(faturamentoData)) {
                console.warn('TreemapDrilldown: faturamentoData inválido', faturamentoData);
                return [];
              }
              return faturamentoData.map(item => ({
                shopping: item.shopping || 'N/A',
                locatario: item.locatario || 'N/A', 
                categoria: item.category || 'Varejo',
                valortotalfaturado: item.valortotalfaturado || 0,
                area: item.area || 0,
                item
              }));
            })()}
            keyPath={["shopping", "locatario", "categoria"]}
            valueKey="valortotalfaturado"
            title="Análise Hierárquica do Portfólio"
            subtitle="Shopping Centers → Locatários → Categorias"
            altura="xl"
            enableDrilldown={true}
            onNodeClick={(node) => {
              console.log(`Navegação para nó:`, node);
            }}
          />
        </ErrorBoundary>
      </Card>

      {/* Performance de Locatários e Fluxo de Caixa - NOVA SEÇÃO */}
      <Grid numItems={1} numItemsLg={2} className="gap-4 sm:gap-6">
        {/* Performance por Locatário */}
        <ErrorBoundary
          componentName="PerformanceLocatarioChart"
          fallback={
            <ChartErrorFallback 
              title="Performance de Locatários Indisponível"
              message="Aguardando dados do hook useFaturamentoAnalytics. O dashboard continua funcional nos outros componentes."
            />
          }
          onError={(error, errorInfo) => {
            console.error('🚨 PerformanceLocatarioChart Error:', error);
            console.error('📍 Component Stack:', errorInfo.componentStack);
          }}
        >
          <PerformanceLocatarioChart
            periodo="30d"
            limite={8}
            mostrarComparacao={true}
            altura="lg"
            titulo="Performance dos Principais Locatários"
            subtitulo="Top 8 locatários por faturamento com análise de pagamentos"
            onExport={() => console.log('Exportando dados de performance...')}
            onFullscreen={() => console.log('Expandindo performance chart...')}
          />
        </ErrorBoundary>

        {/* Análise de Fluxo de Caixa */}
        <ErrorBoundary
          componentName="FluxoCaixaChart"
          fallback={
            <ChartErrorFallback 
              title="Fluxo de Caixa Indisponível"
              message="Aguardando dados do hook useFluxoCaixaData. O dashboard continua funcional nos outros componentes."
            />
          }
          onError={(error, errorInfo) => {
            console.error('🚨 FluxoCaixaChart Error:', error);
            console.error('📍 Component Stack:', errorInfo.componentStack);
          }}
        >
          <FluxoCaixaChart
            periodo="30d"
            tipoVisualizacao="fluxo"
            altura="lg"
            titulo="Fluxo de Caixa Consolidado"
            subtitulo="Análise temporal de entradas e saídas dos últimos 30 dias"
            mostrarLiquidezRealTime={true}
            onExport={() => console.log('Exportando dados de fluxo de caixa...')}
            onFullscreen={() => console.log('Expandindo fluxo de caixa chart...')}
            onFiltroChange={(filtros) => console.log('Filtros alterados:', filtros)}
          />
        </ErrorBoundary>
      </Grid>

      {/* Insights Financeiros Automáticos com AVA */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <Title className="text-lg sm:text-xl font-semibold">Insights Financeiros Automáticos</Title>
              <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Análises e oportunidades detectadas pela IA (AVA Framework)
              </Text>
            </div>
          </div>
          <Badge 
            icon={Activity}
            size="sm"
            className="bg-purple-50 text-purple-700 border-purple-200 self-start sm:self-auto"
          >
            {insights.length} Insights
          </Badge>
        </div>

        {/* Insights Críticos */}
        {criticalInsights.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <Flex alignItems="center" justifyContent="start" className="gap-2 mb-2 sm:mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <Text className="text-sm sm:text-base font-semibold text-red-600">Insights Críticos</Text>
            </Flex>
            <InsightGrid 
              insights={criticalInsights}
              variant="compact"
              maxItems={3}
              className="mb-3 sm:mb-4"
            />
          </div>
        )}

        {/* Todos os Insights */}
        {insightsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Text className="text-gray-500">Gerando insights com IA...</Text>
          </div>
        ) : insights.length > 0 ? (
          <InsightGrid 
            insights={insights}
            variant="default"
            maxItems={6}
            onInsightClick={(insight) => {
              console.log('Insight clicado:', insight);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Brain className="h-8 w-8 text-gray-400 mb-2" />
            <Text className="text-gray-500">
              Nenhum insight disponível. Aguardando dados do Supabase.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OverviewDashboard;