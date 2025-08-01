import { 
  Card, 
  Title, 
  Text, 
  Grid, 
  Flex, 
  BarChart,
  AreaChart,
  DonutChart,
  List,
  ListItem,
  Badge,
  Metric,
  Color
} from "@tremor/react";
import { 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  XCircle,
  CheckCircle,
  Grid3x3,
  Zap,
  DollarSign,
  Users,
  Clock
} from "lucide-react";
import { useInadimplenciaData, useFinancialAnalytics, useFaturamentoData } from "@/hooks/useFinancialData";
import { useInadimplenciaIntelligence } from "@/hooks/useInadimplenciaAnalytics";
import { KpiCard } from "@/components/ui/KpiCard";
import { CategoryBarCard, CompactCategoryBarCard } from "@/components/ui/CategoryBarCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { HeatmapAnalysis } from "@/components/charts/HeatmapAnalysis";
import { formatarMoeda, formatarMoedaCompacta, formatarData } from "@/lib/formatters";
import { InadimplenciaTooltip } from "@/components/ui/FinancialTooltip";

const chartColors: Color[] = ['red', 'amber', 'emerald', 'blue', 'violet'];

const InadimplenciaDashboard = () => {
  // Hook otimizado com agregações automáticas
  const { 
    data: inadimplenciaResult, 
    isLoading: inadimplenciaLoading,
    error: inadimplenciaError 
  } = useInadimplenciaData({ 
    aggregations: true,
    pagination: { limit: 2000 }, // Aumentar limite para análises completas
    filters: { showPagos: false } // Apenas inadimplentes por padrão
  });

  const { data: financialData, isLoading: financialLoading } = useFinancialAnalytics();
  const { data: faturamentoData } = useFaturamentoData();

  // Inteligência artificial para análises avançadas
  const intelligence = useInadimplenciaIntelligence(inadimplenciaResult?.records);

  const isLoading = inadimplenciaLoading || financialLoading;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-64 sm:w-80"></div>
          <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 sm:h-32 bg-gray-200 rounded"></div>
            ))}
          </Grid>
        </div>
      </div>
    );
  }

  if (inadimplenciaError || !inadimplenciaResult || !financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <Text className="text-lg text-red-600 mb-2">Erro ao carregar dados de inadimplência</Text>
          {inadimplenciaError && (
            <Text className="text-sm text-gray-600">{inadimplenciaError.message}</Text>
          )}
          {inadimplenciaResult?.dataQuality && (
            <Text className="text-xs text-gray-500 mt-2">
              Qualidade dos dados: {inadimplenciaResult.dataQuality.overall}%
            </Text>
          )}
        </Card>
      </div>
    );
  }

  // Usar dados da nova estrutura otimizada
  const inadimplenciaData = inadimplenciaResult.records;
  const aggregations = inadimplenciaResult.aggregations;
  const dataQuality = inadimplenciaResult.dataQuality;

  // Métricas principais (usar agregações quando disponíveis)
  const totalInadimplencia = aggregations?.totalInadimplencia || 
    inadimplenciaData.reduce((sum, item) => sum + (item.Inadimplencia || 0), 0);
  const totalFaturado = aggregations?.totalFaturado || 
    inadimplenciaData.reduce((sum, item) => sum + (item.ValorFaturado || 0), 0);
  const totalPago = aggregations?.totalPago || 
    inadimplenciaData.reduce((sum, item) => sum + (item.ValorPago || 0), 0);
  const taxaInadimplencia = aggregations?.taxaInadimplencia || 
    (totalFaturado > 0 ? (totalInadimplencia / totalFaturado) * 100 : 0);
  
  const clientesInadimplentes = aggregations?.clientesUnicos || 
    new Set(inadimplenciaData.filter(item => (item.Inadimplencia || 0) > 0).map(item => item.Locatario)).size;

  const totalClientes = new Set(inadimplenciaData.map(item => item.Locatario)).size;

  // Análise por shopping
  const inadimplenciaPorShopping = inadimplenciaData.reduce((acc, item) => {
    const shopping = item.Shopping || 'Não informado';
    if (!acc[shopping]) {
      acc[shopping] = { faturado: 0, inadimplencia: 0, pago: 0 };
    }
    acc[shopping].faturado += item.ValorFaturado || 0;
    acc[shopping].inadimplencia += item.Inadimplencia || 0;
    acc[shopping].pago += item.ValorPago || 0;
    return acc;
  }, {} as Record<string, { faturado: number; inadimplencia: number; pago: number }>);

  const shoppingData = Object.entries(inadimplenciaPorShopping).map(([shopping, dados]) => ({
    shopping,
    taxa: dados.faturado > 0 ? (dados.inadimplencia / dados.faturado) * 100 : 0,
    valor: dados.inadimplencia,
    faturado: dados.faturado
  })).sort((a, b) => b.taxa - a.taxa);

  // Status dos clientes
  const statusDistribuicao = inadimplenciaData.reduce((acc, item) => {
    const status = item.StatusCliente || 'Indefinido';
    if (!acc[status]) {
      acc[status] = { count: 0, valor: 0 };
    }
    acc[status].count += 1;
    acc[status].valor += item.Inadimplencia || 0;
    return acc;
  }, {} as Record<string, { count: number; valor: number }>);

  const statusData = Object.entries(statusDistribuicao).map(([status, dados]) => ({
    status,
    quantidade: dados.count,
    valor: dados.valor
  }));

  // Maiores inadimplentes
  const maioresInadimplentes = inadimplenciaData
    .filter(item => item.Inadimplencia > 0)
    .sort((a, b) => (b.Inadimplencia || 0) - (a.Inadimplencia || 0))
    .slice(0, 10);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header com Status de Dados */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <Title className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Dashboard de Inadimplência</Title>
          <Text className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Monitoramento inteligente e análise preditiva da inadimplência do portfólio
          </Text>
        </div>

        {/* Status de Qualidade dos Dados e IA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Text className="text-sm text-gray-600">Qualidade dos Dados</Text>
                <Metric className="text-blue-600">{dataQuality.overall.toFixed(1)}%</Metric>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </Flex>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Text className="text-sm text-gray-600">Análises IA</Text>
                <Metric className="text-purple-600">
                  {intelligence.isCalculating ? '⚡' : '✅'}
                </Metric>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </Flex>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Text className="text-sm text-gray-600">Clientes Alto Risco</Text>
                <Metric className="text-orange-600">{intelligence.insights.highRiskClients}</Metric>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </Flex>
          </Card>

          <Card className="p-4 border-l-4 border-l-red-500">
            <Flex alignItems="center" justifyContent="between">
              <div>
                <Text className="text-sm text-gray-600">Anomalias Críticas</Text>
                <Metric className="text-red-600">{intelligence.insights.criticalAnomalies}</Metric>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </Flex>
          </Card>
        </div>

        {/* Alertas de Qualidade */}
        {dataQuality.overall < 80 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Flex alignItems="center" justifyContent="start" className="gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <Text className="font-medium text-amber-800">Atenção: Qualidade dos Dados</Text>
                <Text className="text-sm text-amber-700">
                  Completude: {dataQuality.completeness}% | Validade: {dataQuality.validity}% | 
                  Consistência: {dataQuality.consistency}% | Atualidade: {dataQuality.timeliness}%
                </Text>
              </div>
            </Flex>
          </Card>
        )}
      </div>

      {/* KPIs de Inadimplência */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
        <KpiCard
          titulo="Taxa de Inadimplência"
          valor={taxaInadimplencia}
          variacao={-1.2}
          icone={AlertTriangle}
          formato="percentual"
          cor="red"
          descricao="% do faturamento em atraso"
          tendencia="positiva"
        />
        
        <KpiCard
          titulo="Valor Total em Atraso"
          valor={totalInadimplencia}
          variacao={-5.4}
          icone={DollarSign}
          formato="moeda-compacta"
          cor="red"
          descricao="Montante total inadimplente"
          tendencia="positiva"
        />
        
        <KpiCard
          titulo="Clientes Inadimplentes"
          valor={clientesInadimplentes}
          variacao={-2}
          icone={Users}
          formato="numero"
          cor="amber"
          descricao={`De ${totalClientes} clientes totais`}
        />
        
        <KpiCard
          titulo="Taxa de Recuperação"
          valor={totalPago > 0 ? (totalPago / (totalPago + totalInadimplencia)) * 100 : 0}
          variacao={3.1}
          icone={CheckCircle}
          formato="percentual"
          cor="emerald"
          descricao="% de valores recuperados"
          tendencia="positiva"
        />
      </Grid>

      {/* Métricas de Progresso de Inadimplência */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
        <CategoryBarCard
          titulo="Taxa de Recuperação"
          dados={[
            { label: "Recuperado", value: totalPago > 0 ? (totalPago / (totalPago + totalInadimplencia)) * 100 : 0, color: "emerald" },
            { label: "Em Aberto", value: totalInadimplencia > 0 ? (totalInadimplencia / (totalPago + totalInadimplencia)) * 100 : 0, color: "red" }
          ]}
          meta={85}
          icone={CheckCircle}
          cor="emerald"
          descricao="Meta: 85% de recuperação de crédito"
          mostrarMarker={true}
        />
        
        <CompactCategoryBarCard
          titulo="Ações de Cobrança"
          dados={[
            { label: "Negociação", value: 45.2, color: "blue" },
            { label: "Jurídico", value: 28.8, color: "amber" },
            { label: "Inadimplentes", value: 26.0, color: "red" }
          ]}
          meta={70}
        />
        
        <CompactCategoryBarCard
          titulo="Eficiência por Shopping"
          dados={[
            { label: "Alto Desempenho", value: 35, color: "emerald" },
            { label: "Médio", value: 45, color: "amber" },
            { label: "Baixo Desempenho", value: 20, color: "red" }
          ]}
          meta={80}
        />
      </Grid>

      {/* Análise por Shopping e Status */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <ChartCard
          titulo="Inadimplência por Shopping Center"
          subtitulo="Taxa de inadimplência por empreendimento"
          icone={TrendingDown}
          altura="lg"
        >
          {/* Versão Desktop - Completa com eixos */}
          <BarChart
            data={shoppingData.slice(0, 8)}
            index="shopping"
            categories={["taxa"]}
            colors={["red"]}
            layout="vertical"
            valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
            showLegend={false}
            showTooltip={true}
            showGridLines={true}
            yAxisWidth={150}
            className="h-full hidden sm:block"
          />
          
          {/* Versão Mobile - Compacta sem grid */}
          <BarChart
            data={shoppingData.slice(0, 6)}
            index="shopping"
            categories={["taxa"]}
            colors={["red"]}
            layout="vertical"
            valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
            showLegend={false}
            showTooltip={true}
            showGridLines={false}
            showXAxis={false}
            yAxisWidth={100}
            className="h-full sm:hidden"
          />
        </ChartCard>

        <ChartCard
          titulo="Distribuição por Status"
          subtitulo="Clientes por categoria de status"
          altura="lg"
        >
          {/* Versão Desktop - Completa com labels */}
          <DonutChart
            data={statusData}
            category="quantidade"
            index="status"
            colors={chartColors}
            valueFormatter={(value) => `${value} clientes`}
            showLabel={true}
            showTooltip={true}
            className="h-full hidden sm:block"
          />
          
          {/* Versão Mobile - Compacta sem labels */}
          <DonutChart
            data={statusData}
            category="quantidade"
            index="status"
            colors={chartColors}
            valueFormatter={(value) => `${value} clientes`}
            showLabel={false}
            showTooltip={true}
            className="h-full sm:hidden"
          />
        </ChartCard>
      </Grid>

      {/* Análises de Risco e Predições IA */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Risk Scores */}
        <Card className="p-6">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-6">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <Title className="text-xl font-semibold">Top 10 Clientes de Alto Risco</Title>
              <Text className="text-gray-600 dark:text-gray-400">
                Análise preditiva de risco por IA
              </Text>
            </div>
          </Flex>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {intelligence.riskScores
              .filter(r => r.riskCategory === 'alto' || r.riskCategory === 'critico')
              .slice(0, 10)
              .map((riskScore, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <Flex alignItems="center" justifyContent="between">
                    <div className="flex-1">
                      <Text className="font-medium">{riskScore.locatario}</Text>
                      <Text className="text-sm text-gray-500">{riskScore.shopping}</Text>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          color={riskScore.riskCategory === 'critico' ? 'red' : 'orange'}
                          size="sm"
                        >
                          {riskScore.riskCategory.toUpperCase()}
                        </Badge>
                        <Text className="text-xs text-gray-500">
                          {riskScore.factors.diasAtraso} dias de atraso
                        </Text>
                      </div>
                    </div>
                    <div className="text-right">
                      <Text className="font-bold text-red-600">
                        Score: {riskScore.riskScore.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Rec: {riskScore.probabilidadeRecuperacao.toFixed(0)}%
                      </Text>
                    </div>
                  </Flex>
                </div>
              ))}
            
            {intelligence.riskScores.filter(r => r.riskCategory === 'alto' || r.riskCategory === 'critico').length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <Text className="text-green-600">Nenhum cliente de alto risco detectado</Text>
              </div>
            )}
          </div>
        </Card>

        {/* Predições e Anomalias */}
        <Card className="p-6">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <Title className="text-xl font-semibold">Alertas e Predições</Title>
              <Text className="text-gray-600 dark:text-gray-400">
                Detecção automática de anomalias
              </Text>
            </div>
          </Flex>

          <div className="space-y-4">
            {/* Predições */}
            {intelligence.predictions.length > 0 && (
              <div>
                <Text className="font-medium mb-2">Previsões 30 Dias</Text>
                {intelligence.predictions.slice(0, 3).map((prediction, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg mb-2">
                    <Flex alignItems="center" justifyContent="between">
                      <div>
                        <Text className="font-medium">{prediction.shopping}</Text>
                        <Text className="text-sm text-gray-600">
                          Inadimplência esperada: {formatarMoedaCompacta(prediction.previsao30Dias.inadimplenciaEsperada)}
                        </Text>
                      </div>
                      <Badge 
                        color={prediction.previsao30Dias.confianca > 70 ? 'green' : 'yellow'}
                        size="sm"
                      >
                        {prediction.previsao30Dias.confianca}% confiança
                      </Badge>
                    </Flex>
                  </div>
                ))}
              </div>
            )}

            {/* Anomalias */}
            {intelligence.anomalies.length > 0 && (
              <div>
                <Text className="font-medium mb-2">Anomalias Detectadas</Text>
                {intelligence.anomalies.slice(0, 5).map((anomaly, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg mb-2">
                    <Flex alignItems="center" justifyContent="between">
                      <div>
                        <Text className="font-medium">{anomaly.locatario}</Text>
                        <Text className="text-sm text-gray-600">{anomaly.descricao}</Text>
                      </div>
                      <Badge 
                        color={anomaly.severidade === 'critica' ? 'red' : anomaly.severidade === 'alta' ? 'orange' : 'yellow'}
                        size="sm"
                      >
                        {anomaly.severidade.toUpperCase()}
                      </Badge>
                    </Flex>
                  </div>
                ))}
              </div>
            )}

            {intelligence.anomalies.length === 0 && intelligence.predictions.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <Text className="text-blue-600">Processando análises inteligentes...</Text>
              </div>
            )}
          </div>
        </Card>
      </Grid>

      {/* Heatmap Analysis */}
      <Card className="p-6">
        <Flex alignItems="center" justifyContent="start" className="gap-2 mb-6">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <Grid3x3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <Title className="text-xl font-semibold">Análise Temporal de Inadimplência</Title>
            <Text className="text-gray-600 dark:text-gray-400">
              Mapa de calor: Shopping Centers × Período × Valor de Inadimplência
            </Text>
          </div>
        </Flex>

        <HeatmapAnalysis
          data={(() => {
            // Transformar dados de inadimplência para formato heatmap
            if (!inadimplenciaData) return [];
            
            return inadimplenciaData.map(item => {
              // Extrair mês/ano da data de vencimento
              const dataVencimento = new Date(item.DataVencimento);
              const mesAno = `${(dataVencimento.getMonth() + 1).toString().padStart(2, '0')}/${dataVencimento.getFullYear()}`;
              
              return {
                shopping: item.Shopping || 'N/A',
                periodo: mesAno,
                mes: dataVencimento.getMonth() + 1,
                ano: dataVencimento.getFullYear(),
                inadimplencia: item.Inadimplencia || 0,
                valorFaturado: item.ValorFaturado || 0,
                status: item.StatusCliente || 'Indefinido',
                locatario: item.Locatario || 'N/A',
                item
              };
            }).filter(item => item.inadimplencia > 0); // Apenas dados com inadimplência
          })()}
          xKey="periodo"
          yKey="shopping"
          valueKey="inadimplencia"
          title="Heatmap de Inadimplência"
          subtitle="Intensidade da inadimplência por período e shopping"
          altura="xl"
          colorScheme="diverging"
          enableInteraction={true}
          showLabels={true}
          cellSize={50}
          onCellClick={(cell) => {
            console.log('Célula selecionada:', cell);
          }}
        />
      </Card>

      {/* Maiores Inadimplentes */}
      <Card className="p-6">
        <Flex alignItems="center" justifyContent="start" className="gap-2 mb-6">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <Title className="text-xl font-semibold">Maiores Inadimplentes</Title>
            <Text className="text-gray-600 dark:text-gray-400">
              Top 10 clientes com maior valor em atraso
            </Text>
          </div>
        </Flex>

        <List className="space-y-2">
          {maioresInadimplentes.map((cliente, index) => (
            <ListItem key={index} className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Flex alignItems="center" justifyContent="between">
                <div className="flex-1">
                  <Flex alignItems="center" justifyContent="start" className="gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Text className="font-medium text-gray-900 dark:text-gray-50">
                        {cliente.Locatario}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-500">
                        {cliente.Shopping}
                      </Text>
                    </div>
                  </Flex>
                </div>
                
                <div className="text-right">
                  <Text className="font-bold text-red-600 dark:text-red-400">
                    {formatarMoeda(cliente.Inadimplencia || 0)}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-500">
                    Venc: {formatarData(cliente.DataVencimento)}
                  </Text>
                </div>
              </Flex>
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Evolução da Inadimplência */}
      <ChartCard
        titulo="Evolução Temporal da Inadimplência"
        subtitulo="Tendência da taxa de inadimplência ao longo do tempo"
        icone={Clock}
        altura="md"
        periodo="Últimos 12 meses"
      >
        {/* Versão Desktop - Completa com eixos e legenda */}
        <AreaChart
          data={financialData.performanceData.map((item) => {
            // Calcular taxa de inadimplência real para cada mês
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].indexOf(item.month);
            const currentDate = new Date();
            const targetMonth = monthIndex >= 0 ? monthIndex : currentDate.getMonth();
            
            // Filtrar dados de inadimplência do mês específico
            const monthlyInadimplencia = inadimplenciaData.filter(item => {
              if (!item.DataVencimento) return false;
              const itemDate = new Date(item.DataVencimento);
              return itemDate.getMonth() === targetMonth && 
                     itemDate.getFullYear() === currentDate.getFullYear() &&
                     (item.Inadimplencia || 0) > 0;
            });
            
            const monthlyFaturamento = faturamentoData.filter(item => {
              if (!item.datainiciocompetencia) return false;
              const itemDate = new Date(item.datainiciocompetencia);
              return itemDate.getMonth() === targetMonth && 
                     itemDate.getFullYear() === currentDate.getFullYear();
            });
            
            const monthlyInadimplenciaValue = monthlyInadimplencia.reduce((sum, item) => 
              sum + (item.Inadimplencia || 0), 0);
            
            const monthlyFaturamentoValue = monthlyFaturamento.reduce((sum, item) => 
              sum + (item.valortotalfaturado || 0), 0);
            
            const monthlyTaxaInadimplencia = monthlyFaturamentoValue > 0 ? 
              (monthlyInadimplenciaValue / monthlyFaturamentoValue) * 100 : 0;
            
            return {
              mes: item.month,
              taxaInadimplencia: Math.max(0, monthlyTaxaInadimplencia),
              meta: 3.5, // Meta de 3.5% de inadimplência
              valorInadimplencia: monthlyInadimplenciaValue,
              taxa: Math.max(0, monthlyTaxaInadimplencia)
            };
          })}
          index="mes"
          categories={["taxaInadimplencia", "meta"]}
          colors={["red", "gray"]}
          valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
          showLegend={true}
          showTooltip={true}
          showGridLines={true}
          yAxisWidth={50}
          className="h-full hidden sm:block"
          customTooltip={(props) => (
            <InadimplenciaTooltip {...props} />
          )}
        />
        
        {/* Versão Mobile - Otimizada para telas pequenas */}
        <AreaChart
          data={financialData.performanceData.map((item) => {
            // Mesmo cálculo da versão desktop
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].indexOf(item.month);
            const currentDate = new Date();
            const targetMonth = monthIndex >= 0 ? monthIndex : currentDate.getMonth();
            
            const monthlyInadimplencia = inadimplenciaData.filter(item => {
              if (!item.DataVencimento) return false;
              const itemDate = new Date(item.DataVencimento);
              return itemDate.getMonth() === targetMonth && 
                     itemDate.getFullYear() === currentDate.getFullYear() &&
                     (item.Inadimplencia || 0) > 0;
            });
            
            const monthlyFaturamento = faturamentoData.filter(item => {
              if (!item.datainiciocompetencia) return false;
              const itemDate = new Date(item.datainiciocompetencia);
              return itemDate.getMonth() === targetMonth && 
                     itemDate.getFullYear() === currentDate.getFullYear();
            });
            
            const monthlyInadimplenciaValue = monthlyInadimplencia.reduce((sum, item) => 
              sum + (item.Inadimplencia || 0), 0);
            
            const monthlyFaturamentoValue = monthlyFaturamento.reduce((sum, item) => 
              sum + (item.valortotalfaturado || 0), 0);
            
            const monthlyTaxaInadimplencia = monthlyFaturamentoValue > 0 ? 
              (monthlyInadimplenciaValue / monthlyFaturamentoValue) * 100 : 0;
            
            return {
              mes: item.month,
              taxaInadimplencia: Math.max(0, monthlyTaxaInadimplencia),
              meta: 3.5,
              valorInadimplencia: monthlyInadimplenciaValue,
              taxa: Math.max(0, monthlyTaxaInadimplencia)
            };
          })}
          index="mes"
          categories={["taxaInadimplencia", "meta"]}
          colors={["red", "gray"]}
          valueFormatter={(value) => `${(value || 0).toFixed(1)}%`}
          showLegend={false}
          showTooltip={true}
          showGridLines={false}
          showYAxis={false}
          startEndOnly={true}
          className="h-full sm:hidden"
          customTooltip={(props) => (
            <InadimplenciaTooltip {...props} />
          )}
        />
      </ChartCard>

      {/* Resumo de Ações */}
      <Card className="p-6 bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-800">
        <Flex alignItems="center" justifyContent="start" className="gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <Title className="text-lg font-semibold text-red-800 dark:text-red-400">
            Ações Recomendadas
          </Title>
        </Flex>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <Text className="font-medium mb-2">Negociação Ativa</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {clientesInadimplentes} clientes precisam de contato imediato
            </Text>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <Text className="font-medium mb-2">Foco em Shopping</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {shoppingData[0]?.shopping} apresenta maior taxa ({(shoppingData[0]?.taxa || 0).toFixed(1)}%)
            </Text>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <Text className="font-medium mb-2">Meta de Recuperação</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Reduzir inadimplência para menos de 3.5%
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InadimplenciaDashboard;