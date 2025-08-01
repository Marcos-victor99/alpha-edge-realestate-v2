import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formatadores brasileiros para o dashboard de portfólio imobiliário
 */

// Formatador de moeda brasileira
export function formatarMoeda(valor: number): string {
  // Validação para valores undefined ou null
  if (valor === undefined || valor === null || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

// Formatador de moeda compacta (para KPIs)
export function formatarMoedaCompacta(valor: number): string {
  // Validação para valores undefined ou null
  if (valor === undefined || valor === null || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  if (valor >= 1000000000) {
    return `R$ ${(valor / 1000000000).toFixed(1)}B`;
  }
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}K`;
  }
  return formatarMoeda(valor);
}

// Formatador de porcentagem brasileira
export function formatarPorcentagem(valor: number, casasDecimais = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor / 100);
}

// Formatador de número brasileiro
export function formatarNumero(valor: number, casasDecimais = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}

// Formatador de data brasileira
export function formatarData(data: string | Date, formato = 'dd/MM/yyyy'): string {
  const dataObj = typeof data === 'string' ? parseISO(data) : data;
  return format(dataObj, formato, { locale: ptBR });
}

// Formatador de data completa (para tooltips)
export function formatarDataCompleta(data: string | Date): string {
  return formatarData(data, "dd 'de' MMMM 'de' yyyy");
}

// Formatador de data e hora
export function formatarDataHora(data: string | Date): string {
  return formatarData(data, 'dd/MM/yyyy HH:mm');
}

// Formatador de variação financeira (com sinal e cor)
export function formatarVariacao(valor: number, isPercentual = true): {
  texto: string;
  tipo: 'positivo' | 'negativo' | 'neutro';
} {
  if (valor === 0) {
    return { texto: '0%', tipo: 'neutro' };
  }
  
  const sinal = valor > 0 ? '+' : '';
  const valorFormatado = isPercentual 
    ? formatarPorcentagem(Math.abs(valor))
    : formatarMoedaCompacta(Math.abs(valor));
  
  return {
    texto: `${sinal}${valorFormatado}`,
    tipo: valor > 0 ? 'positivo' : 'negativo'
  };
}

// Formatador de área (m²)
export function formatarArea(area: number): string {
  return `${formatarNumero(area, 2)} m²`;
}

// Formatador de taxa de inadimplência
export function formatarInadimplencia(valor: number): { valor: string; nivel: string } {
  const cor = valor > 5 ? 'alta' : valor > 2 ? 'media' : 'baixa';
  return {
    valor: formatarPorcentagem(valor),
    nivel: cor
  };
}

// Formatador de período/competência
export function formatarPeriodo(dataInicio: string | Date, dataFim: string | Date): string {
  const inicio = formatarData(dataInicio, 'MMM/yyyy');
  const fim = formatarData(dataFim, 'MMM/yyyy');
  
  if (inicio === fim) {
    return inicio;
  }
  
  return `${inicio} - ${fim}`;
}

// Formatador de status de pagamento
export function formatarStatusPagamento(status: string): {
  texto: string;
  cor: 'success' | 'warning' | 'error' | 'info';
} {
  const statusMap: Record<string, { texto: string; cor: 'success' | 'warning' | 'error' | 'info' }> = {
    'PAGO': { texto: 'Pago', cor: 'success' },
    'PENDENTE': { texto: 'Pendente', cor: 'warning' },
    'VENCIDO': { texto: 'Vencido', cor: 'error' },
    'CANCELADO': { texto: 'Cancelado', cor: 'error' },
    'PROCESSANDO': { texto: 'Processando', cor: 'info' },
  };
  
  return statusMap[status.toUpperCase()] || { texto: status, cor: 'info' };
}

// Formatador de NOI (Net Operating Income)
export function formatarNOI(receitas: number, despesas: number): {
  valor: string;
  margem: string;
  tipo: 'positivo' | 'negativo';
} {
  const noi = receitas - despesas;
  const margem = receitas > 0 ? (noi / receitas) * 100 : 0;
  
  return {
    valor: formatarMoedaCompacta(noi),
    margem: formatarPorcentagem(margem),
    tipo: noi >= 0 ? 'positivo' : 'negativo'
  };
}

// Formatador para gráficos Tremor (para valueFormatter)
export function formatadorGrafico(valor: number): string {
  return formatarMoedaCompacta(valor);
}

// Formatador para tooltips de gráficos
export function formatadorTooltip(valor: number, categoria: string): string {
  return `${categoria}: ${formatarMoedaCompacta(valor)}`;
}

// Utilitário para classificar risco baseado em valor
export function classificarRisco(valor: number, limites = { baixo: 2, medio: 5 }): {
  nivel: 'baixo' | 'medio' | 'alto';
  cor: string;
  icone: string;
} {
  if (valor <= limites.baixo) {
    return { nivel: 'baixo', cor: 'text-tremor-positive', icone: '🟢' };
  }
  if (valor <= limites.medio) {
    return { nivel: 'medio', cor: 'text-tremor-warning', icone: '🟡' };
  }
  return { nivel: 'alto', cor: 'text-tremor-negative', icone: '🔴' };
}

// Formatador de tempo de resposta
export function formatarTempo(segundos: number): string {
  if (segundos < 60) {
    return `${segundos}s`;
  }
  
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  
  if (minutos < 60) {
    return segundosRestantes > 0 
      ? `${minutos}min ${segundosRestantes}s`
      : `${minutos}min`;
  }
  
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  
  return `${horas}h ${minutosRestantes}min`;
}

// 🛡️ Função utilitária para conversão segura de números com toFixed
export function safeToFixed(valor: number | undefined | null, casasDecimais = 2): string {
  // Validação robusta para valores undefined, null ou NaN
  if (valor === undefined || valor === null || isNaN(valor)) {
    return '0' + (casasDecimais > 0 ? '.' + '0'.repeat(casasDecimais) : '');
  }
  
  // Garantir que é um número válido
  const numeroValido = Number(valor);
  if (isNaN(numeroValido)) {
    return '0' + (casasDecimais > 0 ? '.' + '0'.repeat(casasDecimais) : '');
  }
  
  return numeroValido.toFixed(casasDecimais);
}

// 🛡️ Formatador seguro de porcentagem (para CategoryBarCard)
export function formatarPorcentagemSegura(valor: number | undefined | null, casasDecimais = 1): string {
  const valorSeguro = safeToFixed(valor, casasDecimais);
  return `${valorSeguro}%`;
}

// 🛡️ Validador de dados numéricos
export function validarDadoNumerico(valor: unknown): number {
  if (valor === undefined || valor === null) return 0;
  const numero = Number(valor);
  return isNaN(numero) ? 0 : numero;
}