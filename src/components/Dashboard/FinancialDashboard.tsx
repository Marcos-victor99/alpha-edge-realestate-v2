import { 
  Card, 
  Title, 
  Text, 
  Grid, 
  Flex, 
  BarChart,
  AreaChart,
  Metric,
  Color
} from "@tremor/react";
import { 
  Calculator,
  GitBranch,
  DollarSign,
  TrendingUp,
  CreditCard,
  BarChart3,
  PieChart,
  Wallet
} from "lucide-react";
import { useFinancialAnalytics, useMovimentacoesFinanceiras } from "@/hooks/useFinancialData";
import { KpiCard, ComparativeKpiCard } from "@/components/ui/KpiCard";
import { CategoryBarCard, CompactCategoryBarCard } from "@/components/ui/CategoryBarCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { SankeyFlow } from "@/components/charts/SankeyFlow";
import { FluxoCaixaChart } from "@/components/charts/FluxoCaixaChart";
import PrevistoRealizadoChart from "@/components/charts/PrevistoRealizadoChart";
import { formatarMoedaCompacta } from "@/lib/formatters";
import { FinancialTooltip, NOITooltip } from "@/components/ui/FinancialTooltip";

const _chartColors: Color[] = ['blue', 'emerald', 'rose', 'amber', 'violet'];

const FinancialDashboard = () => {
  const { data: financialData, isLoading, error } = useFinancialAnalytics();
  const { data: movimentacoesData } = useMovimentacoesFinanceiras();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64"></div>
          <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 sm:h-32 bg-gray-200 rounded"></div>
            ))}
          </Grid>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <Text className="text-lg text-red-600">Erro ao carregar dados financeiros</Text>
        </Card>
      </div>
    );
  }

  // Preparar dados para gráficos
  const cashFlowData = financialData.performanceData.map(item => ({
    mes: item.month,
    receitas: item.portfolio * 100000,
    despesas: item.noi * 80000,
    fluxoLiquido: (item.portfolio - item.noi) * 100000
  }));

  const financialRatiosData = [
    { categoria: 'Liquidez Corrente', valor: financialData.financialRatios.currentRatio },
    { categoria: 'Liquidez Imediata', valor: financialData.financialRatios.quickRatio },
    { categoria: 'Endividamento', valor: financialData.financialRatios.debtToEquity },
    { categoria: 'ROA', valor: financialData.financialRatios.returnOnAssets },
    { categoria: 'ROE', valor: financialData.financialRatios.returnOnEquity }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Title className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Dashboard Financeiro</Title>
        <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Análise detalhada da performance financeira do portfólio
        </Text>
      </div>

      {/* Financial KPIs */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 sm:gap-6">
        <KpiCard
          titulo="Receita Total"
          valor={financialData.kpis.totalRevenue}
          variacao={financialData.trendsAnalysis.monthlyGrowth}
          icone={DollarSign}
          formato="moeda-compacta"
          cor="blue"
          descricao="Receita consolidada"
        />
        
        <KpiCard
          titulo="NOI (Net Operating Income)"
          valor={financialData.kpis.noi}
          variacao={financialData.trendsAnalysis.yearOverYear - 12}
          icone={TrendingUp}
          formato="moeda-compacta"
          cor="emerald"
          descricao="Resultado operacional líquido"
        />
        
        <KpiCard
          titulo="Despesas Operacionais"
          valor={financialData.kpis.totalExpenses}
          variacao={-2.3}
          icone={CreditCard}
          formato="moeda-compacta"
          cor="rose"
          descricao="Custos e despesas totais"
        />
        
        <KpiCard
          titulo="Margem NOI"
          valor={financialData.kpis.noiYield}
          variacao={1.2}
          icone={Calculator}
          formato="percentual"
          cor="violet"
          descricao="NOI / Receita Total"
        />
      </Grid>

      {/* Métricas Financeiras com CategoryBar */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 sm:gap-6">
        <CategoryBarCard
          titulo="Margem NOI"
          dados={[
            { label: "NOI", value: financialData.kpis.noiYield, color: "emerald" },
            { label: "Custos", value: 100 - financialData.kpis.noiYield, color: "red" }
          ]}
          meta={25}
          icone={TrendingUp}
          cor="emerald"
          descricao="Meta: 25% de margem NOI"
          mostrarMarker={true}
        />
        
        <CompactCategoryBarCard
          titulo="Execução Orçamentária"
          dados={[
            { label: "Executado", value: 78.3, color: "blue" },
            { label: "Disponível", value: 21.7, color: "gray" }
          ]}
          meta={80}
        />
        
        <CompactCategoryBarCard
          titulo="Liquidez Atual"
          dados={[
            { label: "Ativo Circulante", value: 65, color: "violet" },
            { label: "Passivo Circulante", value: 35, color: "amber" }
          ]}
          meta={70}
        />
        
        <CompactCategoryBarCard
          titulo="Eficiência Operacional"
          dados={[
            { label: "Receitas", value: 85.2, color: "emerald" },
            { label: "Despesas", value: 14.8, color: "rose" }
          ]}
          meta={90}
        />
      </Grid>

      {/* Cash Flow Analysis */}
      <Grid numItems={1} numItemsLg={2} className="gap-4 sm:gap-6">
        <ChartCard
          titulo="Análise de Fluxo de Caixa"
          subtitulo="Receitas, despesas e fluxo líquido mensal"
          icone={BarChart3}
          altura="lg"
          periodo="Últimos 6 meses"
        >
          {/* Versão Desktop - Completa com eixos e legenda */}
          <BarChart
            data={cashFlowData}
            index="mes"
            categories={["receitas", "despesas", "fluxoLiquido"]}
            colors={["emerald", "rose", "blue"]}
            valueFormatter={(value) => formatarMoedaCompacta(value)}
            showLegend={true}
            showTooltip={true}
            showGridLines={true}
            yAxisWidth={60}
            className="h-full hidden sm:block"
            customTooltip={(props) => (
              <FinancialTooltip {...props} type="revenue" />
            )}
          />
          
          {/* Versão Mobile - Otimizada para telas pequenas */}
          <BarChart
            data={cashFlowData}
            index="mes"
            categories={["receitas", "despesas", "fluxoLiquido"]}
            colors={["emerald", "rose", "blue"]}
            valueFormatter={(value) => formatarMoedaCompacta(value)}
            showLegend={false}
            showTooltip={true}
            showGridLines={false}
            showYAxis={false}
            className="h-full sm:hidden"
            customTooltip={(props) => (
              <FinancialTooltip {...props} type="revenue" />
            )}
          />
        </ChartCard>

        <ChartCard
          titulo="Indicadores Financeiros"
          subtitulo="Principais índices de análise financeira"
          icone={PieChart}
          altura="lg"
        >
          {/* Versão Desktop - Completa com eixos */}
          <BarChart
            data={financialRatiosData}
            index="categoria"
            categories={["valor"]}
            colors={["blue"]}
            layout="vertical"
            valueFormatter={(value) => (value || 0).toFixed(2)}
            showLegend={false}
            showTooltip={true}
            showGridLines={true}
            yAxisWidth={120}
            className="h-full hidden sm:block"
          />
          
          {/* Versão Mobile - Compacta sem grid */}
          <BarChart
            data={financialRatiosData}
            index="categoria"
            categories={["valor"]}
            colors={["blue"]}
            layout="vertical"
            valueFormatter={(value) => (value || 0).toFixed(2)}
            showLegend={false}
            showTooltip={true}
            showGridLines={false}
            showXAxis={false}
            yAxisWidth={80}
            className="h-full sm:hidden"
          />
        </ChartCard>
      </Grid>

      {/* Financial Flow Analysis */}
      <Card className="p-4 sm:p-6">
        <Flex alignItems="center" justifyContent="start" className="gap-2 mb-4 sm:mb-6">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
            <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <Title className="text-lg sm:text-xl font-semibold">Fluxo Financeiro Interativo</Title>
            <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Visualização do fluxo de entrada e saída de recursos
            </Text>
          </div>
        </Flex>

        <SankeyFlow
          data={(() => {
            // Transformar movimentações financeiras para formato Sankey
            if (!movimentacoesData) return [];
            
            const sankeyData = [];
            
            // Agrupar créditos (entradas) por origem
            const _creditos = movimentacoesData
              .filter(mov => mov.Credito > 0)
              .reduce((acc, mov) => {
                const origem = mov.Origem || 'Receitas Operacionais';
                const destino = mov.Shopping || 'Shopping Center';
                sankeyData.push({
                  fonte: origem,
                  destino: destino,
                  valor: mov.Credito,
                  tipo: 'receita'
                });
                return acc;
              }, {});

            // Agrupar débitos (saídas) por fornecedor
            const _debitos = movimentacoesData
              .filter(mov => mov.Debito > 0)
              .reduce((acc, mov) => {
                const origem = mov.Shopping || 'Shopping Center';
                const destino = mov.Fornecedor || 'Despesas Operacionais';
                sankeyData.push({
                  fonte: origem,
                  destino: destino,
                  valor: mov.Debito,
                  tipo: 'despesa'
                });
                return acc;
              }, {});

            return sankeyData;
          })()}
          sourceKey="fonte"
          targetKey="destino"
          valueKey="valor"
          title="Fluxo de Caixa Detalhado"
          subtitle="Origem e destino dos recursos financeiros"
          altura="xl"
          enableInteraction={true}
          colorScheme={{
            receitas: 'emerald',
            despesas: 'rose',
            noi: 'blue',
            default: 'gray'
          }}
          onNodeClick={(node) => {
            console.log('Nó selecionado:', node);
          }}
          onLinkClick={(link) => {
            console.log('Fluxo selecionado:', link);
          }}
        />
      </Card>

      {/* Comparative Analysis */}
      <Grid numItems={1} numItemsLg={3} className="gap-6">
        <ComparativeKpiCard
          titulo="Fluxo de Caixa Operacional"
          valorAtual={financialData.cashFlowAnalysis.operatingCashFlow}
          valorAnterior={financialData.cashFlowAnalysis.operatingCashFlow * 0.85}
          labelAtual="Este Mês"
          labelAnterior="Mês Anterior"
          formato="moeda-compacta"
          icone={Wallet}
          cor="blue"
        />

        <ComparativeKpiCard
          titulo="Fluxo de Caixa Livre"
          valorAtual={financialData.cashFlowAnalysis.freeCashFlow}
          valorAnterior={financialData.cashFlowAnalysis.freeCashFlow * 0.92}
          labelAtual="Este Mês"
          labelAnterior="Mês Anterior"
          formato="moeda-compacta"
          icone={TrendingUp}
          cor="emerald"
        />

        <Card className="p-6">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <Text className="font-medium">Ciclo Financeiro</Text>
          </Flex>
          
          <div className="space-y-4">
            <div>
              <Text className="text-xs text-gray-500 mb-1">Prazo Médio de Recebimento</Text>
              <Metric className="text-lg font-bold">
                {(financialData.cashFlowAnalysis.daysReceivable || 0).toFixed(0)} dias
              </Metric>
            </div>
            
            <div>
              <Text className="text-xs text-gray-500 mb-1">Prazo Médio de Pagamento</Text>
              <Metric className="text-lg font-bold">
                {(financialData.cashFlowAnalysis.daysPayable || 0).toFixed(0)} dias
              </Metric>
            </div>
            
            <div className="pt-2 border-t">
              <Text className="text-xs text-gray-500 mb-1">Ciclo de Conversão de Caixa</Text>
              <Metric className="text-xl font-bold text-blue-600">
                {(financialData.cashFlowAnalysis.cashConversionCycle || 0).toFixed(0)} dias
              </Metric>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Análise Avançada de Fluxo de Caixa - NOVA SEÇÃO */}
      <FluxoCaixaChart
        periodo="90d"
        tipoVisualizacao="comparativo"
        altura="lg"
        titulo="Análise Avançada de Fluxo de Caixa"
        subtitulo="Movimentações detalhadas com inteligência temporal - Últimos 90 dias"
        mostrarLiquidezRealTime={true}
        onExport={() => console.log('Exportando análise avançada de fluxo de caixa...')}
        onFullscreen={() => console.log('Expandindo análise avançada...')}
        onFiltroChange={(filtros) => {
          console.log('Filtros de fluxo de caixa alterados:', filtros);
        }}
      />

      {/* Análise Previsto vs Realizado */}
      <PrevistoRealizadoChart
        periodo="6m"
        altura="lg"
        showVariance={true}
        showTrend={true}
        onPeriodClick={(periodo) => {
          console.log('Período selecionado para análise detalhada:', periodo);
        }}
      />

      {/* NOI Trend */}
      <ChartCard
        titulo="Evolução do NOI - Net Operating Income"
        subtitulo="Tendência histórica do resultado operacional líquido"
        icone={TrendingUp}
        altura="md"
        periodo="Últimos 12 meses"
        fonte="Dados consolidados Supabase"
      >
        {/* Versão Desktop - Completa com eixos e legenda */}
        <AreaChart
          data={financialData.performanceData.map(item => ({
            mes: item.month,
            noi: item.noi * 1000000,
            projecao: item.noi * 1000000 * 1.05
          }))}
          index="mes"
          categories={["noi", "projecao"]}
          colors={["blue", "gray"]}
          valueFormatter={(value) => formatarMoedaCompacta(value)}
          showLegend={true}
          showTooltip={true}
          showGridLines={true}
          yAxisWidth={80}
          className="h-full hidden sm:block"
          customTooltip={(props) => (
            <NOITooltip {...props} />
          )}
        />
        
        {/* Versão Mobile - Otimizada para telas pequenas */}
        <AreaChart
          data={financialData.performanceData.map(item => ({
            mes: item.month,
            noi: item.noi * 1000000,
            projecao: item.noi * 1000000 * 1.05
          }))}
          index="mes"
          categories={["noi", "projecao"]}
          colors={["blue", "gray"]}
          valueFormatter={(value) => formatarMoedaCompacta(value)}
          showLegend={false}
          showTooltip={true}
          showGridLines={false}
          showYAxis={false}
          startEndOnly={true}
          className="h-full sm:hidden"
          customTooltip={(props) => (
            <NOITooltip {...props} />
          )}
        />
      </ChartCard>
    </div>
  );
};

export default FinancialDashboard;