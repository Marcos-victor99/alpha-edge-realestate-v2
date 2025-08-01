import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Target,
  BarChart3,
  Zap,
  Network
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine
} from "recharts";
import { usePredictiveModels } from "@/hooks/usePredictiveModels";
import { useFinancialAnalytics, useFaturamentoData } from "@/hooks/useFinancialData";
import { NetworkGraph } from "@/components/charts/NetworkGraph";

const _predictionData = [
  { month: 'Jul', actual: 3.2, predicted: 3.4, confidence: 0.85 },
  { month: 'Aug', actual: null, predicted: 3.6, confidence: 0.82 },
  { month: 'Sep', actual: null, predicted: 3.8, confidence: 0.78 },
  { month: 'Oct', actual: null, predicted: 3.5, confidence: 0.75 },
  { month: 'Nov', actual: null, predicted: 3.9, confidence: 0.72 },
  { month: 'Dec', actual: null, predicted: 4.1, confidence: 0.70 }
];

const _riskReturnData = [
  { risk: 0.8, return: 2.1, name: 'Plaza Norte', size: 850 },
  { risk: 1.2, return: 3.4, name: 'Metro Center', size: 1200 },
  { risk: 1.5, return: 4.2, name: 'City Mall', size: 950 },
  { risk: 2.1, return: 5.8, name: 'Westfield', size: 1500 },
  { risk: 1.8, return: 4.9, name: 'Town Square', size: 750 }
];

const _mlModels = [
  {
    name: "NOI Prediction",
    algorithm: "XGBoost",
    accuracy: "94.2%",
    lastTrained: "2 hours ago",
    status: "optimal"
  },
  {
    name: "Default Risk",
    algorithm: "Random Forest",
    accuracy: "87.6%",
    lastTrained: "1 day ago",
    status: "good"
  },
  {
    name: "Foot Traffic",
    algorithm: "LSTM Neural Network",
    accuracy: "91.3%",
    lastTrained: "6 hours ago",
    status: "optimal"
  },
  {
    name: "Market Valuation",
    algorithm: "Ensemble Model",
    accuracy: "89.1%",
    lastTrained: "4 hours ago",
    status: "good"
  }
];

const _insights = [
  {
    title: "Seasonality Pattern Detected",
    description: "Q4 NOI shows 15% higher variance than predicted. Recommend adjusting seasonal factors.",
    confidence: "High",
    impact: "Medium",
    type: "model"
  },
  {
    title: "Correlation Shift Alert",
    description: "Consumer spending correlation with foot traffic decreased by 12% in urban locations.",
    confidence: "Medium",
    impact: "High",
    type: "market"
  },
  {
    title: "Anomaly in Metro Center",
    description: "Operating costs 8% above predicted range for 3 consecutive weeks.",
    confidence: "High",
    impact: "Low",
    type: "operational"
  }
];

const AnalyticsDashboard = () => {
  const { data: predictiveData, isLoading, error } = usePredictiveModels();
  const { data: _financialData } = useFinancialAnalytics();
  const { data: faturamentoData } = useFaturamentoData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Processando modelos preditivos...</div>
      </div>
    );
  }

  if (error || !predictiveData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-destructive">Erro ao carregar análises preditivas</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Predictive Analytics</h2>
          <p className="text-muted-foreground">Machine learning models and quantitative insights</p>
        </div>
        <Button className="bg-gradient-primary">
          <Brain className="h-4 w-4 mr-2" />
          Retrain Models
        </Button>
      </div>

      {/* ML Models Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {predictiveData.mlModels.map((model, index) => (
          <Card key={index} className="bg-gradient-surface shadow-financial">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {model.name}
              </CardTitle>
              <Badge 
                variant={model.status === 'optimal' ? 'outline' : 'secondary'}
                className={model.status === 'optimal' ? 'text-success border-success' : ''}
              >
                {model.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Algorithm</span>
                  <span className="text-xs font-medium">{model.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                  <span className="text-xs font-medium text-success">{model.accuracy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Last Trained</span>
                  <span className="text-xs font-medium">{model.lastTrained}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prediction Chart & Risk-Return Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Chart */}
        <Card className="bg-gradient-surface shadow-financial">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>NOI Prediction (Next 6 Months)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={predictiveData.noiPredictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--primary))"
                  fillOpacity={0.3}
                  fill="hsl(var(--primary))"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--accent))"
                  fillOpacity={0.6}
                  fill="hsl(var(--accent))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk-Return Scatter */}
        <Card className="bg-gradient-surface shadow-financial">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Risk-Return Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={predictiveData.riskReturnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="risk" 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="return" 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
                />
                <Scatter 
                  dataKey="size" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.8}
                />
                <ReferenceLine x={1.5} stroke="hsl(var(--accent))" strokeDasharray="5 5" />
                <ReferenceLine y={4.0} stroke="hsl(var(--accent))" strokeDasharray="5 5" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-surface shadow-financial">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-accent" />
            <span>AI-Generated Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictiveData.aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-card border border-border">
                <div className="flex-shrink-0">
                  {insight.type === 'model' && <Brain className="h-5 w-5 text-primary" />}
                  {insight.type === 'market' && <BarChart3 className="h-5 w-5 text-accent" />}
                  {insight.type === 'operational' && <AlertCircle className="h-5 w-5 text-warning" />}
                  {insight.type === 'financial' && <Target className="h-5 w-5 text-success" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{insight.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{insight.description}</div>
                  {insight.recommendation && (
                    <div className="text-sm text-accent mt-1 font-medium">
                      Recomendação: {insight.recommendation}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence} Confidence
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {insight.impact} Impact
                    </Badge>
                    {insight.probability && (
                      <Badge variant="outline" className="text-xs text-primary">
                        {(insight.probability * 100).toFixed(0)}% Prob
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Analysis */}
      <Card className="bg-gradient-surface shadow-financial">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-primary" />
            <span>Rede de Relacionamentos</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Análise de conexões entre shopping centers, locatários e fornecedores
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <NetworkGraph
              data={(() => {
                // Transformar dados para formato de rede
                if (!faturamentoData) return [];
                
                return faturamentoData.map(item => ({
                  fonte: item.shopping || 'Shopping',
                  destino: item.locatario || 'Locatário',
                  valor: item.valortotalfaturado || 0,
                  categoria: item.category || 'Comercial',
                  area: item.area || 0,
                  item
                }));
              })()}
              sourceKey="fonte"
              targetKey="destino"
              valueKey="valor"
              groupKey="categoria"
              title="Rede de Relacionamentos Comerciais"
              subtitle="Conexões entre shopping centers e locatários"
              altura="xl"
              enablePhysics={true}
              enableClustering={true}
              enableFiltering={true}
              nodeSize="proportional"
              edgeWeight="proportional"
              layoutAlgorithm="force"
              onNodeClick={(node) => {
                console.log('Nó da rede selecionado:', node);
              }}
              onEdgeClick={(edge) => {
                console.log('Conexão selecionada:', edge);
              }}
              className="mt-4"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;