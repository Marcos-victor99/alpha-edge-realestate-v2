# Guia de Uso de Ícones - Dashboard Financeiro

## 📋 Padrões de Ícones por Categoria

### 💰 Financeiro
- `DollarSign` - Valores monetários, receitas
- `TrendingUp` - Crescimento, performance positiva
- `TrendingDown` - Declínio, performance negativa
- `Calculator` - Cálculos, orçamentos
- `CreditCard` - Pagamentos, transações
- `Wallet` - Carteira, fundos disponíveis

### 📊 Análise e Métricas
- `BarChart3` - Gráficos de barras, comparações
- `LineChart` - Tendências temporais
- `PieChart` - Distribuições, proporções
- `Activity` - Atividade, movimentação
- `Target` - Metas, objetivos
- `Zap` - Insights automáticos, IA

### 🏢 Imobiliário
- `Building2` - Shopping centers, propriedades
- `Users` - Locatários, clientes
- `MapPin` - Localização geográfica
- `Layers` - Portfólio, camadas de análise

### ⚠️ Alertas e Status
- `AlertTriangle` - Avisos, inadimplência
- `CheckCircle` - Sucesso, aprovado
- `XCircle` - Erro, rejeitado
- `Clock` - Pendente, tempo
- `Calendar` - Datas, vencimentos

### 🧠 Inteligência e Analytics
- `Brain` - IA, machine learning
- `Network` - Grafos, relacionamentos
- `Grid3x3` - Heatmaps, matriz
- `Filter` - Filtros, segmentação

## 🎨 Convenções de Cores

### Por Contexto Financeiro
```tsx
// Receitas e positivo
<TrendingUp className="h-5 w-5 text-emerald-600" />

// Despesas e negativo  
<TrendingDown className="h-5 w-5 text-red-600" />

// Alertas e atenção
<AlertTriangle className="h-5 w-5 text-amber-600" />

// Informações neutras
<Calculator className="h-5 w-5 text-blue-600" />
```

### Por Severidade
```tsx
// Crítico - Vermelho
<XCircle className="h-5 w-5 text-red-600" />

// Atenção - Âmbar
<AlertTriangle className="h-5 w-5 text-amber-600" />

// Sucesso - Verde
<CheckCircle className="h-5 w-5 text-emerald-600" />

// Informação - Azul
<Brain className="h-5 w-5 text-blue-600" />

// IA/Premium - Roxo
<Zap className="h-5 w-5 text-purple-600" />
```

## 📐 Tamanhos Padronizados

```tsx
// Mini (12x12) - Para badges e indicadores pequenos
<Icon className="h-3 w-3" />

// Pequeno (16x16) - Para textos e listas
<Icon className="h-4 w-4" />

// Padrão (20x20) - Para cards e componentes principais
<Icon className="h-5 w-5" />

// Médio (24x24) - Para headers e destaque
<Icon className="h-6 w-6" />

// Grande (32x32) - Para estados vazios e ilustrações
<Icon className="h-8 w-8" />
```

## 🔄 Padrão de Importação

### ✅ Correto
```tsx
import { 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calculator
} from "lucide-react";
```

### ❌ Incorreto
```tsx
// Não importar individualmente
import { DollarSign } from "lucide-react";
import { TrendingUp } from "lucide-react";

// Não usar imports dinâmicos para ícones
const Icon = await import('lucide-react').then(m => m.DollarSign);
```

## 🏗️ Estrutura de Componentes

### KpiCard - Ícones por Tipo
```tsx
// Receita
<KpiCard icone={DollarSign} cor="emerald" />

// Performance
<KpiCard icone={TrendingUp} cor="blue" />

// Alerta
<KpiCard icone={AlertTriangle} cor="red" />

// Meta
<KpiCard icone={Target} cor="purple" />
```

### ChartCard - Ícones por Tipo de Gráfico
```tsx
// Gráfico de barras
<ChartCard icone={BarChart3} />

// Linha temporal
<ChartCard icone={Activity} />

// Análise geográfica
<ChartCard icone={MapPin} />

// IA/Analytics
<ChartCard icone={Brain} />
```

## 🔍 Validação Automática

O projeto inclui validação automática de imports via:

1. **Script de Validação**: `npm run validate:imports`
2. **ESLint Rule**: Regra customizada para dashboards
3. **Pre-commit Hook**: Validação antes de cada commit
4. **Sentry Integration**: Captura erros de import em produção

## 📝 Checklist para Novos Componentes

- [ ] Importar ícones do `lucide-react` em bloco
- [ ] Usar ícones apropriados para o contexto financeiro
- [ ] Aplicar cores consistentes com a semântica
- [ ] Definir tamanho apropriado para o componente
- [ ] Executar `npm run validate:imports` antes do commit
- [ ] Testar build com `npm run build`

## 🚨 Problemas Comuns

### Erro: "X is not defined"
**Causa**: Ícone usado mas não importado
**Solução**: Adicionar ao import do lucide-react

### Build falha silenciosamente
**Causa**: Import inconsistente ou typo no nome do ícone
**Solução**: Executar `npm run validate:imports`

### Ícone não aparece
**Causa**: Nome incorreto ou componente não renderizado
**Solução**: Verificar nome exato no Lucide React docs

## 🔗 Recursos

- [Lucide React Icons](https://lucide.dev/icons/)
- [Tremor UI Colors](https://www.tremor.so/docs/layout/color-palette)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)