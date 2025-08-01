"""
Analisador de Inadimplência para Shopping Centers.
Análise especializada dos maiores inadimplentes do Shopping Park Botucatu.
"""
from decimal import Decimal
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta

from .kpi_analyzer import BaseAnalyzer
from ..core.models import Inadimplente, ConfiguracaoAnalise
from ..core.enums import DebtStatus, RiskLevel, InsightType, InsightPriority
from ..core.exceptions import CalculationError, InsufficientDataError
from ..formatters.brazilian import BrazilianFormatter


class DelinquencyAnalyzer(BaseAnalyzer):
    """Analisador especializado em inadimplência e recuperação de crédito"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        super().__init__(configuracao)
        self.thresholds_risco = {
            'valor_alto': Decimal('50000'),      # Valores acima de R$ 50k
            'valor_medio': Decimal('20000'),     # Valores entre R$ 20k-50k
            'valor_baixo': Decimal('5000'),      # Valores entre R$ 5k-20k
            'dias_critico': 90,                  # Mais de 90 dias
            'dias_alto': 60,                     # 60-90 dias
            'dias_medio': 30                     # 30-60 dias
        }
    
    def analisar(self, inadimplentes: List[Dict[str, Any]], receita_total: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Analisa dados de inadimplência.
        
        Args:
            inadimplentes: Lista de inadimplentes
            receita_total: Receita total para cálculo de impacto percentual
            
        Returns:
            Dict com análise completa de inadimplência
        """
        try:
            if not inadimplentes:
                raise InsufficientDataError("analise_inadimplencia", 1, 0)
            
            # Converter para objetos Inadimplente
            inadimplentes_obj = self._converter_inadimplentes(inadimplentes)
            
            # Análises principais
            ranking_valor = self._gerar_ranking_por_valor(inadimplentes_obj)
            analise_risco = self._analisar_perfil_risco(inadimplentes_obj)
            concentracao = self._analisar_concentracao_dividas(inadimplentes_obj)
            impacto_financeiro = self._calcular_impacto_financeiro(inadimplentes_obj, receita_total)
            
            # Estratégias de recuperação
            estrategias_recuperacao = self._gerar_estrategias_recuperacao(inadimplentes_obj)
            
            # Métricas consolidadas
            metricas_gerais = self._calcular_metricas_inadimplencia(inadimplentes_obj, receita_total)
            
            # Recomendações específicas
            recomendacoes = self._gerar_recomendacoes_inadimplencia(inadimplentes_obj, analise_risco)
            
            return {
                'inadimplentes_analisados': inadimplentes_obj,
                'ranking_por_valor': ranking_valor,
                'analise_risco': analise_risco,
                'concentracao_dividas': concentracao,
                'impacto_financeiro': impacto_financeiro,
                'estrategias_recuperacao': estrategias_recuperacao,
                'metricas_gerais': metricas_gerais,
                'recomendacoes': recomendacoes,
                'data_analise': datetime.now(),
                'total_inadimplentes': len(inadimplentes_obj)
            }
            
        except Exception as e:
            raise CalculationError("analise_inadimplencia", str(e)) from e
    
    def _converter_inadimplentes(self, inadimplentes: List[Dict[str, Any]]) -> List[Inadimplente]:
        """Converte dados brutos em objetos Inadimplente"""
        inadimplentes_obj = []
        
        for inad in inadimplentes:
            try:
                # Determinar status baseado nas informações disponíveis
                status = DebtStatus.CONFISSAO_DIVIDA  # Status padrão dos dados fornecidos
                if 'status' in inad:
                    status_map = {
                        'confissao_divida': DebtStatus.CONFISSAO_DIVIDA,
                        'em_atraso': DebtStatus.EM_ATRASO,
                        'negociacao': DebtStatus.NEGOCIACAO,
                        'acordo': DebtStatus.ACORDO,
                        'juridico': DebtStatus.JURIDICO
                    }
                    status = status_map.get(inad['status'].lower(), DebtStatus.CONFISSAO_DIVIDA)
                
                # Calcular dias de atraso estimados (se não fornecido)
                dias_atraso = inad.get('dias_atraso', 60)  # Estimativa padrão
                
                # Classificar risco baseado em valor e tempo
                risco = self.formatter.classificar_risco_inadimplencia(
                    inad['valor_divida'], dias_atraso
                )
                
                obj = Inadimplente(
                    nome=inad['nome'],
                    valor_divida=Decimal(str(inad['valor_divida'])),
                    status=status,
                    dias_atraso=dias_atraso,
                    categoria=inad.get('categoria', 'Não informado'),
                    observacoes=inad.get('observacoes', ''),
                    risco=risco
                )
                inadimplentes_obj.append(obj)
                
            except Exception as e:
                raise CalculationError(f"conversao_inadimplente_{inad.get('nome', 'unknown')}", str(e)) from e
        
        return inadimplentes_obj
    
    def _gerar_ranking_por_valor(self, inadimplentes: List[Inadimplente]) -> List[Dict[str, Any]]:
        """Gera ranking dos inadimplentes por valor da dívida"""
        # Ordenar por valor decrescente
        inadimplentes_ordenados = sorted(inadimplentes, key=lambda x: x.valor_divida, reverse=True)
        
        ranking = []
        total = len(inadimplentes)
        
        for i, inad in enumerate(inadimplentes_ordenados, 1):
            participacao = (inad.valor_divida / sum(i.valor_divida for i in inadimplentes)) * 100
            
            ranking_item = {
                'posicao': i,
                'nome': inad.nome,
                'valor_divida': inad.valor_divida,
                'participacao_percentual': participacao.quantize(Decimal('0.1')),
                'status': inad.status,
                'risco': inad.risco,
                'categoria': inad.categoria,
                'recomendacao_acao': self._recomendar_acao_individual(inad),
                'prioridade_cobranca': self._calcular_prioridade_cobranca(inad, i, total)
            }
            ranking.append(ranking_item)
        
        return ranking
    
    def _recomendar_acao_individual(self, inadimplente: Inadimplente) -> str:
        """Recomenda ação específica para cada inadimplente"""
        if inadimplente.valor_divida >= self.thresholds_risco['valor_alto']:
            if inadimplente.status == DebtStatus.CONFISSAO_DIVIDA:
                return "Execução judicial imediata"
            else:
                return "Negociação com desconto máximo de 20%"
        elif inadimplente.valor_divida >= self.thresholds_risco['valor_medio']:
            return "Acordo parcelado com entrada de 30%"
        else:
            return "Negociação direta com flexibilidade de prazo"
    
    def _calcular_prioridade_cobranca(self, inadimplente: Inadimplente, posicao: int, total: int) -> str:
        """Calcula prioridade de cobrança baseada em múltiplos fatores"""
        score = 0
        
        # Peso do valor (40%)
        if inadimplente.valor_divida >= self.thresholds_risco['valor_alto']:
            score += 40
        elif inadimplente.valor_divida >= self.thresholds_risco['valor_medio']:
            score += 25
        else:
            score += 10
        
        # Peso da posição no ranking (30%)
        if posicao <= total * 0.2:  # Top 20%
            score += 30
        elif posicao <= total * 0.5:  # Top 50%
            score += 20
        else:
            score += 10
        
        # Peso do status (20%)
        status_scores = {
            DebtStatus.CONFISSAO_DIVIDA: 20,
            DebtStatus.EM_ATRASO: 15,
            DebtStatus.NEGOCIACAO: 10,
            DebtStatus.ACORDO: 5,
            DebtStatus.JURIDICO: 15
        }
        score += status_scores.get(inadimplente.status, 10)
        
        # Peso do risco (10%)
        risco_scores = {
            RiskLevel.MUITO_ALTO: 10,
            RiskLevel.ALTO: 8,
            RiskLevel.MEDIO: 5,
            RiskLevel.BAIXO: 3,
            RiskLevel.MUITO_BAIXO: 1
        }
        score += risco_scores.get(inadimplente.risco, 5)
        
        # Classificar prioridade final
        if score >= 80:
            return "CRÍTICA"
        elif score >= 60:
            return "ALTA"
        elif score >= 40:
            return "MÉDIA"
        else:
            return "BAIXA"
    
    def _analisar_perfil_risco(self, inadimplentes: List[Inadimplente]) -> Dict[str, Any]:
        """Analisa o perfil de risco dos inadimplentes"""
        # Distribuição por nível de risco
        distribuicao_risco = {}
        for nivel in RiskLevel:
            distribuicao_risco[nivel.value] = len([i for i in inadimplentes if i.risco == nivel])
        
        # Distribuição por faixa de valor
        distribuicao_valor = {
            'acima_50k': len([i for i in inadimplentes if i.valor_divida >= self.thresholds_risco['valor_alto']]),
            '20k_50k': len([i for i in inadimplentes if self.thresholds_risco['valor_medio'] <= i.valor_divida < self.thresholds_risco['valor_alto']]),
            '5k_20k': len([i for i in inadimplentes if self.thresholds_risco['valor_baixo'] <= i.valor_divida < self.thresholds_risco['valor_medio']]),
            'abaixo_5k': len([i for i in inadimplentes if i.valor_divida < self.thresholds_risco['valor_baixo']])
        }
        
        # Distribuição por status
        distribuicao_status = {}
        for status in DebtStatus:
            distribuicao_status[status.value] = len([i for i in inadimplentes if i.status == status])
        
        # Análise de concentração de risco
        inadimplentes_alto_risco = [i for i in inadimplentes if i.risco in [RiskLevel.MUITO_ALTO, RiskLevel.ALTO]]
        concentracao_alto_risco = Decimal(str((len(inadimplentes_alto_risco) / len(inadimplentes)) * 100))
        
        return {
            'distribuicao_risco': distribuicao_risco,
            'distribuicao_valor': distribuicao_valor,
            'distribuicao_status': distribuicao_status,
            'concentracao_alto_risco': concentracao_alto_risco.quantize(Decimal('0.1')),
            'inadimplentes_criticos': len([i for i in inadimplentes if i.risco == RiskLevel.MUITO_ALTO]),
            'valor_medio_divida': (sum(i.valor_divida for i in inadimplentes) / len(inadimplentes)).quantize(Decimal('0.01')),
            'maior_divida': max(i.valor_divida for i in inadimplentes),
            'menor_divida': min(i.valor_divida for i in inadimplentes)
        }
    
    def _analisar_concentracao_dividas(self, inadimplentes: List[Inadimplente]) -> Dict[str, Any]:
        """Analisa concentração das dívidas (Princípio de Pareto)"""
        inadimplentes_ordenados = sorted(inadimplentes, key=lambda x: x.valor_divida, reverse=True)
        valor_total = sum(i.valor_divida for i in inadimplentes)
        
        # Análise 80/20 (Pareto)
        valor_acumulado = Decimal('0')
        top_20_percent = max(1, int(len(inadimplentes) * 0.2))
        
        for i, inad in enumerate(inadimplentes_ordenados[:top_20_percent]):
            valor_acumulado += inad.valor_divida
        
        concentracao_pareto = Decimal(str((valor_acumulado / valor_total) * 100))
        
        # Top 3 representam quanto do total?
        top_3_valor = sum(i.valor_divida for i in inadimplentes_ordenados[:3])
        concentracao_top3 = Decimal(str((top_3_valor / valor_total) * 100))
        
        # Top 10 representam quanto do total?
        top_10_count = min(10, len(inadimplentes))
        top_10_valor = sum(i.valor_divida for i in inadimplentes_ordenados[:top_10_count])
        concentracao_top10 = Decimal(str((top_10_valor / valor_total) * 100))
        
        return {
            'concentracao_pareto_20': concentracao_pareto.quantize(Decimal('0.1')),
            'concentracao_top3': concentracao_top3.quantize(Decimal('0.1')),
            'concentracao_top10': concentracao_top10.quantize(Decimal('0.1')),
            'valor_top_20_percent': valor_acumulado,
            'valor_top_3': top_3_valor,
            'valor_top_10': top_10_valor,
            'indice_concentracao': self._calcular_indice_gini(inadimplentes_ordenados)
        }
    
    def _calcular_indice_gini(self, inadimplentes_ordenados: List[Inadimplente]) -> Decimal:
        """Calcula índice de Gini para concentração das dívidas"""
        valores = [float(i.valor_divida) for i in inadimplentes_ordenados]
        n = len(valores)
        
        if n == 0:
            return Decimal('0')
        
        # Calcular índice de Gini
        index = list(range(1, n + 1))
        gini = (2 * sum(index[i] * valores[i] for i in range(n))) / (n * sum(valores)) - (n + 1) / n
        
        return Decimal(str(gini)).quantize(Decimal('0.001'))
    
    def _calcular_impacto_financeiro(self, inadimplentes: List[Inadimplente], 
                                   receita_total: Optional[Decimal]) -> Dict[str, Any]:
        """Calcula impacto financeiro da inadimplência"""
        valor_total_dividas = sum(i.valor_divida for i in inadimplentes)
        
        impacto = {
            'valor_total_inadimplencia': valor_total_dividas,
            'numero_inadimplentes': len(inadimplentes),
            'ticket_medio_inadimplencia': (valor_total_dividas / len(inadimplentes)).quantize(Decimal('0.01'))
        }
        
        if receita_total and receita_total > 0:
            impacto['percentual_receita'] = ((valor_total_dividas / receita_total) * 100).quantize(Decimal('0.1'))
            impacto['impacto_fluxo_caixa'] = self._classificar_impacto_fluxo(impacto['percentual_receita'])
        
        # Calcular potencial de recuperação
        impacto['potencial_recuperacao'] = self._calcular_potencial_recuperacao(inadimplentes)
        
        return impacto
    
    def _classificar_impacto_fluxo(self, percentual: Decimal) -> str:
        """Classifica o impacto no fluxo de caixa"""
        if percentual >= 15:
            return "CRÍTICO - Comprometimento severo do fluxo de caixa"
        elif percentual >= 10:
            return "ALTO - Impacto significativo no fluxo de caixa"
        elif percentual >= 5:
            return "MODERADO - Impacto controlável no fluxo de caixa"
        else:
            return "BAIXO - Impacto mínimo no fluxo de caixa"
    
    def _calcular_potencial_recuperacao(self, inadimplentes: List[Inadimplente]) -> Dict[str, Any]:
        """Calcula potencial de recuperação baseado em status e risco"""
        # Estimativas de recuperação por status
        taxas_recuperacao = {
            DebtStatus.CONFISSAO_DIVIDA: Decimal('0.70'),  # 70%
            DebtStatus.EM_ATRASO: Decimal('0.60'),         # 60%
            DebtStatus.NEGOCIACAO: Decimal('0.80'),        # 80%
            DebtStatus.ACORDO: Decimal('0.90'),            # 90%
            DebtStatus.JURIDICO: Decimal('0.40')           # 40%
        }
        
        recuperacao_otimista = Decimal('0')
        recuperacao_conservadora = Decimal('0')
        
        for inad in inadimplentes:
            taxa_base = taxas_recuperacao.get(inad.status, Decimal('0.50'))
            
            # Cenário otimista (taxa base)
            recuperacao_otimista += inad.valor_divida * taxa_base
            
            # Cenário conservador (taxa base * 0.7)
            recuperacao_conservadora += inad.valor_divida * taxa_base * Decimal('0.7')
        
        valor_total = sum(i.valor_divida for i in inadimplentes)
        
        return {
            'cenario_otimista': recuperacao_otimista.quantize(Decimal('0.01')),
            'cenario_conservador': recuperacao_conservadora.quantize(Decimal('0.01')),
            'taxa_recuperacao_otimista': ((recuperacao_otimista / valor_total) * 100).quantize(Decimal('0.1')),
            'taxa_recuperacao_conservadora': ((recuperacao_conservadora / valor_total) * 100).quantize(Decimal('0.1')),
            'valor_irrecuperavel_estimado': (valor_total - recuperacao_conservadora).quantize(Decimal('0.01'))
        }
    
    def _gerar_estrategias_recuperacao(self, inadimplentes: List[Inadimplente]) -> Dict[str, Any]:
        """Gera estratégias específicas de recuperação"""
        estrategias = {
            'acao_imediata': [],
            'negociacao_prioritaria': [],
            'monitoramento_ativo': [],
            'juridico': []
        }
        
        for inad in inadimplentes:
            if inad.risco == RiskLevel.MUITO_ALTO and inad.valor_divida >= self.thresholds_risco['valor_alto']:
                estrategias['acao_imediata'].append({
                    'nome': inad.nome,
                    'valor': inad.valor_divida,
                    'acao': 'Execução judicial ou acordo com desconto máximo de 15%',
                    'prazo': '7 dias'
                })
            elif inad.valor_divida >= self.thresholds_risco['valor_medio']:
                estrategias['negociacao_prioritaria'].append({
                    'nome': inad.nome,
                    'valor': inad.valor_divida,
                    'acao': 'Negociação ativa com proposta de parcelamento',
                    'prazo': '15 dias'
                })
            elif inad.risco in [RiskLevel.ALTO, RiskLevel.MEDIO]:
                estrategias['monitoramento_ativo'].append({
                    'nome': inad.nome,
                    'valor': inad.valor_divida,
                    'acao': 'Contato semanal e acompanhamento próximo',
                    'prazo': '30 dias'
                })
            else:
                estrategias['juridico'].append({
                    'nome': inad.nome,
                    'valor': inad.valor_divida,
                    'acao': 'Análise jurídica para execução',
                    'prazo': '45 dias'
                })
        
        return estrategias
    
    def _calcular_metricas_inadimplencia(self, inadimplentes: List[Inadimplente], 
                                       receita_total: Optional[Decimal]) -> Dict[str, Any]:
        """Calcula métricas gerais de inadimplência"""
        valor_total = sum(i.valor_divida for i in inadimplentes)
        
        metricas = {
            'valor_total_inadimplencia': valor_total,
            'numero_total_inadimplentes': len(inadimplentes),
            'ticket_medio': (valor_total / len(inadimplentes)).quantize(Decimal('0.01')),
            'mediana_valores': self._calcular_mediana_valores(inadimplentes),
            'inadimplentes_acima_media': len([i for i in inadimplentes if i.valor_divida > (valor_total / len(inadimplentes))]),
            'concentracao_risco_alto': len([i for i in inadimplentes if i.risco in [RiskLevel.MUITO_ALTO, RiskLevel.ALTO]])
        }
        
        if receita_total and receita_total > 0:
            metricas['taxa_inadimplencia_receita'] = ((valor_total / receita_total) * 100).quantize(Decimal('0.1'))
        
        return metricas
    
    def _calcular_mediana_valores(self, inadimplentes: List[Inadimplente]) -> Decimal:
        """Calcula mediana dos valores de dívida"""
        valores = sorted([i.valor_divida for i in inadimplentes])
        n = len(valores)
        
        if n % 2 == 0:
            mediana = (valores[n//2 - 1] + valores[n//2]) / 2
        else:
            mediana = valores[n//2]
        
        return mediana.quantize(Decimal('0.01'))
    
    def _gerar_recomendacoes_inadimplencia(self, inadimplentes: List[Inadimplente], 
                                         analise_risco: Dict[str, Any]) -> List[str]:
        """Gera recomendações específicas para inadimplência"""
        recomendacoes = []
        
        # Recomendações baseadas em concentração
        if analise_risco['concentracao_alto_risco'] > 50:
            recomendacoes.append(
                f"🚨 ALTA CONCENTRAÇÃO DE RISCO: {analise_risco['concentracao_alto_risco']}% dos inadimplentes "
                f"são de alto/muito alto risco. Implementar estratégia de recuperação urgente."
            )
        
        # Recomendações para top inadimplentes
        top_3 = sorted(inadimplentes, key=lambda x: x.valor_divida, reverse=True)[:3]
        for i, inad in enumerate(top_3, 1):
            recomendacoes.append(
                f"🎯 TOP {i} - {inad.nome}: {self.formatter.formatar_moeda(inad.valor_divida, compacto=True)} "
                f"({inad.status.value}). {self._recomendar_acao_individual(inad)}"
            )
        
        # Recomendação geral de processo
        if len(inadimplentes) > 10:
            recomendacoes.append(
                "📋 PROCESSO: Implementar fluxo automatizado de cobrança com diferentes abordagens "
                "por faixa de valor e nível de risco"
            )
        
        return recomendacoes
    
    def gerar_relatorio_inadimplencia(self, analise_inadimplencia: Dict[str, Any]) -> str:
        """Gera relatório formatado de inadimplência"""
        relatorio = []
        relatorio.append("=" * 60)
        relatorio.append("⚠️  ANÁLISE DE INADIMPLÊNCIA")
        relatorio.append("=" * 60)
        relatorio.append("")
        
        metricas = analise_inadimplencia['metricas_gerais']
        impacto = analise_inadimplencia['impacto_financeiro']
        
        # Resumo executivo
        relatorio.append("📊 RESUMO EXECUTIVO:")
        relatorio.append(f"   • Total Inadimplentes: {metricas['numero_total_inadimplentes']}")
        relatorio.append(f"   • Valor Total: {self.formatter.formatar_moeda(metricas['valor_total_inadimplencia'], compacto=True)}")
        relatorio.append(f"   • Ticket Médio: {self.formatter.formatar_moeda(metricas['ticket_medio'], compacto=True)}")
        
        if 'percentual_receita' in impacto:
            relatorio.append(f"   • % da Receita: {self.formatter.formatar_porcentagem(impacto['percentual_receita'])}")
            relatorio.append(f"   • Impacto: {impacto['impacto_fluxo_caixa']}")
        relatorio.append("")
        
        # Ranking dos maiores
        ranking = analise_inadimplencia['ranking_por_valor']
        relatorio.append("🏆 TOP 5 MAIORES INADIMPLENTES:")
        for item in ranking[:5]:
            relatorio.append(f"   {item['posicao']}º - {item['nome']}:")
            relatorio.append(f"      Valor: {self.formatter.formatar_moeda(item['valor_divida'], compacto=True)}")
            relatorio.append(f"      Participação: {self.formatter.formatar_porcentagem(item['participacao_percentual'])}")
            relatorio.append(f"      Status: {item['status'].value}")
            relatorio.append(f"      Ação: {item['recomendacao_acao']}")
            relatorio.append("")
        
        # Potencial de recuperação
        recuperacao = analise_inadimplencia['impacto_financeiro']['potencial_recuperacao']
        relatorio.append("💰 POTENCIAL DE RECUPERAÇÃO:")
        relatorio.append(f"   • Cenário Otimista: {self.formatter.formatar_moeda(recuperacao['cenario_otimista'], compacto=True)} "
                        f"({self.formatter.formatar_porcentagem(recuperacao['taxa_recuperacao_otimista'])})")
        relatorio.append(f"   • Cenário Conservador: {self.formatter.formatar_moeda(recuperacao['cenario_conservador'], compacto=True)} "
                        f"({self.formatter.formatar_porcentagem(recuperacao['taxa_recuperacao_conservadora'])})")
        relatorio.append("")
        
        # Recomendações
        if analise_inadimplencia['recomendacoes']:
            relatorio.append("💡 RECOMENDAÇÕES PRIORITÁRIAS:")
            for rec in analise_inadimplencia['recomendacoes']:
                relatorio.append(f"   • {rec}")
            relatorio.append("")
        
        return "\n".join(relatorio)