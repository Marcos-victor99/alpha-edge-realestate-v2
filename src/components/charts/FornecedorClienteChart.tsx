import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Card, Title, Text, Flex, Badge, Button } from '@tremor/react';
import { Users, Building, TrendingUp, Filter, ArrowUpDown } from 'lucide-react';
import { useFaturamentoData, usePagamentoEmpreendedor } from '@/hooks/useFinancialData';
import { SUPPLIER_CLIENT_PALETTE, DEFAULT_CHART_CONFIG, SOFT_COLORS } from '@/lib/chart-colors';
import { formatarMoeda, formatarData } from '@/lib/formatters';

interface FornecedorClienteChartProps {
  tipoVisualizacao?: 'scatter' | 'bar' | 'comparison';
  altura?: 'sm' | 'md' | 'lg' | 'xl';
  showFilter?: boolean;
  limite?: number;
  onEntityClick?: (entity: string, type: 'fornecedor' | 'cliente') => void;
}

interface EntidadeFinanceira {
  nome: string;
  tipo: 'Fornecedor' | 'Cliente';
  valorTotal: number;
  valorMedio: number;
  transacoes: number;
  categoria: string;
  shopping: string;
  ultimaMovimentacao: string;
  status: 'Ativo' | 'Inativo';
  cor: string;
  risco?: 'Baixo' | 'Médio' | 'Alto';
}

interface ComparacaoFinanceira {
  entidade: string;
  receitas: number;
  despesas: number;
  saldoLiquido: number;
  transacoes: number;
  categoria: string;
}

const FornecedorClienteChart: React.FC<FornecedorClienteChartProps> = ({
  tipoVisualizacao = 'scatter',
  altura = 'lg',
  showFilter = true,
  limite = 20,
  onEntityClick
}) => {
  const { data: faturamento, isLoading: fatLoading } = useFaturamentoData();
  const { data: pagamentos, isLoading: pagLoading } = usePagamentoEmpreendedor();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fornecedores' | 'clientes'>('todos');
  const [ordenacao, setOrdenacao] = useState<'valor' | 'transacoes' | 'nome'>('valor');

  const isLoading = fatLoading || pagLoading;

  // 📊 Processar dados de clientes (locatários)
  const clientes = useMemo(() => {
    if (!faturamento || faturamento.length === 0) return [];

    const clientesMap: Record<string, EntidadeFinanceira> = {};
    let corIndex = 0;

    faturamento.forEach(fat => {
      const nomeCliente = fat.locatario || 'N/A';
      const razaoSocial = fat.nomerazaosocial || nomeCliente;
      const valorFaturado = Number(fat.valortotalfaturado) || 0;
      const valorPago = Number(fat.valortotalpago) || 0;
      const dataVencimento = fat.datavencimento || '';
      const statusCliente = fat.statuscliente || 'Ativo';
      const categoria = fat.categoria || 'Varejo';
      const shopping = fat.shopping || 'N/A';

      const chave = `${nomeCliente}_${razaoSocial}`;
      
      if (!clientesMap[chave]) {
        clientesMap[chave] = {
          nome: razaoSocial,
          tipo: 'Cliente',
          valorTotal: 0,
          valorMedio: 0,
          transacoes: 0,
          categoria,
          shopping,
          ultimaMovimentacao: dataVencimento,
          status: statusCliente as 'Ativo' | 'Inativo',
          cor: SUPPLIER_CLIENT_PALETTE[1], // Cor para clientes
          risco: 'Baixo'
        };
        corIndex++;
      }

      clientesMap[chave].valorTotal += valorPago; // Usar valor pago (receita efetiva)
      clientesMap[chave].transacoes += 1;
      
      // Atualizar última movimentação
      if (dataVencimento > clientesMap[chave].ultimaMovimentacao) {
        clientesMap[chave].ultimaMovimentacao = dataVencimento;
      }
    });

    // Calcular valor médio e risco
    return Object.values(clientesMap).map(cliente => {
      cliente.valorMedio = cliente.transacoes > 0 ? cliente.valorTotal / cliente.transacoes : 0;
      
      // Determinar risco baseado no padrão de pagamentos
      if (cliente.valorMedio > 50000) {
        cliente.risco = 'Baixo';
      } else if (cliente.valorMedio > 10000) {
        cliente.risco = 'Médio';
      } else {
        cliente.risco = 'Alto';
      }
      
      return cliente;
    }).filter(c => c.valorTotal > 0);
  }, [faturamento]);

  // 🏢 Processar dados de fornecedores
  const fornecedores = useMemo(() => {
    if (!pagamentos || pagamentos.length === 0) return [];

    const fornecedoresMap: Record<string, EntidadeFinanceira> = {};
    let corIndex = 0;

    pagamentos.forEach(pag => {
      const nomeFornecedor = pag.fornecedor || 'N/A';
      const nomeFantasia = pag.nomefantasia || nomeFornecedor;
      const valorCP = Number(pag.valorcp) || 0;
      const dataEmissao = pag.dataemissao || '';
      const tipoDoc = pag.tipodocumento || 'Serviços';
      const shopping = pag.shopping || 'N/A';

      const chave = `${nomeFornecedor}_${nomeFantasia}`;
      
      if (!fornecedoresMap[chave]) {
        fornecedoresMap[chave] = {
          nome: nomeFantasia,
          tipo: 'Fornecedor',
          valorTotal: 0,
          valorMedio: 0,
          transacoes: 0,
          categoria: tipoDoc,
          shopping,
          ultimaMovimentacao: dataEmissao,
          status: 'Ativo',
          cor: SUPPLIER_CLIENT_PALETTE[0], // Cor para fornecedores
          risco: 'Baixo'
        };
        corIndex++;
      }

      fornecedoresMap[chave].valorTotal += valorCP;
      fornecedoresMap[chave].transacoes += 1;
      
      // Atualizar última movimentação
      if (dataEmissao > fornecedoresMap[chave].ultimaMovimentacao) {
        fornecedoresMap[chave].ultimaMovimentacao = dataEmissao;
      }
    });

    // Calcular valor médio
    return Object.values(fornecedoresMap).map(fornecedor => {
      fornecedor.valorMedio = fornecedor.transacoes > 0 ? fornecedor.valorTotal / fornecedor.transacoes : 0;
      return fornecedor;
    }).filter(f => f.valorTotal > 0);
  }, [pagamentos]);

  // 🔄 Combinar dados para comparação
  const dadosComparativos = useMemo(() => {
    const todasEntidades = [...clientes, ...fornecedores];
    
    // Filtrar baseado no filtro selecionado
    let entidadesFiltradas = todasEntidades;
    if (filtroTipo === 'fornecedores') {
      entidadesFiltradas = fornecedores;
    } else if (filtroTipo === 'clientes') {
      entidadesFiltradas = clientes;
    }
    
    // Ordenar
    entidadesFiltradas.sort((a, b) => {
      switch (ordenacao) {
        case 'transacoes':
          return b.transacoes - a.transacoes;
        case 'nome':
          return a.nome.localeCompare(b.nome);
        default:
          return b.valorTotal - a.valorTotal;
      }
    });
    
    return entidadesFiltradas.slice(0, limite);
  }, [clientes, fornecedores, filtroTipo, ordenacao, limite]);

  // 📊 Dados para scatter plot (relação valor x transações)
  const dadosScatter = useMemo(() => {
    return dadosComparativos.map(entidade => ({
      x: entidade.transacoes,
      y: entidade.valorTotal,
      nome: entidade.nome,
      tipo: entidade.tipo,
      categoria: entidade.categoria,
      valorMedio: entidade.valorMedio,
      cor: entidade.cor,
      risco: entidade.risco
    }));
  }, [dadosComparativos]);

  // 📈 Métricas resumo
  const metricas = useMemo(() => {
    const totalReceitas = clientes.reduce((sum, c) => sum + c.valorTotal, 0);
    const totalDespesas = fornecedores.reduce((sum, f) => sum + f.valorTotal, 0);
    const saldoLiquido = totalReceitas - totalDespesas;
    const totalTransacoes = [...clientes, ...fornecedores].reduce((sum, e) => sum + e.transacoes, 0);
    
    const principalCliente = clientes.sort((a, b) => b.valorTotal - a.valorTotal)[0];
    const principalFornecedor = fornecedores.sort((a, b) => b.valorTotal - a.valorTotal)[0];
    
    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      totalTransacoes,
      numClientes: clientes.length,
      numFornecedores: fornecedores.length,
      principalCliente,
      principalFornecedor,
      ticketMedioCliente: clientes.length > 0 ? totalReceitas / clientes.length : 0,
      ticketMedioFornecedor: fornecedores.length > 0 ? totalDespesas / fornecedores.length : 0
    };
  }, [clientes, fornecedores]);

  // 🎨 Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={DEFAULT_CHART_CONFIG.tooltipStyle}>
          <p className="font-semibold mb-2">{data.nome}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tipo:</span>
              <Badge size="xs" className={data.tipo === 'Cliente' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}>
                {data.tipo}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Valor Total:</span>
              <span className="font-medium">{formatarMoeda(data.y)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Transações:</span>
              <span className="font-medium">{data.x}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Valor Médio:</span>
              <span className="font-medium">{formatarMoeda(data.valorMedio)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Categoria:</span>
              <span className="text-xs">{data.categoria}</span>
            </div>
            {data.risco && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Risco:</span>
                <Badge size="xs" className={`${
                  data.risco === 'Alto' ? 'bg-red-50 text-red-700' :
                  data.risco === 'Médio' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {data.risco}
                </Badge>
              </div>
            )}
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
          <div className={`bg-gray-200 rounded ${alturaMap[altura]}`}></div>
        </div>
      </Card>
    );
  }

  if (dadosComparativos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado de fornecedor/cliente encontrado</p>
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
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
              <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <Title className="text-lg font-semibold">Análise Fornecedores vs Clientes</Title>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Relacionamento financeiro entre fornecedores e locatários
              </Text>
            </div>
          </Flex>

          {/* Métricas resumo */}
          {metricas && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <Building className="h-4 w-4 text-blue-600" />
                  <Text className="text-xs text-blue-700 font-medium">Clientes</Text>
                </Flex>
                <Text className="text-lg font-bold text-blue-800">
                  {metricas.numClientes}
                </Text>
                <Text className="text-xs text-blue-600">
                  Ticket: {formatarMoeda(metricas.ticketMedioCliente)}
                </Text>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <Users className="h-4 w-4 text-orange-600" />
                  <Text className="text-xs text-orange-700 font-medium">Fornecedores</Text>
                </Flex>
                <Text className="text-lg font-bold text-orange-800">
                  {metricas.numFornecedores}
                </Text>
                <Text className="text-xs text-orange-600">
                  Ticket: {formatarMoeda(metricas.ticketMedioFornecedor)}
                </Text>
              </div>
              
              <div className={`p-3 rounded-lg ${
                metricas.saldoLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <Flex alignItems="center" justifyContent="start" className="gap-2 mb-1">
                  <TrendingUp className={`h-4 w-4 ${
                    metricas.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <Text className={`text-xs font-medium ${
                    metricas.saldoLiquido >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>Saldo Líquido</Text>
                </Flex>
                <Text className={`text-lg font-bold ${
                  metricas.saldoLiquido >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatarMoeda(metricas.saldoLiquido)}
                </Text>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <Text className="text-xs text-purple-700 font-medium">Total Transações</Text>
                <Text className="text-lg font-bold text-purple-800">
                  {metricas.totalTransacoes.toLocaleString()}
                </Text>
                <Text className="text-xs text-purple-600">
                  Movimentações
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        {showFilter && (
          <div className="flex flex-col gap-2">
            <Flex alignItems="center" justifyContent="end" className="gap-2">
              <Button 
                size="xs" 
                variant={filtroTipo === 'todos' ? 'primary' : 'secondary'}
                onClick={() => setFiltroTipo('todos')}
              >
                Todos
              </Button>
              <Button 
                size="xs" 
                variant={filtroTipo === 'clientes' ? 'primary' : 'secondary'}
                onClick={() => setFiltroTipo('clientes')}
              >
                Clientes
              </Button>
              <Button 
                size="xs" 
                variant={filtroTipo === 'fornecedores' ? 'primary' : 'secondary'}
                onClick={() => setFiltroTipo('fornecedores')}
              >
                Fornecedores
              </Button>
            </Flex>
            
            <Button 
              size="xs" 
              variant="secondary"
              icon={ArrowUpDown}
              onClick={() => {
                const nextOrder = ordenacao === 'valor' ? 'transacoes' : 
                                ordenacao === 'transacoes' ? 'nome' : 'valor';
                setOrdenacao(nextOrder);
              }}
            >
              {ordenacao === 'valor' ? 'Por Valor' : 
               ordenacao === 'transacoes' ? 'Por Transações' : 'Por Nome'}
            </Button>
          </div>
        )}
      </Flex>

      {/* Gráfico */}
      <div className={alturaMap[altura]}>
        <ResponsiveContainer width="100%" height="100%">
          {tipoVisualizacao === 'scatter' ? (
            <ScatterChart
              data={dadosScatter}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                type="number"
                dataKey="x"
                name="Transações"
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <YAxis 
                type="number"
                dataKey="y"
                name="Valor Total"
                tickFormatter={(value) => formatarMoeda(value, true)}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle} />
              
              <Scatter 
                name="Fornecedores" 
                data={dadosScatter.filter(d => d.tipo === 'Fornecedor')}
                fill={SUPPLIER_CLIENT_PALETTE[0]}
                onClick={(data) => onEntityClick && onEntityClick(data.nome, 'fornecedor')}
              />
              <Scatter 
                name="Clientes" 
                data={dadosScatter.filter(d => d.tipo === 'Cliente')}
                fill={SUPPLIER_CLIENT_PALETTE[1]}
                onClick={(data) => onEntityClick && onEntityClick(data.nome, 'cliente')}
              />
            </ScatterChart>
          ) : (
            <BarChart
              data={dadosComparativos}
              margin={DEFAULT_CHART_CONFIG.margin}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={DEFAULT_CHART_CONFIG.gridStroke}
              />
              <XAxis 
                dataKey="nome"
                tick={{ fontSize: 10 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => formatarMoeda(value, true)}
                tick={{ fontSize: 11 }}
                stroke={DEFAULT_CHART_CONFIG.axisStroke}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={DEFAULT_CHART_CONFIG.legendStyle} />
              
              <Bar
                dataKey="valorTotal"
                name="Valor Total"
                radius={[2, 2, 0, 0]}
                onClick={(data) => onEntityClick && onEntityClick(data.nome, data.tipo.toLowerCase() as any)}
              >
                {dadosComparativos.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cor}
                    className="hover:opacity-80 cursor-pointer transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Top Entidades */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clientes */}
          <div>
            <Text className="text-sm font-semibold mb-3">Principais Clientes:</Text>
            <div className="space-y-2">
              {clientes.slice(0, 5).map((cliente, index) => (
                <div 
                  key={cliente.nome}
                  className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={() => onEntityClick && onEntityClick(cliente.nome, 'cliente')}
                >
                  <div className="flex items-center gap-2">
                    <Badge size="xs">{index + 1}</Badge>
                    <div>
                      <Text className="text-sm font-medium">{cliente.nome}</Text>
                      <Text className="text-xs text-gray-500">{cliente.categoria}</Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text className="text-sm font-semibold text-blue-700">
                      {formatarMoeda(cliente.valorTotal)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {cliente.transacoes} transações
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Fornecedores */}
          <div>
            <Text className="text-sm font-semibold mb-3">Principais Fornecedores:</Text>
            <div className="space-y-2">
              {fornecedores.slice(0, 5).map((fornecedor, index) => (
                <div 
                  key={fornecedor.nome}
                  className="flex items-center justify-between p-2 bg-orange-50 rounded hover:bg-orange-100 cursor-pointer transition-colors"
                  onClick={() => onEntityClick && onEntityClick(fornecedor.nome, 'fornecedor')}
                >
                  <div className="flex items-center gap-2">
                    <Badge size="xs">{index + 1}</Badge>
                    <div>
                      <Text className="text-sm font-medium">{fornecedor.nome}</Text>
                      <Text className="text-xs text-gray-500">{fornecedor.categoria}</Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text className="text-sm font-semibold text-orange-700">
                      {formatarMoeda(fornecedor.valorTotal)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {fornecedor.transacoes} transações
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FornecedorClienteChart;