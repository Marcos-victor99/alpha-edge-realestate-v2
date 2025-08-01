import { mean, sum, min, max } from 'd3-array';

// Interfaces para análise de variância
export interface VarianceDataPoint {
  periodo: string;
  previsto: number;
  realizado: number;
  categoria?: string;
  meta?: number;
}

export interface VarianceAnalysisResult {
  // Métricas básicas
  totalPrevisto: number;
  totalRealizado: number;
  variacaoAbsoluta: number;
  variacaoPercentual: number;
  
  // Análise de eficiência
  eficienciaMedia: number;
  eficienciaMinima: number;
  eficienciaMaxima: number;
  
  // Análise de dispersão
  desvioPadrao: number;
  coeficienteVariacao: number;
  
  // Análise de tendências
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  correlacaoPeriodos: number;
  
  // Análise de performance
  periodosMelhores: VarianceDataPoint[];
  periodosProblematicos: VarianceDataPoint[];
  
  // Previsões
  projecaoProximoPeriodo: number;
  confiancaProjecao: number;
  
  // Insights automáticos
  insights: VarianceInsight[];
}

export interface VarianceInsight {
  tipo: 'positivo' | 'negativo' | 'neutro' | 'alerta';
  categoria: 'eficiencia' | 'tendencia' | 'variabilidade' | 'meta';
  titulo: string;
  descricao: string;
  valor?: number;
  recomendacao?: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

// Função principal de análise de variância
export const analyzeVariance = (data: VarianceDataPoint[]): VarianceAnalysisResult => {
  if (!data || data.length === 0) {
    throw new Error('Dados insuficientes para análise de variância');
  }

  // Cálculos básicos
  const totalPrevisto = sum(data, d => d.previsto) || 0;
  const totalRealizado = sum(data, d => d.realizado) || 0;
  const variacaoAbsoluta = totalRealizado - totalPrevisto;
  const variacaoPercentual = totalPrevisto > 0 ? (variacaoAbsoluta / totalPrevisto) * 100 : 0;

  // Calcular eficiências por período
  const eficiencias = data.map(d => d.previsto > 0 ? (d.realizado / d.previsto) * 100 : 0);
  const eficienciaMedia = mean(eficiencias) || 0;
  const eficienciaMinima = min(eficiencias) || 0;
  const eficienciaMaxima = max(eficiencias) || 0;

  // Análise de dispersão
  const desvioPadrao = calculateStandardDeviation(eficiencias);
  const coeficienteVariacao = eficienciaMedia > 0 ? (desvioPadrao / eficienciaMedia) * 100 : 0;

  // Análise de tendências
  const tendencia = calculateTrend(data);
  const correlacaoPeriodos = calculateCorrelation(data);

  // Análise de performance
  const periodosMelhores = data
    .filter(d => d.previsto > 0 && (d.realizado / d.previsto) >= 1.1)
    .sort((a, b) => (b.realizado / b.previsto) - (a.realizado / a.previsto))
    .slice(0, 3);

  const periodosProblematicos = data
    .filter(d => d.previsto > 0 && (d.realizado / d.previsto) < 0.9)
    .sort((a, b) => (a.realizado / a.previsto) - (b.realizado / b.previsto))
    .slice(0, 3);

  // Previsões
  const projecaoProximoPeriodo = calculateProjection(data);
  const confiancaProjecao = calculateProjectionConfidence(data, desvioPadrao);

  // Gerar insights automáticos
  const insights = generateInsights({
    totalPrevisto,
    totalRealizado,
    variacaoAbsoluta,
    variacaoPercentual,
    eficienciaMedia,
    desvioPadrao,
    coeficienteVariacao,
    tendencia,
    periodosMelhores,
    periodosProblematicos
  });

  return {
    totalPrevisto,
    totalRealizado,
    variacaoAbsoluta,
    variacaoPercentual,
    eficienciaMedia,
    eficienciaMinima,
    eficienciaMaxima,
    desvioPadrao,
    coeficienteVariacao,
    tendencia,
    correlacaoPeriodos,
    periodosMelhores,
    periodosProblematicos,
    projecaoProximoPeriodo,
    confiancaProjecao,
    insights
  };
};

// Calcular desvio padrão
const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const média = mean(values) || 0;
  const somaQuadrados = sum(values, v => Math.pow(v - média, 2)) || 0;
  return Math.sqrt(somaQuadrados / values.length);
};

// Calcular tendência baseada na regressão linear simples
const calculateTrend = (data: VarianceDataPoint[]): 'crescente' | 'decrescente' | 'estavel' => {
  if (data.length < 3) return 'estavel';

  const eficiencias = data.map((d, index) => ({
    x: index,
    y: d.previsto > 0 ? (d.realizado / d.previsto) * 100 : 0
  }));

  // Calcular coeficiente angular da regressão linear
  const n = eficiencias.length;
  const somaX = sum(eficiencias, d => d.x) || 0;
  const somaY = sum(eficiencias, d => d.y) || 0;
  const somaXY = sum(eficiencias, d => d.x * d.y) || 0;
  const somaX2 = sum(eficiencias, d => d.x * d.x) || 0;

  const coeficienteAngular = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);

  if (coeficienteAngular > 2) return 'crescente';
  if (coeficienteAngular < -2) return 'decrescente';
  return 'estavel';
};

// Calcular correlação entre períodos
const calculateCorrelation = (data: VarianceDataPoint[]): number => {
  if (data.length < 2) return 0;

  const values = data.map(d => d.previsto > 0 ? (d.realizado / d.previsto) * 100 : 0);
  const indices = data.map((_, index) => index);

  const n = values.length;
  const somaIndices = sum(indices) || 0;
  const somaValues = sum(values) || 0;
  const somaIndicesValues = sum(indices.map((idx, i) => idx * values[i])) || 0;
  const somaIndices2 = sum(indices.map(idx => idx * idx)) || 0;
  const somaValues2 = sum(values.map(val => val * val)) || 0;

  const numerador = n * somaIndicesValues - somaIndices * somaValues;
  const denominador = Math.sqrt((n * somaIndices2 - somaIndices * somaIndices) * (n * somaValues2 - somaValues * somaValues));

  return denominador > 0 ? numerador / denominador : 0;
};

// Calcular projeção para próximo período
const calculateProjection = (data: VarianceDataPoint[]): number => {
  if (data.length === 0) return 0;

  // Usar média ponderada dos últimos 3 períodos
  const ultimosPeriodos = data.slice(-3);
  const pesos = [0.5, 0.3, 0.2]; // Dar mais peso aos períodos mais recentes

  const mediaUltimosPeriodos = ultimosPeriodos.reduce((acc, periodo, index) => {
    const eficiencia = periodo.previsto > 0 ? (periodo.realizado / periodo.previsto) : 1;
    return acc + (eficiencia * pesos[index]);
  }, 0);

  // Assumir que o próximo período terá o mesmo orçamento médio
  const orcamentoMedio = mean(data, d => d.previsto) || 0;
  return orcamentoMedio * mediaUltimosPeriodos;
};

// Calcular confiança da projeção
const calculateProjectionConfidence = (data: VarianceDataPoint[], desvioPadrao: number): number => {
  if (data.length < 3) return 0.5;

  // Confiança baseada na consistência histórica
  const consistencia = Math.max(0, 100 - desvioPadrao) / 100;
  const amostrageme = Math.min(data.length / 12, 1); // Mais dados = mais confiança
  
  return (consistencia * 0.7 + amostrageme * 0.3);
};

// Gerar insights automáticos
const generateInsights = (analysis: {
  totalPrevisto: number;
  totalRealizado: number;
  variacaoAbsoluta: number;
  variacaoPercentual: number;
  eficienciaMedia: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  periodosMelhores: VarianceDataPoint[];
  periodosProblematicos: VarianceDataPoint[];
}): VarianceInsight[] => {
  const insights: VarianceInsight[] = [];

  // Insight de eficiência geral
  if (analysis.variacaoPercentual > 10) {
    insights.push({
      tipo: 'positivo',
      categoria: 'eficiencia',
      titulo: 'Performance Acima do Esperado',
      descricao: `Execução ${analysis.variacaoPercentual.toFixed(1)}% acima do orçado`,
      valor: analysis.variacaoPercentual,
      recomendacao: 'Analisar fatores de sucesso para replicar em próximos períodos',
      prioridade: 'media'
    });
  } else if (analysis.variacaoPercentual < -10) {
    insights.push({
      tipo: 'negativo',
      categoria: 'eficiencia',
      titulo: 'Performance Abaixo do Esperado',
      descricao: `Execução ${Math.abs(analysis.variacaoPercentual).toFixed(1)}% abaixo do orçado`,
      valor: analysis.variacaoPercentual,
      recomendacao: 'Revisar planejamento orçamentário e identificar gaps de execução',
      prioridade: 'alta'
    });
  }

  // Insight de variabilidade
  if (analysis.coeficienteVariacao > 30) {
    insights.push({
      tipo: 'alerta',
      categoria: 'variabilidade',
      titulo: 'Alta Variabilidade na Execução',
      descricao: `Coeficiente de variação de ${analysis.coeficienteVariacao.toFixed(1)}%`,
      valor: analysis.coeficienteVariacao,
      recomendacao: 'Implementar controles mais rigorosos de execução orçamentária',
      prioridade: 'media'
    });
  }

  // Insight de tendência
  if (analysis.tendencia === 'decrescente') {
    insights.push({
      tipo: 'negativo',
      categoria: 'tendencia',
      titulo: 'Tendência Decrescente Detectada',
      descricao: 'Performance vem diminuindo ao longo dos períodos',
      recomendacao: 'Investigar causas da queda de performance e implementar ações corretivas',
      prioridade: 'alta'
    });
  } else if (analysis.tendencia === 'crescente') {
    insights.push({
      tipo: 'positivo',
      categoria: 'tendencia',
      titulo: 'Tendência de Melhoria',
      descricao: 'Performance vem melhorando ao longo dos períodos',
      recomendacao: 'Manter práticas atuais e considerar otimizações adicionais',
      prioridade: 'baixa'
    });
  }

  // Insight de períodos problemáticos
  if (analysis.periodosProblematicos.length > 0) {
    insights.push({
      tipo: 'alerta',
      categoria: 'meta',
      titulo: 'Períodos com Performance Crítica',
      descricao: `${analysis.periodosProblematicos.length} período(s) com execução abaixo de 90%`,
      recomendacao: 'Analisar especificamente os períodos críticos para identificar padrões',
      prioridade: 'media'
    });
  }

  return insights;
};

// Função utilitária para análise de categoria específica
export const analyzeVarianceByCategory = (
  data: VarianceDataPoint[], 
  categoria: string
): VarianceAnalysisResult => {
  const filteredData = data.filter(d => d.categoria === categoria);
  return analyzeVariance(filteredData);
};

// Função para comparar múltiplas categorias
export const compareVarianceByCategories = (
  data: VarianceDataPoint[]
): Record<string, VarianceAnalysisResult> => {
  const categorias = [...new Set(data.map(d => d.categoria).filter(Boolean))];
  
  return categorias.reduce((acc, categoria) => {
    acc[categoria!] = analyzeVarianceByCategory(data, categoria!);
    return acc;
  }, {} as Record<string, VarianceAnalysisResult>);
};

export default analyzeVariance;