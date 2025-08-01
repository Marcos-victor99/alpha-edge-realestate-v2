#!/usr/bin/env python3
"""
Script de Teste - Sistema de Análise Financeira Shopping Park Botucatu
Executa teste básico para validar funcionamento do sistema.
"""
import sys
import os
from decimal import Decimal

# Adicionar o diretório do projeto ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'shopping_analysis'))

# Agora importar os módulos
try:
    from shopping_analysis.analyzers.kpi_analyzer import KPIAnalyzer
    from shopping_analysis.analyzers.cashflow_analyzer import CashFlowAnalyzer
    from shopping_analysis.analyzers.delinquency_analyzer import DelinquencyAnalyzer
    from shopping_analysis.analyzers.trend_analyzer import TrendAnalyzer
    from shopping_analysis.insights.insight_engine import InsightEngine
    from shopping_analysis.reports.report_generator import ReportGenerator
    print("✅ Todos os módulos importados com sucesso!")
except ImportError as e:
    print(f"❌ Erro de import: {e}")
    sys.exit(1)

def teste_dados_basicos():
    """Testa processamento com dados básicos"""
    print("\n🧪 Testando com dados básicos...")
    
    # Dados de teste simplificados
    kpis_teste = {
        'receita_total': 1000000,
        'taxa_inadimplencia': 15.5,
        'saldo_operacional': 150000
    }
    
    # Teste KPI Analyzer
    try:
        kpi_analyzer = KPIAnalyzer()
        resultado_kpis = kpi_analyzer.analisar(kpis_teste)
        print(f"✅ KPI Analyzer: {len(resultado_kpis['kpis_analisados'])} KPIs analisados")
        print(f"   Score de saúde: {resultado_kpis['score_saude_financeira']}/100")
    except Exception as e:
        print(f"❌ Erro no KPI Analyzer: {e}")
        return False
    
    # Teste CashFlow Analyzer  
    fluxo_teste = [
        {'mes': 'Janeiro', 'ano': 2025, 'credito': 100000, 'debito': 80000, 'saldo_operacional': 20000},
        {'mes': 'Fevereiro', 'ano': 2025, 'credito': 110000, 'debito': 85000, 'saldo_operacional': 25000},
        {'mes': 'Março', 'ano': 2025, 'credito': 105000, 'debito': 90000, 'saldo_operacional': 15000},
        {'mes': 'Abril', 'ano': 2025, 'credito': 120000, 'debito': 88000, 'saldo_operacional': 32000}
    ]
    
    try:
        cashflow_analyzer = CashFlowAnalyzer()
        resultado_cashflow = cashflow_analyzer.analisar(fluxo_teste)
        print(f"✅ CashFlow Analyzer: {len(resultado_cashflow['movimentacoes_analisadas'])} meses analisados")
        print(f"   Meses críticos: {len(resultado_cashflow['meses_criticos'])}")
    except Exception as e:
        print(f"❌ Erro no CashFlow Analyzer: {e}")
        return False
    
    # Teste Delinquency Analyzer
    inadimplentes_teste = [
        {'nome': 'Teste A', 'valor_divida': 5000, 'status': 'em_atraso'},
        {'nome': 'Teste B', 'valor_divida': 3000, 'status': 'negociacao'}
    ]
    
    try:
        delinquency_analyzer = DelinquencyAnalyzer()
        resultado_inadimplencia = delinquency_analyzer.analisar(inadimplentes_teste, Decimal('1000000'))
        print(f"✅ Delinquency Analyzer: {len(resultado_inadimplencia['inadimplentes_analisados'])} inadimplentes analisados")
        print(f"   Total em dívidas: R$ {resultado_inadimplencia['metricas_gerais']['valor_total_inadimplencia']:,.2f}")
    except Exception as e:
        print(f"❌ Erro no Delinquency Analyzer: {e}")
        return False
    
    # Teste Trend Analyzer
    try:
        trend_analyzer = TrendAnalyzer()
        resultado_tendencias = trend_analyzer.analisar(fluxo_teste, 'fluxo_caixa')
        print(f"✅ Trend Analyzer: {resultado_tendencias['periodos_analisados']} períodos analisados")
        print(f"   Tendência: {resultado_tendencias['tendencia_geral']['direcao'].value}")
        print(f"   Volatilidade: {resultado_tendencias['volatilidade']['classificacao']}")
    except Exception as e:
        print(f"❌ Erro no Trend Analyzer: {e}")
        return False
    
    # Teste Insight Engine
    try:
        dados_analise = {
            'analise_kpis': resultado_kpis,
            'analise_cashflow': resultado_cashflow,
            'analise_inadimplencia': resultado_inadimplencia,
            'analise_tendencias': resultado_tendencias
        }
        
        insight_engine = InsightEngine()
        insights = insight_engine.gerar_insights_completos(dados_analise)
        print(f"✅ Insight Engine: {len(insights)} insights gerados")
        
        insights_criticos = [i for i in insights if i.prioridade.value == 'CRÍTICA']
        print(f"   Insights críticos: {len(insights_criticos)}")
    except Exception as e:
        print(f"❌ Erro no Insight Engine: {e}")
        return False
    
    # Teste Report Generator
    try:
        dados_analise['insights'] = insights
        
        report_generator = ReportGenerator()
        relatorio = report_generator.gerar_relatorio_completo(dados_analise, "Shopping Teste")
        
        print(f"✅ Report Generator: Relatório gerado para {relatorio.shopping_center}")
        print(f"   KPIs: {len(relatorio.kpis_principais)}")
        print(f"   Insights críticos: {len(relatorio.insights_criticos)}")
        print(f"   Score final: {relatorio.score_saude_financeira}")
    except Exception as e:
        print(f"❌ Erro no Report Generator: {e}")
        return False
    
    return True

def main():
    """Função principal do teste"""
    print("=" * 60)
    print("🧪 TESTE DO SISTEMA DE ANÁLISE FINANCEIRA")
    print("=" * 60)
    
    # Teste básico
    if teste_dados_basicos():
        print("\n🎉 TESTE CONCLUÍDO COM SUCESSO!")
        print("✅ Todos os componentes estão funcionando corretamente")
        print("\n📋 Sistema pronto para uso com dados reais:")
        print("   • Execute: cd shopping_analysis && python3 main.py --verbose")
        print("   • Ou use: python3 shopping_analysis/main.py --help")
    else:
        print("\n❌ TESTE FALHOU!")
        print("Verifique os erros acima e corrija antes de usar o sistema.")
        sys.exit(1)

if __name__ == "__main__":
    main()