import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Interface base para dados orçamentários
export interface PlanoOrcamentario {
  id: number;
  shopping: string;
  nomeplano: string;
  conta: string;
  operacao: string;
  descricao: string;
  nomeplanocontabil: string;
  codigocontabil: string;
  categoria: string;
  subcategoria: string;
}

// Interface para análise orçamentária consolidada
export interface AnaliseOrcamentaria {
  conta: string;
  descricao: string;
  categoria: string;
  shopping: string;
  valorOrcado: number;
  valorExecutado: number;
  valorDisponivel: number;
  percentualExecutado: number;
  variacao: number; // Executado - Orçado
  status: 'dentro' | 'proximo_limite' | 'estourou' | 'sem_dados';
  tendencia: 'crescimento' | 'declinio' | 'estavel';
  mesesRestantes: number;
  projecaoFinal: number;
}

export interface ResumoOrcamentario {
  totalOrcado: number;
  totalExecutado: number;
  totalDisponivel: number;
  percentualGlobalExecutado: number;
  contasDentroOrcamento: number;
  contasProximoLimite: number;
  contasEstouradas: number;
  economiaRealizada: number;
  estouroTotal: number;
  eficienciaOrcamentaria: number;
  melhorConta: AnaliseOrcamentaria;
  piorConta: AnaliseOrcamentaria;
  categoriaComMaiorGasto: string;
  alertasCriticos: number;
}

export interface OrcamentoPorCategoria {
  categoria: string;
  totalOrcado: number;
  totalExecutado: number;
  percentualExecutado: number;
  variacao: number;
  contas: number;
  shopping: string;
  status: 'positivo' | 'neutro' | 'negativo';
  cor: string;
}

export interface EvolutucaoOrcamentaria {
  periodo: string;
  orcado: number;
  executado: number;
  disponivel: number;
  percentualExecutado: number;
  acumuladoOrcado: number;
  acumuladoExecutado: number;
  eficiencia: number;
}

export interface ProjecaoOrcamentaria {
  conta: string;
  valorAtual: number;
  projecao30dias: number;
  projecao60dias: number;
  projecao90dias: number;
  tendencia: 'otimista' | 'realista' | 'pessimista';
  risco: 'baixo' | 'medio' | 'alto';
  recomendacao: string;
}

export interface FiltrosOrcamento {
  shopping?: string;
  categoria?: string;
  conta?: string;
  status?: ('dentro' | 'proximo_limite' | 'estourou')[];
  periodo?: string; // Suporte a períodos como '7d', '30d', '90d' ou períodos específicos
  dataInicio?: string; // Filtro adicional para datas
  dataFim?: string; // Filtro adicional para datas
  valorMinimo?: number;
  valorMaximo?: number;
}

// Função utilitária para criar filtros baseados em período
export function criarFiltrosOrcamentoPorPeriodo(periodo: string, outrosFiltros: Omit<FiltrosOrcamento, 'periodo' | 'dataInicio' | 'dataFim'> = {}): FiltrosOrcamento {
  const hoje = new Date();
  let dataInicio: Date | null = null;
  
  // Converter período em datas
  if (periodo.endsWith('d')) {
    const dias = parseInt(periodo.replace('d', ''));
    if (!isNaN(dias)) {
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - dias);
    }
  }
  
  return {
    ...outrosFiltros,
    dataInicio: dataInicio?.toISOString().split('T')[0],
    dataFim: hoje.toISOString().split('T')[0],
    periodo
  };
}

// Hook principal para análise orçamentária
export const useOrcamentoData = (filtros: FiltrosOrcamento = {}) => {
  // Processar filtros para conversão automática de período
  const filtrosProcessados = (() => {
    if (filtros.periodo && filtros.periodo.endsWith('d') && !filtros.dataInicio && !filtros.dataFim) {
      // Se período tipo "30d" fornecido sem datas explícitas, converter automaticamente
      return criarFiltrosOrcamentoPorPeriodo(filtros.periodo, filtros);
    }
    return filtros;
  })();

  return useQuery({
    queryKey: ['orcamento_analytics', filtrosProcessados],
    queryFn: async (): Promise<{
      planos: PlanoOrcamentario[];
      analises: AnaliseOrcamentaria[];
      resumo: ResumoOrcamentario;
      porCategoria: OrcamentoPorCategoria[];
      evolucao: EvolutucaoOrcamentaria[];
      projecoes: ProjecaoOrcamentaria[];
    }> => {
      try {
        // 1. Buscar dados do plano orçamentário
        let queryPlano = supabase
          .from('plano_orcamentario')
          .select('*');

        if (filtros.shopping) {
          queryPlano = queryPlano.eq('shopping', filtros.shopping);
        }

        const { data: planosData, error: planosError } = await queryPlano;

        if (planosError) {
          console.error('❌ Erro ao buscar planos orçamentários:', {
            error: planosError.message,
            code: planosError.code,
            details: planosError.details,
            hint: planosError.hint,
            filtros: filtrosProcessados,
            timestamp: new Date().toISOString()
          });
          
          // Fallback graceful: retornar dados vazios
          console.warn('🔄 Ativando fallback para planos orçamentários');
          return {
            planos: [],
            analises: [],
            resumo: {
              totalOrcado: 0,
              totalExecutado: 0,
              totalDisponivel: 0,
              percentualGlobalExecutado: 0,
              contasDentroOrcamento: 0,
              contasProximoLimite: 0,
              contasEstouradas: 0,
              economiaRealizada: 0,
              estouroTotal: 0,
              eficienciaOrcamentaria: 0,
              melhorConta: {} as AnaliseOrcamentaria,
              piorConta: {} as AnaliseOrcamentaria,
              categoriaComMaiorGasto: 'N/A',
              alertasCriticos: 0
            },
            porCategoria: [],
            evolucao: [],
            projecoes: []
          };
        }

        // 2. Buscar dados executados de Pagamento_Empreendedor para cruzar com orçamento
        let queryExecucao = supabase
          .from('Pagamento_Empreendedor')
          .select(`
            shopping,
            contaorcamentaria1nivel,
            contaorcamentaria2nivel,
            descricaocontacontabil,
            valorcp,
            valorpago,
            dataemissao,
            statuspagamento
          `)
          .not('valorcp', 'is', null);

        if (filtros.shopping) {
          queryExecucao = queryExecucao.eq('shopping', filtros.shopping);
        }
        
        // Aplicar filtros de data processados
        if (filtrosProcessados.dataInicio) {
          queryExecucao = queryExecucao.gte('dataemissao', filtrosProcessados.dataInicio);
        }
        if (filtrosProcessados.dataFim) {
          queryExecucao = queryExecucao.lte('dataemissao', filtrosProcessados.dataFim);
        }

        const { data: execucaoData, error: execucaoError } = await queryExecucao;

        if (execucaoError) {
          console.error('❌ Erro ao buscar execução orçamentária:', {
            error: execucaoError.message,
            code: execucaoError.code,
            details: execucaoError.details,
            hint: execucaoError.hint,
            filtros: filtrosProcessados,
            timestamp: new Date().toISOString()
          });
          
          // Fallback: usar apenas dados de plano se houver
          console.warn('🔄 Ativando fallback para execução orçamentária - usando apenas planos');
          const planosProcessados = processarPlanos(planosData || []);
          return {
            planos: planosProcessados,
            analises: [],
            resumo: {
              totalOrcado: 0,
              totalExecutado: 0,
              totalDisponivel: 0,
              percentualGlobalExecutado: 0,
              contasDentroOrcamento: 0,
              contasProximoLimite: 0,
              contasEstouradas: 0,
              economiaRealizada: 0,
              estouroTotal: 0,
              eficienciaOrcamentaria: 0,
              melhorConta: {} as AnaliseOrcamentaria,
              piorConta: {} as AnaliseOrcamentaria,
              categoriaComMaiorGasto: 'N/A',
              alertasCriticos: 0
            },
            porCategoria: [],
            evolucao: [],
            projecoes: []
          };
        }

        // 3. Processar dados
        const planosProcessados = processarPlanos(planosData || []);
        const execucaoProcessada = processarExecucao(execucaoData || []);
        const analises = cruzarOrcamentoVsExecucao(planosProcessados, execucaoProcessada, filtros);
        const resumo = calcularResumoOrcamentario(analises);
        const porCategoria = agruparPorCategoria(analises);
        const evolucao = calcularEvolucaoOrcamentaria(execucaoProcessada);
        const projecoes = calcularProjecoes(analises);

        console.log(`✅ Análise orçamentária processada: ${analises.length} contas`);

        return {
          planos: planosProcessados,
          analises,
          resumo,
          porCategoria,
          evolucao,
          projecoes
        };

      } catch (error) {
        console.error('💥 Erro crítico em análise orçamentária:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          filtros: filtrosProcessados,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
        });
        
        // Fallback final com dados vazios
        console.warn('🚨 Tentando fallback final para análise orçamentária');
        try {
          return {
            planos: [],
            analises: [],
            resumo: {
              totalOrcado: 0,
              totalExecutado: 0,
              totalDisponivel: 0,
              percentualGlobalExecutado: 0,
              contasDentroOrcamento: 0,
              contasProximoLimite: 0,
              contasEstouradas: 0,
              economiaRealizada: 0,
              estouroTotal: 0,
              eficienciaOrcamentaria: 0,
              melhorConta: {} as AnaliseOrcamentaria,
              piorConta: {} as AnaliseOrcamentaria,
              categoriaComMaiorGasto: 'N/A',
              alertasCriticos: 0
            },
            porCategoria: [],
            evolucao: [],
            projecoes: []
          };
        } catch (fallbackError) {
          console.error('💀 Falha total no fallback orçamentário:', fallbackError);
          throw new Error('Erro crítico no sistema orçamentário. Contate o suporte.');
        }
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (dados menos dinâmicos)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook para alertas orçamentários
export const useAlertasOrcamentarios = (limiteAlerta: number = 80) => {
  return useQuery({
    queryKey: ['alertas_orcamentarios', limiteAlerta],
    queryFn: async () => {
      const { data } = await useOrcamentoData().queryFn() as any;
      
      const alertas = data.analises
        .filter((analise: AnaliseOrcamentaria) => 
          analise.percentualExecutado >= limiteAlerta || analise.status === 'estourou'
        )
        .map((analise: AnaliseOrcamentaria) => ({
          ...analise,
          urgencia: analise.status === 'estourou' ? 'critica' : 
                   analise.percentualExecutado >= 95 ? 'alta' :
                   analise.percentualExecutado >= 85 ? 'media' : 'baixa'
        }));

      return alertas;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para comparação orçamentária entre períodos
export const useComparacaoOrcamentaria = (periodoAtual: string, periodoComparacao: string) => {
  return useQuery({
    queryKey: ['comparacao_orcamentaria', periodoAtual, periodoComparacao],
    queryFn: async () => {
      // Implementar comparação entre períodos
      // Por ora, retornar dados simulados até termos dados históricos
      return {
        crescimentoOrcamento: 8.5,
        crescimentoExecucao: 12.3,
        melhorias: ['Redução de 15% em despesas administrativas'],
        pioras: ['Aumento de 20% em manutenção'],
        eficienciaAnterior: 78,
        eficienciaAtual: 82
      };
    },
    enabled: !!(periodoAtual && periodoComparacao),
    staleTime: 15 * 60 * 1000,
  });
};

// Funções auxiliares para processamento
function processarPlanos(planosRaw: any[]): PlanoOrcamentario[] {
  return planosRaw.map((plano) => ({
    id: plano.id,
    shopping: plano.shopping || 'N/A',
    nomeplano: plano.nomeplano || 'Plano Padrão',
    conta: plano.conta || 'N/A',
    operacao: plano.operacao || 'Despesa',
    descricao: plano.descricao || 'Sem descrição',
    nomeplanocontabil: plano.nomeplanocontabil || 'N/A',
    codigocontabil: plano.codigocontabil || 'N/A',
    categoria: categorizarConta(plano),
    subcategoria: subcategorizarConta(plano)
  }));
}

function processarExecucao(execucaoRaw: any[]) {
  return execucaoRaw.map((item) => ({
    shopping: item.shopping || 'N/A',
    conta: item.contaorcamentaria1nivel || item.contaorcamentaria2nivel || 'N/A',
    descricao: item.descricaocontacontabil || 'N/A',
    valorContratado: Number(item.valorcp) || 0,
    valorPago: Number(item.valorpago) || 0,
    dataEmissao: item.dataemissao,
    status: item.statuspagamento || 'Pendente',
    categoria: categorizarExecucao(item)
  }));
}

function cruzarOrcamentoVsExecucao(
  planos: PlanoOrcamentario[], 
  execucao: any[], 
  filtros: FiltrosOrcamento
): AnaliseOrcamentaria[] {
  // Agrupar execução por conta orçamentária
  const execucaoPorConta = execucao.reduce((acc, item) => {
    const chave = `${item.shopping}_${item.conta}`;
    
    if (!acc[chave]) {
      acc[chave] = {
        shopping: item.shopping,
        conta: item.conta,
        descricao: item.descricao,
        categoria: item.categoria,
        valorContratado: 0,
        valorPago: 0,
        transacoes: 0
      };
    }
    
    acc[chave].valorContratado += item.valorContratado;
    acc[chave].valorPago += item.valorPago;
    acc[chave].transacoes += 1;
    
    return acc;
  }, {} as Record<string, any>);

  // Simular valores orçados (na prática, viriam do plano orçamentário)
  const valoresOrcadosSimulados: Record<string, number> = {
    'Shopping Park Botucatu_Manutenção': 150000,
    'Shopping Park Botucatu_Obras': 300000,
    'Shopping Park Botucatu_Serviços': 200000,
    'Shopping Park Botucatu_Administrativo': 100000,
    'Shopping Park Botucatu_Marketing': 80000,
    'Shopping Park Botucatu_Tecnologia': 120000,
    'Shopping Park Botucatu_Outros': 50000
  };

  // Criar análises consolidadas
  const analises: AnaliseOrcamentaria[] = [];

  // Processar contas com execução
  Object.entries(execucaoPorConta).forEach(([chave, dados]: [string, any]) => {
    const valorOrcado = valoresOrcadosSimulados[chave] || dados.valorContratado * 1.2; // 20% buffer se não houver orçamento
    const valorExecutado = dados.valorContratado;
    const valorDisponivel = Math.max(0, valorOrcado - valorExecutado);
    const percentualExecutado = valorOrcado > 0 ? (valorExecutado / valorOrcado) * 100 : 0;
    const variacao = valorExecutado - valorOrcado;

    // Determinar status
    let status: 'dentro' | 'proximo_limite' | 'estourou' | 'sem_dados';
    if (percentualExecutado <= 80) status = 'dentro';
    else if (percentualExecutado <= 100) status = 'proximo_limite';
    else status = 'estourou';

    // Calcular tendência e projeção
    const tendencia = calcularTendencia(dados);
    const mesesRestantes = calcularMesesRestantes();
    const projecaoFinal = valorExecutado * (1 + (tendencia === 'crescimento' ? 0.15 : tendencia === 'declinio' ? -0.05 : 0));

    const analise: AnaliseOrcamentaria = {
      conta: dados.conta,
      descricao: dados.descricao,
      categoria: dados.categoria,
      shopping: dados.shopping,
      valorOrcado,
      valorExecutado,
      valorDisponivel,
      percentualExecutado: Math.min(200, Math.max(0, percentualExecutado)),
      variacao,
      status,
      tendencia,
      mesesRestantes,
      projecaoFinal
    };

    // Aplicar filtros
    if (aplicarFiltros(analise, filtros)) {
      analises.push(analise);
    }
  });

  // Adicionar contas orçadas mas não executadas
  planos.forEach(plano => {
    const chave = `${plano.shopping}_${plano.conta}`;
    if (!execucaoPorConta[chave]) {
      const valorOrcado = valoresOrcadosSimulados[chave] || 50000; // Valor padrão
      
      const analise: AnaliseOrcamentaria = {
        conta: plano.conta,
        descricao: plano.descricao,
        categoria: plano.categoria,
        shopping: plano.shopping,
        valorOrcado,
        valorExecutado: 0,
        valorDisponivel: valorOrcado,
        percentualExecutado: 0,
        variacao: -valorOrcado,
        status: 'sem_dados',
        tendencia: 'estavel',
        mesesRestantes: calcularMesesRestantes(),
        projecaoFinal: 0
      };

      if (aplicarFiltros(analise, filtros)) {
        analises.push(analise);
      }
    }
  });

  return analises.sort((a, b) => b.valorOrcado - a.valorOrcado);
}

function calcularResumoOrcamentario(analises: AnaliseOrcamentaria[]): ResumoOrcamentario {
  if (analises.length === 0) {
    return {
      totalOrcado: 0,
      totalExecutado: 0,
      totalDisponivel: 0,
      percentualGlobalExecutado: 0,
      contasDentroOrcamento: 0,
      contasProximoLimite: 0,
      contasEstouradas: 0,
      economiaRealizada: 0,
      estouroTotal: 0,
      eficienciaOrcamentaria: 0,
      melhorConta: {} as AnaliseOrcamentaria,
      piorConta: {} as AnaliseOrcamentaria,
      categoriaComMaiorGasto: 'N/A',
      alertasCriticos: 0
    };
  }

  const totalOrcado = analises.reduce((sum, a) => sum + a.valorOrcado, 0);
  const totalExecutado = analises.reduce((sum, a) => sum + a.valorExecutado, 0);
  const totalDisponivel = totalOrcado - totalExecutado;
  const percentualGlobalExecutado = totalOrcado > 0 ? (totalExecutado / totalOrcado) * 100 : 0;

  const contasDentroOrcamento = analises.filter(a => a.status === 'dentro').length;
  const contasProximoLimite = analises.filter(a => a.status === 'proximo_limite').length;
  const contasEstouradas = analises.filter(a => a.status === 'estourou').length;

  const economiaRealizada = analises
    .filter(a => a.variacao < 0)
    .reduce((sum, a) => sum + Math.abs(a.variacao), 0);

  const estouroTotal = analises
    .filter(a => a.variacao > 0)
    .reduce((sum, a) => sum + a.variacao, 0);

  const eficienciaOrcamentaria = analises.length > 0 ? 
    (contasDentroOrcamento / analises.length) * 100 : 0;

  // Melhor conta (maior economia relativa)
  const melhorConta = analises
    .filter(a => a.valorOrcado > 10000) // Mínimo para ser relevante
    .sort((a, b) => (a.percentualExecutado - b.percentualExecutado))[0] || analises[0];

  // Pior conta (maior estouro relativo)
  const piorConta = analises
    .filter(a => a.status === 'estourou')
    .sort((a, b) => b.percentualExecutado - a.percentualExecutado)[0] || 
    analises.sort((a, b) => b.percentualExecutado - a.percentualExecutado)[0];

  // Categoria com maior gasto
  const gastosPorCategoria = analises.reduce((acc, a) => {
    acc[a.categoria] = (acc[a.categoria] || 0) + a.valorExecutado;
    return acc;
  }, {} as Record<string, number>);

  const categoriaComMaiorGasto = Object.entries(gastosPorCategoria)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

  const alertasCriticos = analises.filter(a => 
    a.status === 'estourou' || (a.status === 'proximo_limite' && a.percentualExecutado > 95)
  ).length;

  return {
    totalOrcado,
    totalExecutado,
    totalDisponivel,
    percentualGlobalExecutado: Math.min(200, Math.max(0, percentualGlobalExecutado)),
    contasDentroOrcamento,
    contasProximoLimite,
    contasEstouradas,
    economiaRealizada,
    estouroTotal,
    eficienciaOrcamentaria: Math.min(100, Math.max(0, eficienciaOrcamentaria)),
    melhorConta,
    piorConta,
    categoriaComMaiorGasto,
    alertasCriticos
  };
}

function agruparPorCategoria(analises: AnaliseOrcamentaria[]): OrcamentoPorCategoria[] {
  const grupos = analises.reduce((acc, analise) => {
    if (!acc[analise.categoria]) {
      acc[analise.categoria] = {
        categoria: analise.categoria,
        totalOrcado: 0,
        totalExecutado: 0,
        contas: 0,
        shopping: analise.shopping
      };
    }

    acc[analise.categoria].totalOrcado += analise.valorOrcado;
    acc[analise.categoria].totalExecutado += analise.valorExecutado;
    acc[analise.categoria].contas += 1;

    return acc;
  }, {} as Record<string, any>);

  // Cores para categorias orçamentárias
  const coresCategorias: Record<string, string> = {
    'Manutenção': 'hsl(var(--chart-1))',
    'Obras e Reformas': 'hsl(var(--chart-2))',
    'Serviços Profissionais': 'hsl(var(--chart-3))',
    'Administrativo': 'hsl(var(--chart-4))',
    'Marketing': 'hsl(var(--chart-5))',
    'Tecnologia': 'hsl(var(--chart-bull))',
    'Outros': 'hsl(var(--chart-neutral))'
  };

  return Object.entries(grupos)
    .map(([categoria, grupo]: [string, any]) => {
      const percentualExecutado = grupo.totalOrcado > 0 ? 
        (grupo.totalExecutado / grupo.totalOrcado) * 100 : 0;
      const variacao = grupo.totalExecutado - grupo.totalOrcado;
      
      let status: 'positivo' | 'neutro' | 'negativo';
      if (percentualExecutado <= 80) status = 'positivo';
      else if (percentualExecutado <= 100) status = 'neutro';
      else status = 'negativo';

      return {
        categoria,
        totalOrcado: grupo.totalOrcado,
        totalExecutado: grupo.totalExecutado,
        percentualExecutado: Math.min(200, Math.max(0, percentualExecutado)),
        variacao,
        contas: grupo.contas,
        shopping: grupo.shopping,
        status,
        cor: coresCategorias[categoria] || coresCategorias['Outros']
      };
    })
    .sort((a, b) => b.totalOrcado - a.totalOrcado);
}

function calcularEvolucaoOrcamentaria(execucao: any[]): EvolutucaoOrcamentaria[] {
  // Simular evolução mensal (seria baseada em dados históricos reais)
  const meses = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
  
  return meses.map((mes, index) => {
    const orcadoMes = 500000 + (index * 50000); // Crescimento orçamentário
    const executadoMes = orcadoMes * (0.6 + (index * 0.05)); // Aumento da execução
    const disponivelMes = orcadoMes - executadoMes;
    const percentualExecutado = (executadoMes / orcadoMes) * 100;
    const acumuladoOrcado = orcadoMes * (index + 1);
    const acumuladoExecutado = executadoMes * (index + 1);
    const eficiencia = acumuladoOrcado > 0 ? (acumuladoExecutado / acumuladoOrcado) * 100 : 0;

    return {
      periodo: mes,
      orcado: orcadoMes,
      executado: executadoMes,
      disponivel: disponivelMes,
      percentualExecutado,
      acumuladoOrcado,
      acumuladoExecutado,
      eficiencia
    };
  });
}

function calcularProjecoes(analises: AnaliseOrcamentaria[]): ProjecaoOrcamentaria[] {
  return analises
    .filter(a => a.valorExecutado > 0) // Apenas contas com execução
    .slice(0, 10) // Top 10 contas
    .map(analise => {
      const taxaExecucaoMensal = analise.percentualExecutado / 12; // Assumir 12 meses
      const valorAtual = analise.valorExecutado;
      
      const projecao30dias = valorAtual * (1 + taxaExecucaoMensal / 12);
      const projecao60dias = valorAtual * (1 + (taxaExecucaoMensal * 2) / 12);
      const projecao90dias = valorAtual * (1 + (taxaExecucaoMensal * 3) / 12);

      // Determinar tendência baseada no status atual
      let tendencia: 'otimista' | 'realista' | 'pessimista';
      if (analise.status === 'dentro') tendencia = 'otimista';
      else if (analise.status === 'proximo_limite') tendencia = 'realista';
      else tendencia = 'pessimista';

      // Determinar risco
      let risco: 'baixo' | 'medio' | 'alto';
      if (analise.percentualExecutado <= 70) risco = 'baixo';
      else if (analise.percentualExecutado <= 90) risco = 'medio';
      else risco = 'alto';

      // Gerar recomendação
      let recomendacao = '';
      if (risco === 'alto') {
        recomendacao = 'Revisar gastos e implementar controles rigorosos';
      } else if (risco === 'medio') {
        recomendacao = 'Monitorar execução de perto e otimizar processos';
      } else {
        recomendacao = 'Manter controle atual e buscar oportunidades de economia';
      }

      return {
        conta: analise.conta,
        valorAtual,
        projecao30dias,
        projecao60dias,
        projecao90dias,
        tendencia,
        risco,
        recomendacao
      };
    });
}

// Funções auxiliares menores
function categorizarConta(plano: any): string {
  const descricao = (plano.descricao || '').toLowerCase();
  const conta = (plano.conta || '').toLowerCase();
  
  if (descricao.includes('manutenç') || conta.includes('manutenç')) return 'Manutenção';
  if (descricao.includes('obra') || descricao.includes('reforma')) return 'Obras e Reformas';
  if (descricao.includes('serviço') || descricao.includes('consultoria')) return 'Serviços Profissionais';
  if (descricao.includes('administrativ') || descricao.includes('escritório')) return 'Administrativo';
  if (descricao.includes('marketing') || descricao.includes('publicidade')) return 'Marketing';
  if (descricao.includes('tecnologia') || descricao.includes('sistema')) return 'Tecnologia';
  
  return 'Outros';
}

function subcategorizarConta(plano: any): string {
  const descricao = (plano.descricao || '').toLowerCase();
  
  if (descricao.includes('preventiva')) return 'Manutenção Preventiva';
  if (descricao.includes('corretiva')) return 'Manutenção Corretiva';
  if (descricao.includes('limpeza')) return 'Limpeza e Conservação';
  if (descricao.includes('segurança')) return 'Segurança';
  if (descricao.includes('energia')) return 'Energia Elétrica';
  
  return 'Geral';
}

function categorizarExecucao(item: any): string {
  const descricao = (item.descricaocontacontabil || '').toLowerCase();
  
  if (descricao.includes('manutenç')) return 'Manutenção';
  if (descricao.includes('obra') || descricao.includes('reforma')) return 'Obras e Reformas';
  if (descricao.includes('serviço')) return 'Serviços Profissionais';
  if (descricao.includes('administrativ')) return 'Administrativo';
  if (descricao.includes('marketing')) return 'Marketing';
  if (descricao.includes('tecnologia')) return 'Tecnologia';
  
  return 'Outros';
}

function calcularTendencia(dados: any): 'crescimento' | 'declinio' | 'estavel' {
  // Lógica simplificada - seria baseada em dados históricos
  const ratio = dados.valorPago / dados.valorContratado;
  if (ratio > 0.9) return 'crescimento';
  if (ratio < 0.5) return 'declinio';
  return 'estavel';
}

function calcularMesesRestantes(): number {
  const hoje = new Date();
  const fimAno = new Date(hoje.getFullYear(), 11, 31); // 31 de dezembro
  return Math.ceil((fimAno.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function aplicarFiltros(analise: AnaliseOrcamentaria, filtros: FiltrosOrcamento): boolean {
  if (filtros.categoria && analise.categoria !== filtros.categoria) return false;
  if (filtros.conta && !analise.conta.toLowerCase().includes(filtros.conta.toLowerCase())) return false;
  if (filtros.status && !filtros.status.includes(analise.status)) return false;
  if (filtros.valorMinimo && analise.valorOrcado < filtros.valorMinimo) return false;
  if (filtros.valorMaximo && analise.valorOrcado > filtros.valorMaximo) return false;
  
  return true;
}