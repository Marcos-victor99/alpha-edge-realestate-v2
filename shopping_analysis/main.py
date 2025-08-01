#!/usr/bin/env python3
"""
Script Principal - Sistema de Análise Financeira Shopping Park Botucatu
Executa análise completa com dados reais fornecidos pelo usuário.

Uso:
    python main.py [--formato texto|json] [--salvar] [--verbose]

Exemplo:
    python main.py --formato texto --salvar --verbose
"""
import argparse
import sys
from decimal import Decimal
from typing import Dict, Any

# Imports dos módulos do sistema
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from analyzers.kpi_analyzer import KPIAnalyzer
from analyzers.cashflow_analyzer import CashFlowAnalyzer
from analyzers.delinquency_analyzer import DelinquencyAnalyzer
from insights.insight_engine import InsightEngine
from reports.report_generator import ReportGenerator
from core.models import ConfiguracaoAnalise


def obter_dados_shopping_park_botucatu() -> Dict[str, Any]:
    """
    Retorna os dados reais do Shopping Park Botucatu fornecidos pelo usuário.
    """
    dados = {
        'shopping_center': 'Shopping Park Botucatu',
        'periodo_referencia': 'Maio - Dezembro 2025',
        
        # KPIs Principais conforme fornecido
        'kpis': {
            'receita_total': 18860754.22,
            'taxa_inadimplencia': 91.40,
            'recebidos_atraso': 233.92,
            'saldo_projetado_final': 4140012.46,
            'despesa_total': 16004480.33,
            'saldo_operacional': 2856273.89
        },
        
        # Fluxo de Caixa Mensal (Mai-Dez 2025) conforme fornecido
        'fluxo_caixa': [
            {
                'mes': 'Maio',
                'ano': 2025,
                'credito': 288428.84,
                'debito': 1676454.88,
                'saldo_operacional': -1388026.04
            },
            {
                'mes': 'Junho',
                'ano': 2025,
                'credito': 1606136.68,
                'debito': 1414427.56,
                'saldo_operacional': 191709.12
            },
            {
                'mes': 'Julho',
                'ano': 2025,
                'credito': 1695919.31,
                'debito': 1586876.16,
                'saldo_operacional': 109043.15
            },
            {
                'mes': 'Agosto',
                'ano': 2025,
                'credito': 1662847.77,
                'debito': 1590080.64,
                'saldo_operacional': 72767.13
            },
            {
                'mes': 'Setembro',
                'ano': 2025,
                'credito': 1534454.15,
                'debito': 1490250.60,
                'saldo_operacional': 44203.55
            },
            {
                'mes': 'Outubro',
                'ano': 2025,
                'credito': 1445980.01,
                'debito': 1470783.04,
                'saldo_operacional': -24803.03
            },
            {
                'mes': 'Novembro',
                'ano': 2025,
                'credito': 1477342.79,
                'debito': 1281994.13,
                'saldo_operacional': 195348.66
            },
            {
                'mes': 'Dezembro',
                'ano': 2025,
                'credito': 3862335.00,
                'debito': 1289408.68,
                'saldo_operacional': 2572926.32
            }
        ],
        
        # Maiores Inadimplentes conforme fornecido
        'inadimplentes': [
            {
                'nome': 'Patroni Pizza',
                'valor_divida': 58980.00,
                'status': 'confissao_divida',
                'dias_atraso': 75,
                'categoria': 'Alimentação',
                'observacoes': 'Confissão de Dívida assinada'
            },
            {
                'nome': 'Claus Sport',
                'valor_divida': 35000.00,
                'status': 'confissao_divida',
                'dias_atraso': 60,
                'categoria': 'Vestuário Esportivo',
                'observacoes': 'Confissão de Dívida assinada'
            },
            {
                'nome': 'Aline Sobrino Boutique',
                'valor_divida': 11666.67,
                'status': 'confissao_divida',
                'dias_atraso': 45,
                'categoria': 'Moda Feminina',
                'observacoes': 'Confissão de Dívida assinada'
            },
            {
                'nome': 'Ivone Store',
                'valor_divida': 2432.91,
                'status': 'confissao_divida',
                'dias_atraso': 30,
                'categoria': 'Variedades',
                'observacoes': 'Confissão de Dívida assinada'
            }
        ]
    }
    
    return dados


def executar_analise_completa(dados: Dict[str, Any], verbose: bool = False) -> Dict[str, Any]:
    """
    Executa análise financeira completa usando todos os analisadores.
    
    Args:
        dados: Dados do shopping center
        verbose: Se True, exibe informações detalhadas durante a execução
        
    Returns:
        Dict com resultados de todas as análises
    """
    resultados = {}
    
    try:
        if verbose:
            print("🚀 Iniciando análise financeira completa...")
            print(f"📊 Shopping: {dados['shopping_center']}")
            print(f"📅 Período: {dados['periodo_referencia']}")
            print()
        
        # 1. Análise de KPIs
        if verbose:
            print("📈 Analisando KPIs financeiros...")
        
        kpi_analyzer = KPIAnalyzer()
        analise_kpis = kpi_analyzer.analisar(dados['kpis'])
        resultados['analise_kpis'] = analise_kpis
        
        if verbose:
            score_saude = analise_kpis['score_saude_financeira']
            kpis_criticos = len(analise_kpis['kpis_criticos'])
            print(f"   ✅ Score de saúde: {score_saude}/100")
            print(f"   ⚠️  KPIs críticos: {kpis_criticos}")
            print()
        
        # 2. Análise de Fluxo de Caixa
        if verbose:
            print("💰 Analisando fluxo de caixa...")
        
        cashflow_analyzer = CashFlowAnalyzer()
        analise_cashflow = cashflow_analyzer.analisar(dados['fluxo_caixa'])
        resultados['analise_cashflow'] = analise_cashflow
        
        if verbose:
            resumo = analise_cashflow['resumo_mensal']
            meses_criticos = len(analise_cashflow['meses_criticos'])
            print(f"   💵 Saldo consolidado: R$ {resumo['saldo_consolidado']:,.2f}")
            print(f"   🚨 Meses críticos: {meses_criticos}")
            print()
        
        # 3. Análise de Inadimplência
        if verbose:
            print("⚠️  Analisando inadimplência...")
        
        delinquency_analyzer = DelinquencyAnalyzer()
        receita_total = Decimal(str(dados['kpis']['receita_total']))
        analise_inadimplencia = delinquency_analyzer.analisar(dados['inadimplentes'], receita_total)
        resultados['analise_inadimplencia'] = analise_inadimplencia
        
        if verbose:
            total_dividas = analise_inadimplencia['metricas_gerais']['valor_total_inadimplencia']
            maior_devedor = analise_inadimplencia['ranking_por_valor'][0]
            print(f"   💸 Total em dívidas: R$ {total_dividas:,.2f}")
            print(f"   🎯 Maior devedor: {maior_devedor['nome']} (R$ {maior_devedor['valor_divida']:,.2f})")
            print()
        
        # 4. Geração de Insights
        if verbose:
            print("🧠 Gerando insights automáticos...")
        
        insight_engine = InsightEngine()
        insights = insight_engine.gerar_insights_completos(resultados)
        resultados['insights'] = insights
        
        if verbose:
            insights_criticos = len([i for i in insights if i.prioridade.value == 'CRÍTICA'])
            print(f"   💡 Total de insights: {len(insights)}")
            print(f"   🔴 Insights críticos: {insights_criticos}")
            print()
        
        if verbose:
            print("✅ Análise completa finalizada!")
            print()
        
        return resultados
        
    except Exception as e:
        print(f"❌ Erro durante a análise: {str(e)}")
        raise


def main():
    """Função principal do script"""
    # Configurar argumentos da linha de comando
    parser = argparse.ArgumentParser(
        description='Sistema de Análise Financeira - Shopping Park Botucatu',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  python main.py                           # Análise básica
  python main.py --verbose                 # Com informações detalhadas
  python main.py --formato json --salvar  # Salvar em JSON
  python main.py --formato texto --salvar # Salvar em texto
        """
    )
    
    parser.add_argument(
        '--formato',
        choices=['texto', 'json'],
        default='texto',
        help='Formato do relatório final (padrão: texto)'
    )
    
    parser.add_argument(
        '--salvar',
        action='store_true',
        help='Salvar relatório em arquivo'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Exibir informações detalhadas durante a execução'
    )
    
    args = parser.parse_args()
    
    try:
        # Banner inicial
        print("=" * 80)
        print("📊 SISTEMA DE ANÁLISE FINANCEIRA - SHOPPING PARK BOTUCATU")
        print("=" * 80)
        print("🏢 Análise Automática de Performance Financeira")
        print("🤖 Powered by Python + IA Insights")
        print()
        
        # Obter dados do shopping
        dados = obter_dados_shopping_park_botucatu()
        
        # Executar análise completa
        resultados = executar_analise_completa(dados, verbose=args.verbose)
        
        # Gerar relatório final
        if args.verbose:
            print("📋 Gerando relatório executivo...")
        
        report_generator = ReportGenerator()
        relatorio_completo = report_generator.gerar_relatorio_completo(
            resultados, 
            dados['shopping_center']
        )
        
        # Exibir relatório
        relatorio_texto = report_generator.gerar_relatorio_texto(relatorio_completo)
        print(relatorio_texto)
        
        # Salvar arquivo se solicitado
        if args.salvar:
            caminho_arquivo = report_generator.salvar_relatorio(
                relatorio_completo, 
                formato=args.formato
            )
            print(f"\n💾 Relatório salvo em: {caminho_arquivo}")
        
        # Estatísticas finais
        print("\n" + "=" * 50)
        print("📈 ESTATÍSTICAS DA ANÁLISE")
        print("=" * 50)
        print(f"KPIs analisados: {len(resultados['analise_kpis']['kpis_analisados'])}")
        print(f"Meses de fluxo de caixa: {len(resultados['analise_cashflow']['movimentacoes_analisadas'])}")
        print(f"Inadimplentes analisados: {len(resultados['analise_inadimplencia']['inadimplentes_analisados'])}")
        print(f"Insights gerados: {len(resultados['insights'])}")
        
        # Score final
        score_final = relatorio_completo.score_saude_financeira
        if score_final:
            print(f"\n🎯 SCORE FINAL DE SAÚDE FINANCEIRA: {score_final}/100")
            
            if score_final < 30:
                print("🔴 STATUS: CRÍTICO - Intervenção imediata necessária")
            elif score_final < 60:
                print("🟡 STATUS: ATENÇÃO - Monitoramento próximo requerido") 
            elif score_final < 80:
                print("🟢 STATUS: BOM - Algumas melhorias recomendadas")
            else:
                print("🌟 STATUS: EXCELENTE - Performance superior")
        
        print("\n✅ Análise concluída com sucesso!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Análise interrompida pelo usuário.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro crítico: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()