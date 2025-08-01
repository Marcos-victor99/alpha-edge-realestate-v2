# 🏢 Sistema de Análise Financeira - Shopping Centers

Sistema Python completo para análise financeira automatizada de Shopping Centers, desenvolvido especificamente para o **Shopping Park Botucatu**.

## 🎯 Visão Geral

Este sistema implementa uma solução robusta de análise financeira que processa dados reais de shopping centers e gera relatórios executivos com insights automáticos em português brasileiro. Baseado na arquitetura moderna do projeto React/TypeScript, mas desenvolvido como solução Python standalone.

## ✨ Funcionalidades Principais

### 📊 Análise de KPIs Financeiros
- **Score de Saúde Financeira** (0-100)
- Classificação automática (CRÍTICO/ATENÇÃO/BOM/EXCELENTE)
- Análise de receita total, inadimplência, saldo operacional
- Recomendações específicas por KPI

### 💰 Análise de Fluxo de Caixa
- Processamento temporal de créditos e débitos
- Identificação de meses críticos
- Análise de tendências e sazonalidade
- Projeções para próximos períodos

### ⚠️ Análise de Inadimplência
- Ranking dos maiores devedores
- Análise de concentração (Princípio de Pareto)
- Estratégias de recuperação personalizadas
- Potencial de recuperação de crédito

### 📈 Análise de Tendências Avançada
- Identificação automática de tendências temporais
- Detecção de pontos críticos e mudanças bruscas
- Análise de volatilidade e sazonalidade
- Previsões simples baseadas em tendências históricas
- Correlações temporais e autocorrelação

### 🧠 Engine de Insights Automáticos
- Insights gerados por IA com classificação de criticidade
- Correlações entre diferentes análises
- Recomendações priorizadas e acionáveis
- Score de confiança para cada insight

### 📋 Relatórios Executivos
- Formato texto estruturado em português
- Exportação JSON para integração
- Resumo executivo consolidado
- Salvamento automático com timestamp

## 🏗️ Arquitetura do Sistema

```
shopping_analysis/
├── core/                    # Modelos e configurações base
│   ├── models.py           # Modelos Pydantic para validação
│   ├── enums.py            # Enumerações para classificações
│   └── exceptions.py       # Exceções customizadas
├── formatters/             # Formatação brasileira
│   └── brazilian.py        # R$, datas dd/mm/yyyy, %
├── analyzers/              # Analisadores especializados
│   ├── kpi_analyzer.py     # Análise de KPIs financeiros
│   ├── cashflow_analyzer.py # Análise de fluxo de caixa
│   ├── delinquency_analyzer.py # Análise de inadimplência
│   └── trend_analyzer.py   # Análise de tendências temporais
├── insights/               # Engine de insights automáticos
│   └── insight_engine.py   # Geração de insights com IA
├── reports/                # Geração de relatórios
│   └── report_generator.py # Relatórios executivos
└── main.py                 # Script principal
```

## 🚀 Como Usar

### Pré-requisitos
```bash
# Instalar Python 3.8+
pip3 install pydantic>=2.0.0
```

### Execução Rápida
```bash
# Teste básico do sistema
python3 test_shopping_analysis.py

# Análise completa com dados reais
python3 run_shopping_analysis.py --verbose

# Salvar relatório em arquivo
python3 run_shopping_analysis.py --formato texto --salvar

# Exportar em JSON
python3 run_shopping_analysis.py --formato json --salvar
```

### Opções Disponíveis
- `--verbose`: Informações detalhadas durante execução
- `--formato texto|json`: Formato do relatório final
- `--salvar`: Salvar relatório em arquivo com timestamp

## 📈 Dados Processados (Shopping Park Botucatu)

### KPIs Analisados
- **Receita Total**: R$ 18.860.754,22
- **Taxa de Inadimplência**: 91,40% ⚠️ CRÍTICO
- **Recebidos em Atraso**: 233,92% ⚠️ CRÍTICO  
- **Saldo Operacional**: R$ 2.856.273,89 ✅
- **Despesa Total**: R$ 16.004.480,33

### Fluxo de Caixa (Mai-Dez 2025)
- **8 meses** de dados processados
- **Saldo Consolidado**: R$ 1.773.168,86
- **Meses Críticos**: Maio (-R$ 1.4M) e Outubro (-R$ 24K)
- **Melhor Performance**: Dezembro (R$ 2.6M)

### Inadimplentes Principais
- **Patroni Pizza**: R$ 58.980,00 (54,6% do total)
- **Claus Sport**: R$ 35.000,00 
- **Aline Sobrino Boutique**: R$ 11.666,67
- **Ivone Store**: R$ 2.432,91

## 🎯 Resultados da Análise

### Score Final: **44.2/100** 🟡 ATENÇÃO
**Status**: Monitoramento próximo requerido

### Insights Críticos Detectados
1. **Mês Crítico**: Maio/2025 com saldo negativo de R$ 1.4M
2. **Correlação**: Inadimplência alta impactando fluxo de caixa
3. **Concentração**: Top 3 inadimplentes = 97,7% do total
4. **Risco Dominante**: Patroni Pizza representa 54,6% das dívidas
5. **Tendência Positiva**: Crescimento geral detectado com alta volatilidade
6. **Análise Temporal**: 8 períodos analisados com padrões identificados

### Recomendações Prioritárias
1. Investigação urgente dos problemas de Maio/2025
2. Negociação prioritária com Patroni Pizza
3. Implementação de controles preventivos
4. Estratégias personalizadas para top 3 devedores

## 🛠️ Tecnologias Utilizadas

- **Python 3.8+**: Linguagem base
- **Pydantic 2.0+**: Validação robusta de dados
- **Arquitetura Modular**: Separação clara de responsabilidades
- **Formatação Brasileira**: Locale pt-BR nativo
- **Análise Estatística**: Bibliotecas Python padrão
- **Insights com IA**: Engine inspirada no framework AVA

## 🔧 Extensibilidade

O sistema foi projetado para fácil extensão:

### Novos Analisadores
```python
class NovoAnalyzer(BaseAnalyzer):
    def analisar(self, dados):
        # Implementar nova análise
        return resultado
```

### Formatos de Saída
- Texto estruturado ✅
- JSON ✅
- PDF (futuro)
- Excel (futuro)

### Integração com APIs
- Supabase (preparado)
- APIs REST (extensível)
- WebHooks (futuro)

## 📊 Exemplo de Saída

```
================================================================================
📊 RELATÓRIO EXECUTIVO FINANCEIRO - SHOPPING PARK BOTUCATU
================================================================================
Shopping Center: Shopping Park Botucatu
Período de Referência: Maio/2025 - Dezembro/2025
Score de Saúde Financeira: 44,2%

🎯 RESUMO EXECUTIVO
Situação Geral: Preocupante - Necessita monitoramento próximo

🚨 PRINCIPAIS DESAFIOS:
   1. KPIs financeiros em estado crítico
   2. Meses com saldo operacional negativo
   3. Alta concentração de inadimplência

🧠 INSIGHTS CRÍTICOS
1. Mês Crítico Identificado: Maio/2025
   Impacto Estimado: R$ 1.4M
   Ação Principal: Investigar causas específicas

2. Inadimplente Dominante: Patroni Pizza (54,6%)
   Impacto Estimado: R$ 59.0K
   Ação Principal: Negociação prioritária
```

## 🎮 Demonstração

Execute o sistema agora mesmo:

```bash
# Clone e teste
git clone [repository]
cd shopping_analysis
python3 ../run_shopping_analysis.py --verbose
```

## 📝 Licença

Sistema desenvolvido para demonstração de capacidades de análise financeira automatizada.

---

**🤖 Powered by Python + IA Insights**  
*Sistema completo de análise financeira para shopping centers*