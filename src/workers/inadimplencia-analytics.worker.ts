// Web Worker especializado para análises avançadas de inadimplência
// Este worker processa cálculos pesados de forma não-bloqueante

export interface InadimplenciaRecord {
  id: number;
  Shopping: string | null;
  LUC: string | null;
  ContratoMaster: string | null;
  Locatario: string | null;
  NomeRazao: string | null;
  CpfCnpj: string | null;
  StatusCliente: string | null;
  Parcela: string | null;
  "Status Parcela": string | null;
  DataCompetenciaInicio: string | null;
  DataCompetenciaTermino: string | null;
  DataVencimento: string | null;
  DataProrrogacao: string | null;
  DataPagamento: string | null;
  Boleto: string | null;
  ResumoContratual: string | null;
  ValorFaturado: number | null;
  Desconto: number | null;
  Correcao: number | null;
  Juros: number | null;
  Multa: number | null;
  ValorPago: number | null;
  ValorInativo: number | null;
  Inadimplencia: number | null;
  DataProcessamentoPagamento: string | null;
  UsuarioProcessamentoPagamento: string | null;
  imported_at: string | null;
}

export interface RiskScore {
  locatario: string;
  shopping: string;
  riskScore: number; // 0-100
  riskCategory: 'baixo' | 'medio' | 'alto' | 'critico';
  factors: {
    valorTotalAtrasado: number;
    diasAtraso: number;
    frequenciaAtrasos: number;
    tendenciaRecente: 'melhorando' | 'estavel' | 'piorando';
    capacidadePagamento: number; // 0-100
  };
  recomendacoes: string[];
  probabilidadeRecuperacao: number; // 0-100
}

export interface PredictiveAnalysis {
  shopping: string;
  previsao30Dias: {
    inadimplenciaEsperada: number;
    confianca: number;
    cenarios: {
      otimista: number;
      realista: number;
      pessimista: number;
    };
  };
  previsao90Dias: {
    inadimplenciaEsperada: number;
    confianca: number;
    cenarios: {
      otimista: number;
      realista: number;
      pessimista: number;
    };
  };
  tendencias: {
    sazonalidade: number[];
    crescimento: number;
    volatilidade: number;
  };
}

export interface AnomalyDetection {
  tipo: 'valor_alto' | 'pagamento_suspeito' | 'padrao_incomum' | 'outlier_temporal';
  locatario: string;
  shopping: string;
  valorDetectado: number;
  valorEsperado: number;
  desvio: number;
  confianca: number;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  dataDeteccao: string;
}

export interface SegmentationAnalysis {
  shopping: string;
  segmentos: {
    baixoRisco: {
      count: number;
      valorTotal: number;
      ticketMedio: number;
      caracteristicas: string[];
    };
    medioRisco: {
      count: number;
      valorTotal: number;
      ticketMedio: number;
      caracteristicas: string[];
    };
    altoRisco: {
      count: number;
      valorTotal: number;
      ticketMedio: number;
      caracteristicas: string[];
    };
  };
  insights: string[];
  acoesSugeridas: string[];
}

// Algoritmo de Risk Scoring sofisticado
function calculateRiskScore(records: InadimplenciaRecord[], locatario: string): RiskScore {
  const locatarioRecords = records.filter(r => r.Locatario === locatario);
  
  if (locatarioRecords.length === 0) {
    return {
      locatario,
      shopping: 'N/A',
      riskScore: 0,
      riskCategory: 'baixo',
      factors: {
        valorTotalAtrasado: 0,
        diasAtraso: 0,
        frequenciaAtrasos: 0,
        tendenciaRecente: 'estavel',
        capacidadePagamento: 100
      },
      recomendacoes: [],
      probabilidadeRecuperacao: 0
    };
  }

  const shopping = locatarioRecords[0]?.Shopping || 'N/A';
  const valorTotalAtrasado = locatarioRecords.reduce((sum, r) => sum + (r.Inadimplencia || 0), 0);
  const valorTotalFaturado = locatarioRecords.reduce((sum, r) => sum + (r.ValorFaturado || 0), 0);
  
  // Calcular dias de atraso médio
  const agora = new Date();
  const diasAtrasoArray = locatarioRecords
    .filter(r => r.DataVencimento && r.Inadimplencia && r.Inadimplencia > 0)
    .map(r => {
      const vencimento = new Date(r.DataVencimento!);
      return Math.max(0, Math.floor((agora.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
    });
  
  const diasAtrasoMedio = diasAtrasoArray.length > 0 
    ? diasAtrasoArray.reduce((sum, dias) => sum + dias, 0) / diasAtrasoArray.length 
    : 0;

  // Frequência de atrasos (últimos 12 meses)
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  
  const recordsUltimoAno = locatarioRecords.filter(r => {
    if (!r.DataVencimento) return false;
    return new Date(r.DataVencimento) >= umAnoAtras;
  });
  
  const atrasosUltimoAno = recordsUltimoAno.filter(r => r.Inadimplencia && r.Inadimplencia > 0).length;
  const frequenciaAtrasos = recordsUltimoAno.length > 0 ? (atrasosUltimoAno / recordsUltimoAno.length) * 100 : 0;

  // Tendência recente (últimos 3 meses vs 3 meses anteriores)
  const treseMesesAtras = new Date();
  treseMesesAtras.setMonth(treseMesesAtras.getMonth() - 3);
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  const inadimplenciaRecente = locatarioRecords
    .filter(r => r.DataVencimento && new Date(r.DataVencimento) >= treseMesesAtras)
    .reduce((sum, r) => sum + (r.Inadimplencia || 0), 0);
  
  const inadimplenciaAnterior = locatarioRecords
    .filter(r => r.DataVencimento && new Date(r.DataVencimento) >= seisMesesAtras && new Date(r.DataVencimento) < treseMesesAtras)
    .reduce((sum, r) => sum + (r.Inadimplencia || 0), 0);

  let tendenciaRecente: 'melhorando' | 'estavel' | 'piorando' = 'estavel';
  if (inadimplenciaAnterior > 0) {
    const variacao = (inadimplenciaRecente - inadimplenciaAnterior) / inadimplenciaAnterior;
    if (variacao < -0.1) tendenciaRecente = 'melhorando';
    else if (variacao > 0.1) tendenciaRecente = 'piorando';
  }

  // Capacidade de pagamento (baseada no valor pago vs faturado)
  const valorTotalPago = locatarioRecords.reduce((sum, r) => sum + (r.ValorPago || 0), 0);
  const capacidadePagamento = valorTotalFaturado > 0 ? (valorTotalPago / valorTotalFaturado) * 100 : 0;

  // Calcular score de risco (0-100)
  let riskScore = 0;
  
  // Peso do valor em atraso (40%)
  if (valorTotalFaturado > 0) {
    riskScore += (valorTotalAtrasado / valorTotalFaturado) * 40;
  }
  
  // Peso dos dias de atraso (25%)
  riskScore += Math.min(25, (diasAtrasoMedio / 365) * 25);
  
  // Peso da frequência de atrasos (20%)
  riskScore += (frequenciaAtrasos / 100) * 20;
  
  // Peso da tendência recente (10%)
  if (tendenciaRecente === 'piorando') riskScore += 10;
  else if (tendenciaRecente === 'melhorando') riskScore -= 5;
  
  // Peso da capacidade de pagamento (5%)
  riskScore += Math.max(0, (100 - capacidadePagamento) / 100) * 5;

  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determinar categoria de risco
  let riskCategory: 'baixo' | 'medio' | 'alto' | 'critico';
  if (riskScore < 25) riskCategory = 'baixo';
  else if (riskScore < 50) riskCategory = 'medio';
  else if (riskScore < 75) riskCategory = 'alto';
  else riskCategory = 'critico';

  // Gerar recomendações
  const recomendacoes: string[] = [];
  if (riskScore > 70) {
    recomendacoes.push('Contato imediato com locatário');
    recomendacoes.push('Avaliação para renegociação');
  }
  if (diasAtrasoMedio > 90) {
    recomendacoes.push('Considerar ação judicial');
  }
  if (frequenciaAtrasos > 50) {
    recomendacoes.push('Revisar condições contratuais');
  }
  if (tendenciaRecente === 'piorando') {
    recomendacoes.push('Monitoramento semanal');
  }

  // Calcular probabilidade de recuperação
  let probabilidadeRecuperacao = 100 - riskScore;
  if (capacidadePagamento > 70) probabilidadeRecuperacao += 10;
  if (tendenciaRecente === 'melhorando') probabilidadeRecuperacao += 15;
  if (diasAtrasoMedio < 30) probabilidadeRecuperacao += 10;
  probabilidadeRecuperacao = Math.min(100, Math.max(0, probabilidadeRecuperacao));

  return {
    locatario,
    shopping,
    riskScore: Math.round(riskScore * 100) / 100,
    riskCategory,
    factors: {
      valorTotalAtrasado,
      diasAtraso: Math.round(diasAtrasoMedio),
      frequenciaAtrasos: Math.round(frequenciaAtrasos * 100) / 100,
      tendenciaRecente,
      capacidadePagamento: Math.round(capacidadePagamento * 100) / 100
    },
    recomendacoes,
    probabilidadeRecuperacao: Math.round(probabilidadeRecuperacao * 100) / 100
  };
}

// Análise preditiva usando médias móveis e sazonalidade
function generatePredictiveAnalysis(records: InadimplenciaRecord[], shopping: string): PredictiveAnalysis {
  const shoppingRecords = records.filter(r => r.Shopping === shopping);
  
  // Agrupar por mês
  const monthlyData = new Map<string, number>();
  shoppingRecords.forEach(record => {
    if (record.DataVencimento && record.Inadimplencia) {
      const date = new Date(record.DataVencimento);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + record.Inadimplencia);
    }
  });

  const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const values = sortedMonths.map(([_, value]) => value);

  if (values.length < 3) {
    // Dados insuficientes
    return {
      shopping,
      previsao30Dias: {
        inadimplenciaEsperada: 0,
        confianca: 0,
        cenarios: { otimista: 0, realista: 0, pessimista: 0 }
      },
      previsao90Dias: {
        inadimplenciaEsperada: 0,
        confianca: 0,
        cenarios: { otimista: 0, realista: 0, pessimista: 0 }
      },
      tendencias: {
        sazonalidade: [],
        crescimento: 0,
        volatilidade: 0
      }
    };
  }

  // Média móvel simples para previsão
  const windowSize = Math.min(3, values.length);
  const recentValues = values.slice(-windowSize);
  const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

  // Calcular tendência (regressão linear simples)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  recentValues.forEach((value, index) => {
    sumX += index;
    sumY += value;
    sumXY += index * value;
    sumXX += index * index;
  });

  const n = recentValues.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const tendencia = slope || 0;

  // Calcular volatilidade
  const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / recentValues.length;
  const volatilidade = Math.sqrt(variance);

  // Previsão para 30 dias (próximo mês)
  const previsao30 = average + tendencia;
  const confianca30 = Math.max(10, Math.min(90, 100 - (volatilidade / average) * 100));

  // Previsão para 90 dias (próximos 3 meses)
  const previsao90 = average + tendencia * 3;
  const confianca90 = Math.max(5, confianca30 * 0.7); // Menor confiança para prazo maior

  // Cenários
  const fatorVolatilidade = volatilidade / average;
  const cenarios30 = {
    otimista: Math.max(0, previsao30 * (1 - fatorVolatilidade)),
    realista: previsao30,
    pessimista: previsao30 * (1 + fatorVolatilidade)
  };

  const cenarios90 = {
    otimista: Math.max(0, previsao90 * (1 - fatorVolatilidade * 1.5)),
    realista: previsao90,
    pessimista: previsao90 * (1 + fatorVolatilidade * 1.5)
  };

  // Detectar sazonalidade básica (últimos 12 meses)
  const sazonalidade = new Array(12).fill(0);
  if (values.length >= 12) {
    const last12 = values.slice(-12);
    last12.forEach((value, index) => {
      sazonalidade[index] = value / average; // Fator sazonal
    });
  }

  return {
    shopping,
    previsao30Dias: {
      inadimplenciaEsperada: Math.round(previsao30),
      confianca: Math.round(confianca30),
      cenarios: {
        otimista: Math.round(cenarios30.otimista),
        realista: Math.round(cenarios30.realista),
        pessimista: Math.round(cenarios30.pessimista)
      }
    },
    previsao90Dias: {
      inadimplenciaEsperada: Math.round(previsao90),
      confianca: Math.round(confianca90),
      cenarios: {
        otimista: Math.round(cenarios90.otimista),
        realista: Math.round(cenarios90.realista),
        pessimista: Math.round(cenarios90.pessimista)
      }
    },
    tendencias: {
      sazonalidade: sazonalidade.map(s => Math.round(s * 100) / 100),
      crescimento: Math.round(tendencia * 100) / 100,
      volatilidade: Math.round(fatorVolatilidade * 100) / 100
    }
  };
}

// Detecção de anomalias usando métodos estatísticos
function detectAnomalies(records: InadimplenciaRecord[]): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  
  // Calcular estatísticas gerais
  const valores = records
    .filter(r => r.Inadimplencia && r.Inadimplencia > 0)
    .map(r => r.Inadimplencia!);
  
  if (valores.length < 10) return anomalies; // Dados insuficientes

  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  const desvioPadrao = Math.sqrt(variancia);

  // Limites para detecção de outliers (regra 3-sigma)
  const limiteInferior = media - 3 * desvioPadrao;
  const limiteSuperior = media + 3 * desvioPadrao;

  // Detectar valores anômalos
  records.forEach(record => {
    if (!record.Inadimplencia || record.Inadimplencia <= 0) return;

    const valor = record.Inadimplencia;
    const desvio = Math.abs(valor - media) / desvioPadrao;

    // Anomalia de valor alto
    if (valor > limiteSuperior) {
      anomalies.push({
        tipo: 'valor_alto',
        locatario: record.Locatario || 'N/A',
        shopping: record.Shopping || 'N/A',
        valorDetectado: valor,
        valorEsperado: media,
        desvio,
        confianca: Math.min(99, desvio * 20),
        descricao: `Valor de inadimplência ${desvio.toFixed(1)}x acima da média`,
        severidade: desvio > 5 ? 'critica' : desvio > 3 ? 'alta' : 'media',
        dataDeteccao: new Date().toISOString()
      });
    }

    // Anomalia de pagamento suspeito (valor pago muito alto em relação ao faturado)
    if (record.ValorPago && record.ValorFaturado && record.ValorPago > record.ValorFaturado * 1.2) {
      anomalies.push({
        tipo: 'pagamento_suspeito',
        locatario: record.Locatario || 'N/A',
        shopping: record.Shopping || 'N/A',
        valorDetectado: record.ValorPago,
        valorEsperado: record.ValorFaturado,
        desvio: record.ValorPago / record.ValorFaturado,
        confianca: 85,
        descricao: 'Valor pago superior ao faturado',
        severidade: 'alta',
        dataDeteccao: new Date().toISOString()
      });
    }
  });

  return anomalies.slice(0, 50); // Limitar a 50 anomalias
}

// Handler principal do worker
self.onmessage = function(e) {
  const { type, data, requestId } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateRiskScores': {
        const uniqueLocatarios = [...new Set(data.map((r: InadimplenciaRecord) => r.Locatario).filter(Boolean))];
        result = uniqueLocatarios.map(locatario => calculateRiskScore(data, locatario));
        break;
      }
        
      case 'generatePredictions': {
        const uniqueShoppings = [...new Set(data.map((r: InadimplenciaRecord) => r.Shopping).filter(Boolean))];
        result = uniqueShoppings.map(shopping => generatePredictiveAnalysis(data, shopping));
        break;
      }
        
      case 'detectAnomalies':
        result = detectAnomalies(data);
        break;
        
      case 'analyzeSegmentation':
        // Implementar análise de segmentação aqui
        result = { message: 'Segmentation analysis not implemented yet' };
        break;
        
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }
    
    self.postMessage({
      requestId,
      success: true,
      result
    });
    
  } catch (error) {
    self.postMessage({
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Exportar tipos para TypeScript
export type {
  InadimplenciaRecord,
  RiskScore,
  PredictiveAnalysis,
  AnomalyDetection,
  SegmentationAnalysis
};