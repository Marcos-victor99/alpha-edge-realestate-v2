"""
Engine de Insights Automáticos para Shopping Centers.
Inspirado no framework AVA (Automated Visual Analytics) do projeto React/TypeScript.
"""
from decimal import Decimal
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime

from ..core.models import (
    InsightFinanceiro, KPIFinanceiro, MovimentacaoFinanceira, 
    Inadimplente, ConfiguracaoAnalise
)
from ..core.enums import InsightType, InsightPriority, StatusKPI, RiskLevel
from ..core.exceptions import InsightGenerationError
from ..formatters.brazilian import BrazilianFormatter


class InsightEngine:
    """Engine principal para geração automática de insights financeiros"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        self.configuracao = configuracao or ConfiguracaoAnalise()
        self.formatter = BrazilianFormatter()
        self.insights_gerados = []
    
    def gerar_insights_completos(self, dados_analise: Dict[str, Any]) -> List[InsightFinanceiro]:
        """
        Gera insights completos baseados em todas as análises.
        
        Args:
            dados_analise: Dict com resultados de todas as análises
            
        Returns:
            Lista de insights priorizados por criticidade
        """
        try:
            self.insights_gerados.clear()
            
            # Gerar insights por tipo de análise
            if 'analise_kpis' in dados_analise:
                self._gerar_insights_kpis(dados_analise['analise_kpis'])
            
            if 'analise_cashflow' in dados_analise:
                self._gerar_insights_cashflow(dados_analise['analise_cashflow'])
            
            if 'analise_inadimplencia' in dados_analise:
                self._gerar_insights_inadimplencia(dados_analise['analise_inadimplencia'])
            
            # Gerar insights cruzados (correlações entre análises)
            if len(dados_analise) > 1:
                self._gerar_insights_cruzados(dados_analise)
            
            # Priorizar e classificar insights
            insights_priorizados = self._priorizar_insights(self.insights_gerados)
            
            # Aplicar score de confiança
            for insight in insights_priorizados:
                insight.score_confianca = self._calcular_score_confianca(insight, dados_analise)
            
            return insights_priorizados
            
        except Exception as e:
            raise InsightGenerationError("insights_completos", "dados_gerais", str(e)) from e
    
    def _gerar_insights_kpis(self, analise_kpis: Dict[str, Any]) -> None:
        """Gera insights baseados na análise de KPIs"""
        try:
            kpis_criticos = analise_kpis.get('kpis_criticos', [])
            score_saude = analise_kpis.get('score_saude_financeira', 0)
            
            # Insight de saúde financeira geral
            if score_saude < 30:
                self.insights_gerados.append(InsightFinanceiro(
                    tipo=InsightType.KPI,
                    titulo="Situação Financeira Crítica Detectada",
                    descricao=f"Score de saúde financeira muito baixo ({score_saude}/100). "
                              f"Múltiplos KPIs em estado crítico requerem ação imediata.",
                    prioridade=InsightPriority.CRITICA,
                    valor_impacto=Decimal(str(score_saude * 1000)),  # Impacto proporcional
                    recomendacoes=[
                        "Implementar plano de contingência financeira imediato",
                        "Revisar todas as despesas operacionais",
                        "Acelerar estratégias de aumento de receita",
                        "Considerar medidas de reestruturação temporária"
                    ],
                    metricas_relacionadas={
                        "score_saude": float(score_saude),
                        "kpis_criticos": len(kpis_criticos),
                        "total_kpis": analise_kpis.get('total_kpis', 0)
                    }
                ))
            
            # Insights específicos para KPIs críticos
            for kpi in kpis_criticos:
                if 'inadimplência' in kpi.nome.lower():
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.KPI,
                        titulo=f"Taxa de Inadimplência Crítica: {self.formatter.formatar_porcentagem(kpi.valor)}",
                        descricao=f"A taxa de inadimplência de {self.formatter.formatar_porcentagem(kpi.valor)} "
                                  f"está muito acima do aceitável, comprometendo severamente o fluxo de caixa.",
                        prioridade=InsightPriority.CRITICA,
                        valor_impacto=kpi.valor * 100000,  # Impacto estimado em R$
                        recomendacoes=[
                            "Implementar processo urgente de recuperação de crédito",
                            "Revisar política de concessão de crédito",
                            "Estabelecer acordos com maiores devedores",
                            "Considerar terceirização da cobrança para casos complexos"
                        ],
                        metricas_relacionadas={
                            "taxa_inadimplencia": float(kpi.valor),
                            "status": kpi.status.value
                        }
                    ))
                
                elif 'receita' in kpi.nome.lower():
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.KPI,
                        titulo=f"Receita Abaixo do Esperado: {self.formatter.formatar_moeda(kpi.valor, compacto=True)}",
                        descricao=f"A receita atual está {kpi.observacoes.lower() if kpi.observacoes else 'abaixo das expectativas'}, "
                                  f"indicando necessidade de revisão da estratégia comercial.",
                        prioridade=InsightPriority.ALTA,
                        valor_impacto=kpi.valor,
                        recomendacoes=[
                            "Intensificar campanhas de marketing e promoções",
                            "Revisar mix de lojas e ocupação",
                            "Implementar estratégias de fidelização de clientes",
                            "Analisar performance por categoria de loja"
                        ],
                        metricas_relacionadas={
                            "receita_atual": float(kpi.valor),
                            "status": kpi.status.value
                        }
                    ))
            
        except Exception as e:
            raise InsightGenerationError("insights_kpis", "analise_kpis", str(e)) from e
    
    def _gerar_insights_cashflow(self, analise_cashflow: Dict[str, Any]) -> None:
        """Gera insights baseados na análise de fluxo de caixa"""
        try:
            meses_criticos = analise_cashflow.get('meses_criticos', [])
            tendencias = analise_cashflow.get('tendencias', [])
            resumo = analise_cashflow.get('resumo_mensal', {})
            
            # Insight sobre meses críticos
            if meses_criticos:
                pior_mes = meses_criticos[0]  # Já ordenado por score de risco
                self.insights_gerados.append(InsightFinanceiro(
                    tipo=InsightType.FLUXO_CAIXA,
                    titulo=f"Mês Crítico Identificado: {pior_mes['periodo']}",
                    descricao=f"O mês de {pior_mes['periodo']} apresentou saldo operacional de "
                              f"{self.formatter.formatar_moeda(pior_mes['saldo_operacional'], compacto=True)}, "
                              f"com múltiplos problemas identificados.",
                    prioridade=InsightPriority.CRITICA if pior_mes['score_risco'] >= 70 else InsightPriority.ALTA,
                    valor_impacto=abs(pior_mes['saldo_operacional']),
                    recomendacoes=[
                        f"Investigar causas específicas dos problemas em {pior_mes['periodo']}",
                        "Implementar controles preventivos para evitar recorrência",
                        "Ajustar planejamento para períodos similares no futuro",
                        "Revisar sazonalidade e padrões de despesas"
                    ],
                    metricas_relacionadas={
                        "periodo": pior_mes['periodo'],
                        "saldo_operacional": float(pior_mes['saldo_operacional']),
                        "score_risco": pior_mes['score_risco'],
                        "problemas": pior_mes['problemas_identificados']
                    }
                ))
            
            # Insights sobre tendências
            for tendencia in tendencias:
                if tendencia.direcao.value == "DECLÍNIO" and tendencia.intensidade > 40:
                    if "Saldo" in tendencia.metrica:
                        self.insights_gerados.append(InsightFinanceiro(
                            tipo=InsightType.TENDENCIA,
                            titulo=f"Tendência de Declínio no {tendencia.metrica}",
                            descricao=f"Identificada tendência de declínio de {self.formatter.formatar_porcentagem(tendencia.intensidade)} "
                                      f"no {tendencia.metrica} ao longo do período analisado.",
                            prioridade=InsightPriority.ALTA,
                            valor_impacto=tendencia.intensidade * 10000,
                            recomendacoes=[
                                "Implementar ações corretivas imediatas",
                                "Revisar estrutura de custos e receitas",
                                "Estabelecer metas de reversão da tendência",
                                "Monitorar indicadores semanalmente"
                            ],
                            metricas_relacionadas={
                                "metrica": tendencia.metrica,
                                "direcao": tendencia.direcao.value,
                                "intensidade": float(tendencia.intensidade),
                                "confiabilidade": float(tendencia.confiabilidade)
                            }
                        ))
            
            # Insight sobre volatilidade
            if resumo.get('volatilidade', 0) > 500000:  # Alta volatilidade
                self.insights_gerados.append(InsightFinanceiro(
                    tipo=InsightType.FLUXO_CAIXA,
                    titulo="Alta Volatilidade no Fluxo de Caixa Detectada",
                    descricao=f"Volatilidade de {self.formatter.formatar_moeda(resumo['volatilidade'], compacto=True)} "
                              f"indica instabilidade operacional que dificulta o planejamento financeiro.",
                    prioridade=InsightPriority.MEDIA,
                    valor_impacto=resumo['volatilidade'],
                    recomendacoes=[
                        "Implementar controles para reduzir flutuações",
                        "Diversificar fontes de receita",
                        "Estabelecer reservas para períodos de baixa performance",
                        "Revisar contratos e políticas de pagamento"
                    ],
                    metricas_relacionadas={
                        "volatilidade": float(resumo['volatilidade']),
                        "media_saldo": float(resumo.get('media_saldo_mensal', 0))
                    }
                ))
                
        except Exception as e:
            raise InsightGenerationError("insights_cashflow", "analise_cashflow", str(e)) from e
    
    def _gerar_insights_inadimplencia(self, analise_inadimplencia: Dict[str, Any]) -> None:
        """Gera insights baseados na análise de inadimplência"""
        try:
            ranking = analise_inadimplencia.get('ranking_por_valor', [])
            concentracao = analise_inadimplencia.get('concentracao_dividas', {})
            recuperacao = analise_inadimplencia.get('impacto_financeiro', {}).get('potencial_recuperacao', {})
            
            # Insight sobre concentração (Princípio de Pareto)
            concentracao_top3 = concentracao.get('concentracao_top3', 0)
            if concentracao_top3 > 60:  # Top 3 representam mais de 60%
                self.insights_gerados.append(InsightFinanceiro(
                    tipo=InsightType.INADIMPLENCIA,
                    titulo=f"Alta Concentração de Inadimplência: Top 3 = {self.formatter.formatar_porcentagem(concentracao_top3)}",
                    descricao=f"Os 3 maiores inadimplentes concentram {self.formatter.formatar_porcentagem(concentracao_top3)} "
                              f"do total das dívidas, indicando risco concentrado que requer atenção específica.",
                    prioridade=InsightPriority.CRITICA,
                    valor_impacto=concentracao.get('valor_top_3', Decimal('0')),
                    recomendacoes=[
                        "Foco prioritário na negociação com os 3 maiores devedores",
                        "Estratégias personalizadas para cada caso crítico",
                        "Avaliação jurídica para execução se necessário",
                        "Diversificar base de clientes para reduzir concentração futura"
                    ],
                    metricas_relacionadas={
                        "concentracao_top3": float(concentracao_top3),
                        "valor_top3": float(concentracao.get('valor_top_3', 0)),
                        "maiores_inadimplentes": [r['nome'] for r in ranking[:3]]
                    }
                ))
            
            # Insight sobre potencial de recuperação
            if recuperacao:
                taxa_conservadora = recuperacao.get('taxa_recuperacao_conservadora', 0)
                if taxa_conservadora < 50:
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.INADIMPLENCIA,
                        titulo=f"Baixo Potencial de Recuperação: {self.formatter.formatar_porcentagem(taxa_conservadora)}",
                        descricao=f"A taxa estimada de recuperação conservadora de {self.formatter.formatar_porcentagem(taxa_conservadora)} "
                                  f"indica necessidade de revisão urgente da estratégia de cobrança.",
                        prioridade=InsightPriority.ALTA,
                        valor_impacto=recuperacao.get('valor_irrecuperavel_estimado', Decimal('0')),
                        recomendacoes=[
                            "Revisar e otimizar processo de cobrança",
                            "Implementar acordos mais atrativos para os devedores",
                            "Considerar desconto para pagamento à vista",
                            "Avaliar terceirização da cobrança para casos complexos"
                        ],
                        metricas_relacionadas={
                            "taxa_recuperacao_conservadora": float(taxa_conservadora),
                            "valor_irrecuperavel": float(recuperacao.get('valor_irrecuperavel_estimado', 0))
                        }
                    ))
            
            # Insight sobre maior inadimplente individual
            if ranking:
                maior_inadimplente = ranking[0]
                participacao = maior_inadimplente['participacao_percentual']
                if participacao > 30:  # Mais de 30% do total
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.INADIMPLENCIA,
                        titulo=f"Inadimplente Dominante: {maior_inadimplente['nome']} ({self.formatter.formatar_porcentagem(participacao)})",
                        descricao=f"{maior_inadimplente['nome']} representa {self.formatter.formatar_porcentagem(participacao)} "
                                  f"de toda a inadimplência, criando risco operacional significativo.",
                        prioridade=InsightPriority.CRITICA,
                        valor_impacto=maior_inadimplente['valor_divida'],
                        recomendacoes=[
                            f"Negociação prioritária e personalizada com {maior_inadimplente['nome']}",
                            "Análise detalhada da situação financeira do devedor",
                            "Proposta de acordo estruturado com garantias",
                            "Avaliação jurídica para proteção dos interesses"
                        ],
                        metricas_relacionadas={
                            "nome_devedor": maior_inadimplente['nome'],
                            "valor_divida": float(maior_inadimplente['valor_divida']),
                            "participacao": float(participacao),
                            "status": maior_inadimplente['status'].value
                        }
                    ))
                    
        except Exception as e:
            raise InsightGenerationError("insights_inadimplencia", "analise_inadimplencia", str(e)) from e
    
    def _gerar_insights_cruzados(self, dados_analise: Dict[str, Any]) -> None:
        """Gera insights baseados em correlações entre diferentes análises"""
        try:
            # Correlação entre inadimplência e fluxo de caixa
            if 'analise_inadimplencia' in dados_analise and 'analise_cashflow' in dados_analise:
                inadimplencia = dados_analise['analise_inadimplencia']
                cashflow = dados_analise['analise_cashflow']
                
                valor_inadimplencia = inadimplencia.get('metricas_gerais', {}).get('valor_total_inadimplencia', 0)
                meses_negativos = cashflow.get('resumo_mensal', {}).get('meses_negativos', 0)
                
                if valor_inadimplencia > 100000 and meses_negativos > 1:
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.OPERACIONAL,
                        titulo="Correlação Crítica: Inadimplência vs Fluxo de Caixa",
                        descricao=f"Alta inadimplência ({self.formatter.formatar_moeda(valor_inadimplencia, compacto=True)}) "
                                  f"correlacionada com {meses_negativos} meses de saldo negativo indica impacto direto no fluxo operacional.",
                        prioridade=InsightPriority.CRITICA,
                        valor_impacto=valor_inadimplencia,
                        recomendacoes=[
                            "Priorizar recuperação de crédito para melhorar fluxo de caixa",
                            "Implementar política de crédito mais restritiva",
                            "Estabelecer reserva de contingência para períodos críticos",
                            "Monitorar correlação mensalmente"
                        ],
                        metricas_relacionadas={
                            "valor_inadimplencia": float(valor_inadimplencia),
                            "meses_negativos": meses_negativos,
                            "correlacao_detectada": True
                        }
                    ))
            
            # Correlação entre KPIs e performance geral
            if 'analise_kpis' in dados_analise and 'analise_cashflow' in dados_analise:
                score_saude = dados_analise['analise_kpis'].get('score_saude_financeira', 0)
                saldo_consolidado = dados_analise['analise_cashflow'].get('resumo_mensal', {}).get('saldo_consolidado', 0)
                
                if score_saude < 40 and saldo_consolidado < 1000000:
                    self.insights_gerados.append(InsightFinanceiro(
                        tipo=InsightType.OPERACIONAL,
                        titulo="Situação Operacional Comprometida",
                        descricao=f"Score de saúde baixo ({score_saude}/100) combinado com saldo consolidado reduzido "
                                  f"({self.formatter.formatar_moeda(saldo_consolidado, compacto=True)}) indica necessidade de intervenção estrutural.",
                        prioridade=InsightPriority.CRITICA,
                        valor_impacto=Decimal(str(abs(saldo_consolidado - 2000000))),  # Gap para nível saudável
                        recomendacoes=[
                            "Implementar plano de recuperação operacional",
                            "Revisar todos os processos de receita e despesa",
                            "Estabelecer metas de melhoria escalonadas",
                            "Considerar consultoria especializada"
                        ],
                        metricas_relacionadas={
                            "score_saude": float(score_saude),
                            "saldo_consolidado": float(saldo_consolidado),
                            "gap_saudavel": 2000000
                        }
                    ))
                    
        except Exception as e:
            raise InsightGenerationError("insights_cruzados", "multiplas_analises", str(e)) from e
    
    def _priorizar_insights(self, insights: List[InsightFinanceiro]) -> List[InsightFinanceiro]:
        """Prioriza insights por criticidade e impacto"""
        # Definir ordem de prioridade
        ordem_prioridade = {
            InsightPriority.CRITICA: 4,
            InsightPriority.ALTA: 3,
            InsightPriority.MEDIA: 2,
            InsightPriority.BAIXA: 1
        }
        
        # Ordenar por prioridade e depois por valor de impacto
        insights_ordenados = sorted(
            insights,
            key=lambda x: (ordem_prioridade.get(x.prioridade, 0), float(x.valor_impacto or 0)),
            reverse=True
        )
        
        return insights_ordenados
    
    def _calcular_score_confianca(self, insight: InsightFinanceiro, dados_analise: Dict[str, Any]) -> Decimal:
        """Calcula score de confiança do insight baseado na qualidade dos dados"""
        score_base = Decimal('70')  # Score base
        
        # Ajustar baseado no tipo de insight
        if insight.tipo == InsightType.KPI:
            # KPIs têm alta confiabilidade por serem dados diretos
            score_base += Decimal('20')
        elif insight.tipo == InsightType.FLUXO_CAIXA:
            # Fluxo de caixa depende da quantidade de dados
            num_movimentacoes = len(dados_analise.get('analise_cashflow', {}).get('movimentacoes_analisadas', []))
            if num_movimentacoes >= 6:
                score_base += Decimal('15')
            elif num_movimentacoes >= 3:
                score_base += Decimal('10')
        elif insight.tipo == InsightType.INADIMPLENCIA:
            # Inadimplência depende da completude dos dados
            num_inadimplentes = len(dados_analise.get('analise_inadimplencia', {}).get('inadimplentes_analisados', []))
            if num_inadimplentes >= 5:
                score_base += Decimal('10')
        
        # Ajustar baseado na prioridade (insights críticos tendem a ser mais confiáveis)
        if insight.prioridade == InsightPriority.CRITICA:
            score_base += Decimal('5')
        
        # Garantir que está no range 0-100
        return min(Decimal('100'), max(Decimal('0'), score_base))
    
    def gerar_resumo_insights(self, insights: List[InsightFinanceiro]) -> Dict[str, Any]:
        """Gera resumo executivo dos insights gerados"""
        resumo = {
            'total_insights': len(insights),
            'por_prioridade': {},
            'por_tipo': {},
            'valor_impacto_total': Decimal('0'),
            'score_confianca_medio': Decimal('0'),
            'insights_criticos': [],
            'recomendacoes_prioritarias': []
        }
        
        # Contar por prioridade
        for prioridade in InsightPriority:
            count = len([i for i in insights if i.prioridade == prioridade])
            resumo['por_prioridade'][prioridade.value] = count
        
        # Contar por tipo
        for tipo in InsightType:
            count = len([i for i in insights if i.tipo == tipo])
            resumo['por_tipo'][tipo.value] = count
        
        # Calcular métricas agregadas
        if insights:
            resumo['valor_impacto_total'] = sum((i.valor_impacto or Decimal('0')) for i in insights)
            scores_validos = [i.score_confianca for i in insights if i.score_confianca is not None]
            if scores_validos:
                resumo['score_confianca_medio'] = (sum(scores_validos) / len(scores_validos)).quantize(Decimal('0.1'))
        
        # Extrair insights críticos
        resumo['insights_criticos'] = [
            {
                'titulo': i.titulo,
                'tipo': i.tipo.value,
                'valor_impacto': float(i.valor_impacto or 0),
                'score_confianca': float(i.score_confianca or 0)
            }
            for i in insights if i.prioridade == InsightPriority.CRITICA
        ]
        
        # Extrair recomendações prioritárias (dos insights críticos)
        for insight in insights:
            if insight.prioridade == InsightPriority.CRITICA and insight.recomendacoes:
                resumo['recomendacoes_prioritarias'].extend(insight.recomendacoes[:2])  # Top 2 por insight
        
        # Limitar a 10 recomendações prioritárias
        resumo['recomendacoes_prioritarias'] = resumo['recomendacoes_prioritarias'][:10]
        
        return resumo
    
    def gerar_relatorio_insights(self, insights: List[InsightFinanceiro]) -> str:
        """Gera relatório formatado dos insights"""
        relatorio = []
        relatorio.append("=" * 60)
        relatorio.append("🧠 INSIGHTS FINANCEIROS AUTOMÁTICOS")
        relatorio.append("=" * 60)
        relatorio.append("")
        
        resumo = self.gerar_resumo_insights(insights)
        
        # Resumo executivo
        relatorio.append("📊 RESUMO EXECUTIVO:")
        relatorio.append(f"   • Total de Insights: {resumo['total_insights']}")
        relatorio.append(f"   • Críticos: {resumo['por_prioridade'].get('CRÍTICA', 0)}")
        relatorio.append(f"   • Score Médio de Confiança: {self.formatter.formatar_porcentagem(resumo['score_confianca_medio'])}")
        relatorio.append(f"   • Impacto Total Estimado: {self.formatter.formatar_moeda(resumo['valor_impacto_total'], compacto=True)}")
        relatorio.append("")
        
        # Insights críticos detalhados
        insights_criticos = [i for i in insights if i.prioridade == InsightPriority.CRITICA]
        if insights_criticos:
            relatorio.append("🚨 INSIGHTS CRÍTICOS:")
            for i, insight in enumerate(insights_criticos, 1):
                relatorio.append(f"   {i}. {insight.titulo}")
                relatorio.append(f"      {insight.descricao}")
                relatorio.append(f"      Impacto: {self.formatter.formatar_moeda(insight.valor_impacto or 0, compacto=True)}")
                relatorio.append(f"      Confiança: {self.formatter.formatar_porcentagem(insight.score_confianca or 0)}")
                if insight.recomendacoes:
                    relatorio.append(f"      Ação Principal: {insight.recomendacoes[0]}")
                relatorio.append("")
        
        # Insights por categoria
        insights_por_tipo = {}
        for insight in insights:
            if insight.tipo not in insights_por_tipo:
                insights_por_tipo[insight.tipo] = []
            insights_por_tipo[insight.tipo].append(insight)
        
        for tipo, insights_tipo in insights_por_tipo.items():
            if len(insights_tipo) > 0 and tipo != InsightType.OPERACIONAL:  # Operacional já foi mostrado acima
                emoji_tipo = {
                    InsightType.KPI: "📈",
                    InsightType.FLUXO_CAIXA: "💰",
                    InsightType.INADIMPLENCIA: "⚠️",
                    InsightType.TENDENCIA: "📊",
                    InsightType.ORCAMENTO: "💳"
                }.get(tipo, "📋")
                
                relatorio.append(f"{emoji_tipo} INSIGHTS - {tipo.value.replace('_', ' ').title()}:")
                for insight in insights_tipo[:3]:  # Top 3 por categoria
                    prioridade_emoji = {"CRÍTICA": "🔴", "ALTA": "🟡", "MÉDIA": "🔵", "BAIXA": "⚪"}.get(insight.prioridade.value, "⚪")
                    relatorio.append(f"   {prioridade_emoji} {insight.titulo}")
                    if insight.recomendacoes:
                        relatorio.append(f"      → {insight.recomendacoes[0]}")
                relatorio.append("")
        
        return "\n".join(relatorio)