import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, Title, Text, Flex, Badge } from '@tremor/react';
import { PieChart as PieChartIcon, Target, TrendingUp, DollarSign } from 'lucide-react';
import { useMovimentacoesFinanceiras, useFaturamentoData, usePagamentoEmpreendedor } from '@/hooks/useFinancialData';
import { formatarMoeda, formatarData } from '@/lib/formatters';
import { softColors, semanticTokens, chartColors } from '@/lib/design-tokens';

interface TiposLancamentoChartProps {
  showInnerPie?: boolean;
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  showLegend?: boolean;
  showDetails?: boolean;
  onTypeClick?: (tipo: string) => void;
  filtros?: any;
}

interface TipoLancamento {
  tipo: string;
  valor: number;
  quantidade: number;
  percentual: number;
  cor: string;
  categoria: 'Receita' | 'Despesa' | 'Operacional';
  descricao: string;
}

// Usar cores suaves do design tokens
const CATEGORY_PALETTE = chartColors.series;

const SOFT_COLORS = {
  success: softColors.success[500],
  danger: softColors.danger[400], 
  primary: softColors.accent[500]
};

const TiposLancamentoChart: React.FC<TiposLancamentoChartProps> = ({
  showInnerPie = true,
  altura = 'lg',
  showLegend = true,
  showDetails = true,
  onTypeClick,
  filtros
}) => {
  const { data: movimentacoes, isLoading: movLoading } = useMovimentacoesFinanceiras();
  const { data: faturamento, isLoading: fatLoading } = useFaturamentoData();
  const { data: pagamentos, isLoading: pagLoading } = usePagamentoEmpreendedor();

  const isLoading = movLoading || fatLoading || pagLoading;

  // Processar todos os tipos de lançamentos
  const tiposLancamento = useMemo(() => {
    const tipos: Record<string, TipoLancamento> = {};
    let corIndex = 0;

    const adicionarTipo = (
      tipo: string, 
      valor: number, 
      categoria: 'Receita' | 'Despesa' | 'Operacional',
      descricao: string
    ) => {
      if (!tipos[tipo]) {
        tipos[tipo] = {
          tipo,
          valor: 0,
          quantidade: 0,
          percentual: 0,
          cor: CATEGORY_PALETTE[corIndex % CATEGORY_PALETTE.length],
          categoria,
          descricao
        };
        corIndex++;
      }
      tipos[tipo].valor += Math.abs(valor);
      tipos[tipo].quantidade += 1;
    };

    // Processar Movimentações Financeiras
    if (movimentacoes && movimentacoes.length > 0) {
      movimentacoes.forEach(mov => {
        const credito = Number(mov.Credito) || 0;
        const debito = Number(mov.Debito) || 0;
        const historico = mov.Historico || '';
        
        if (credito > 0) {
          let tipoCredito = 'Recebimentos Diversos';
          if (historico.toLowerCase().includes('aluguel')) {
            tipoCredito = 'Receitas de Aluguel';
          } else if (historico.toLowerCase().includes('taxa')) {
            tipoCredito = 'Taxas de Condomínio';
          }
          
          adicionarTipo(tipoCredito, credito, 'Receita', 'Valores recebidos');
        }
        
        if (debito > 0) {
          let tipoDebito = 'Pagamentos Diversos';
          if (historico.toLowerCase().includes('manutenção')) {
            tipoDebito = 'Despesas de Manutenção';
          } else if (historico.toLowerCase().includes('limpeza')) {
            tipoDebito = 'Despesas de Limpeza';
          }
          
          adicionarTipo(tipoDebito, debito, 'Despesa', 'Valores pagos');
        }
      });
    }

    // Processar Faturamento
    if (faturamento && faturamento.length > 0) {
      faturamento.forEach(fat => {
        const valorFaturado = Number(fat.valortotalfaturado) || 0;
        const valorPago = Number(fat.valortotalpago) || 0;
        const valorAberto = Number(fat.valortotalaberto) || 0;
        
        if (valorFaturado > 0) {
          adicionarTipo('Faturamento de Locações', valorFaturado, 'Receita', 'Valores faturados aos locatários');
        }
        
        if (valorPago > 0) {
          adicionarTipo('Recebimentos de Locações', valorPago, 'Receita', 'Valores efetivamente pagos');
        }
        
        if (valorAberto > 0) {
          adicionarTipo('Valores em Aberto', valorAberto, 'Operacional', 'Valores pendentes de recebimento');
        }
      });
    }

    // Processar Pagamentos de Empreendedor
    if (pagamentos && pagamentos.length > 0) {
      pagamentos.forEach(pag => {
        const valorCP = Number(pag.valorcp) || 0;
        const tipoDoc = pag.tipodocumento || 'Diversos';
        
        if (valorCP > 0) {
          let tipoPagamento = 'Despesas Administrativas';
          
          if (tipoDoc.toLowerCase().includes('iptu')) {
            tipoPagamento = 'IPTU e Impostos';
          } else if (tipoDoc.toLowerCase().includes('manutenção')) {
            tipoPagamento = 'Contratos de Manutenção';
          }
          
          adicionarTipo(tipoPagamento, valorCP, 'Despesa', 'Pagamentos a fornecedores');
        }
      });
    }

    // Calcular percentuais
    const totalValor = Object.values(tipos).reduce((sum, tipo) => sum + tipo.valor, 0);
    
    return Object.values(tipos).map(tipo => ({
      ...tipo,
      percentual: totalValor > 0 ? (tipo.valor / totalValor) * 100 : 0
    })).sort((a, b) => b.valor - a.valor).slice(0, 12);
  }, [movimentacoes, faturamento, pagamentos]);

  // Dados agregados por categoria
  const dadosPorCategoria = useMemo(() => {
    const categorias = tiposLancamento.reduce((acc, tipo) => {
      if (!acc[tipo.categoria]) {
        acc[tipo.categoria] = {
          categoria: tipo.categoria,
          valor: 0,
          quantidade: 0,
          cor: tipo.categoria === 'Receita' ? SOFT_COLORS.success : 
               tipo.categoria === 'Despesa' ? SOFT_COLORS.danger : 
               SOFT_COLORS.primary
        };
      }
      acc[tipo.categoria].valor += tipo.valor;
      acc[tipo.categoria].quantidade += tipo.quantidade;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(categorias);
  }, [tiposLancamento]);

  // Métricas resumo
  const metricas = useMemo(() => {
    if (tiposLancamento.length === 0) return null;

    const totalReceitas = tiposLancamento
      .filter(t => t.categoria === 'Receita')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const totalDespesas = tiposLancamento
      .filter(t => t.categoria === 'Despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const totalOperacional = tiposLancamento
      .filter(t => t.categoria === 'Operacional')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const totalTransacoes = tiposLancamento.reduce((sum, t) => sum + t.quantidade, 0);

    return {
      totalReceitas,
      totalDespesas,
      totalOperacional,
      totalTransacoes,
      margemLiquida: totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0
    };
  }, [tiposLancamento]);

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.tipo}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Valor:</span>
              <span className="font-medium">{formatarMoeda(data.valor)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Participação:</span>
              <span className="font-medium">{data.percentual.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Transações:</span>
              <span className="font-medium">{data.quantidade}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">{data.descricao}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const alturaMap = {
    sm: 'h-64',
    md: 'h-80', 
    lg: 'h-96',
    xl: 'h-[500px]'
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className={`bg-gray-200 rounded-full ${alturaMap[altura]} mx-auto max-w-sm`}></div>
        </div>
      </Card>
    );
  }

  if (tiposLancamento.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum tipo de lançamento encontrado</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header com métricas */}
      <Flex alignItems="start" justifyContent="between" className="mb-6">
        <div className="flex-1">
          <Flex alignItems="center" justifyContent="start" className="gap-2 mb-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: semanticTokens.surface.accent }}
            >
              <PieChartIcon 
                className="h-5 w-5" 
                style={{ color: semanticTokens.text.accent }}
              />
            </div>
            <div>
              <Title className="text-lg font-semibold">Tipos de Lançamentos Financeiros</Title>
              <Text className="text-sm text-gray-600">
                Distribuição por categorias de receitas, despesas e operações
              </Text>
            </div>
          </Flex>

          {/* Métricas resumo com cores suaves */}
          {metricas && showDetails && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: semanticTokens.surface.success }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: semanticTokens.text.success }}
                >
                  Total Receitas
                </Text>
                <Text 
                  className="text-lg font-bold"
                  style={{ color: softColors.success[700] }}
                >
                  {formatarMoeda(metricas.totalReceitas)}
                </Text>
              </div>
              
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: semanticTokens.surface.danger }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: semanticTokens.text.danger }}
                >
                  Total Despesas
                </Text>
                <Text 
                  className="text-lg font-bold"
                  style={{ color: softColors.danger[600] }}
                >
                  {formatarMoeda(metricas.totalDespesas)}
                </Text>
              </div>
              
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: semanticTokens.surface.accent }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: semanticTokens.text.accent }}
                >
                  Operacional
                </Text>
                <Text 
                  className="text-lg font-bold"
                  style={{ color: softColors.accent[700] }}
                >
                  {formatarMoeda(metricas.totalOperacional)}
                </Text>
              </div>
              
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: semanticTokens.surface.warning }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: semanticTokens.text.warning }}
                >
                  Margem Líquida
                </Text>
                <Text 
                  className="text-lg font-bold"
                  style={{ 
                    color: metricas.margemLiquida >= 0 
                      ? softColors.success[600] 
                      : softColors.danger[600] 
                  }}
                >
                  {metricas.margemLiquida.toFixed(1)}%
                </Text>
              </div>
            </div>
          )}
        </div>

        <Badge 
          icon={Target}
          size="sm"
          style={{
            backgroundColor: semanticTokens.surface.accent,
            color: semanticTokens.text.accent,
            border: `1px solid ${semanticTokens.border.accent}`
          }}
        >
          {tiposLancamento.length} Tipos
        </Badge>
      </Flex>

      {/* Gráfico Rosca */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Rosca externa - Tipos detalhados */}
            <Pie
              data={tiposLancamento}
              cx="50%"
              cy="50%"
              outerRadius={showInnerPie ? 140 : 120}
              innerRadius={showInnerPie ? 90 : 50}
              paddingAngle={2}
              dataKey="valor"
              onClick={(data) => onTypeClick && onTypeClick(data.tipo)}
              label={({ tipo, percentual }) => 
                percentual > 5 ? `${tipo.substring(0, 15)}...` : ''
              }
              labelLine={false}
            >
              {tiposLancamento.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.cor}
                  stroke="#fff"
                  strokeWidth={2}
                  className="hover:opacity-80 cursor-pointer transition-opacity"
                />
              ))}
            </Pie>

            {/* Rosca interna - Categorias principais */}
            {showInnerPie && (
              <Pie
                data={dadosPorCategoria}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={80}
                paddingAngle={1}
                dataKey="valor"
              >
                {dadosPorCategoria.map((entry, index) => (
                  <Cell 
                    key={`inner-cell-${index}`} 
                    fill={entry.cor}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
            )}

            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista detalhada dos principais tipos */}
      {showDetails && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Flex alignItems="center" justifyContent="between" className="mb-4">
            <Text className="text-sm font-semibold">Principais Tipos de Lançamento:</Text>
            {metricas && (
              <Text className="text-xs text-gray-500">
                {metricas.totalTransacoes.toLocaleString()} transações totais
              </Text>
            )}
          </Flex>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tiposLancamento.slice(0, 8).map((tipo, index) => (
              <div 
                key={tipo.tipo}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onTypeClick && onTypeClick(tipo.tipo)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: tipo.cor }}
                  />
                  <div className="min-w-0 flex-1">
                    <Text className="text-sm font-medium truncate">{tipo.tipo}</Text>
                    <Text className="text-xs text-gray-500">
                      {tipo.quantidade} transações • {tipo.categoria}
                    </Text>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Text className="text-sm font-semibold">
                    {formatarMoeda(tipo.valor)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {tipo.percentual.toFixed(1)}%
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TiposLancamentoChart;