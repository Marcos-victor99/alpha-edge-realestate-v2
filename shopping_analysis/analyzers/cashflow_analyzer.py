"""
Analisador de Fluxo de Caixa para Shopping Centers.
Análise temporal dos dados de Mai-Dez 2025 do Shopping Park Botucatu.
"""
from decimal import Decimal
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import statistics

from .kpi_analyzer import BaseAnalyzer
from ..core.models import MovimentacaoFinanceira, TendenciaFinanceira, ConfiguracaoAnalise
from ..core.enums import TrendDirection, StatusKPI, InsightType, InsightPriority
from ..core.exceptions import CalculationError, InsufficientDataError
from ..formatters.brazilian import BrazilianFormatter


class CashFlowAnalyzer(BaseAnalyzer):
    """Analisador especializado em fluxo de caixa temporal"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        super().__init__(configuracao)
        self.meses_ordem = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ]
    
    def analisar(self, movimentacoes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analisa o fluxo de caixa temporal.
        
        Args:
            movimentacoes: Lista de movimentações mensais
            
        Returns:
            Dict com análise completa do fluxo de caixa
        """
        try:
            if len(movimentacoes) < 2:
                raise InsufficientDataError("analise_cashflow", 2, len(movimentacoes))
            
            # Converter para objetos MovimentacaoFinanceira
            movimentacoes_obj = self._converter_movimentacoes(movimentacoes)
            
            # Análises principais
            resumo_mensal = self._analisar_resumo_mensal(movimentacoes_obj)
            tendencias = self._analisar_tendencias(movimentacoes_obj)
            meses_criticos = self._identificar_meses_criticos(movimentacoes_obj)
            sazonalidade = self._analisar_sazonalidade(movimentacoes_obj)
            projecoes = self._gerar_projecoes(movimentacoes_obj)
            
            # Métricas consolidadas
            metricas_gerais = self._calcular_metricas_gerais(movimentacoes_obj)
            
            # Alertas e recomendações
            alertas = self._gerar_alertas_cashflow(movimentacoes_obj, meses_criticos)
            recomendacoes = self._gerar_recomendacoes_cashflow(tendencias, meses_criticos)
            
            return {
                'movimentacoes_analisadas': movimentacoes_obj,
                'resumo_mensal': resumo_mensal,
                'tendencias': tendencias,
                'meses_criticos': meses_criticos,
                'sazonalidade': sazonalidade,
                'projecoes': projecoes,
                'metricas_gerais': metricas_gerais,
                'alertas': alertas,
                'recomendacoes': recomendacoes,
                'data_analise': datetime.now(),
                'periodo_analisado': f"{movimentacoes_obj[0].periodo_completo} - {movimentacoes_obj[-1].periodo_completo}"
            }
            
        except Exception as e:
            raise CalculationError("analise_cashflow", str(e)) from e
    
    def _converter_movimentacoes(self, movimentacoes: List[Dict[str, Any]]) -> List[MovimentacaoFinanceira]:
        """Converte dados brutos em objetos MovimentacaoFinanceira"""
        movimentacoes_obj = []
        
        for mov in movimentacoes:
            try:
                obj = MovimentacaoFinanceira(
                    mes=mov['mes'],
                    ano=mov.get('ano', 2025),
                    credito=Decimal(str(mov['credito'])),
                    debito=abs(Decimal(str(mov['debito']))),  # Garantir que débito seja positivo
                    saldo_operacional=Decimal(str(mov['saldo_operacional']))
                )
                movimentacoes_obj.append(obj)
            except Exception as e:
                raise CalculationError(f"conversao_movimentacao_{mov.get('mes', 'unknown')}", str(e)) from e
        
        # Ordenar por mês
        return sorted(movimentacoes_obj, key=lambda x: self._obter_indice_mes(x.mes))
    
    def _obter_indice_mes(self, mes: str) -> int:
        """Obtém índice numérico do mês para ordenação"""
        mes_lower = mes.lower()
        try:
            return self.meses_ordem.index(mes_lower)
        except ValueError:
            # Fallback para meses abreviados
            abreviacoes = {
                'mai': 4, 'jun': 5, 'jul': 6, 'ago': 7,
                'set': 8, 'out': 9, 'nov': 10, 'dez': 11
            }
            return abreviacoes.get(mes_lower, 0)
    
    def _analisar_resumo_mensal(self, movimentacoes: List[MovimentacaoFinanceira]) -> Dict[str, Any]:
        """Gera resumo mensal das movimentações"""
        total_creditos = sum(mov.credito for mov in movimentacoes)
        total_debitos = sum(mov.debito for mov in movimentacoes)
        saldo_final = sum(mov.saldo_operacional for mov in movimentacoes)
        
        # Médias mensais
        media_creditos = total_creditos / len(movimentacoes)
        media_debitos = total_debitos / len(movimentacoes)
        media_saldo = saldo_final / len(movimentacoes)
        
        # Mês com maior e menor performance
        melhor_mes = max(movimentacoes, key=lambda x: x.saldo_operacional)
        pior_mes = min(movimentacoes, key=lambda x: x.saldo_operacional)
        
        return {
            'total_creditos': total_creditos,
            'total_debitos': total_debitos,
            'saldo_consolidado': saldo_final,
            'media_creditos_mensal': media_creditos,
            'media_debitos_mensal': media_debitos,
            'media_saldo_mensal': media_saldo,
            'melhor_mes': {
                'periodo': melhor_mes.periodo_completo,
                'saldo': melhor_mes.saldo_operacional
            },
            'pior_mes': {
                'periodo': pior_mes.periodo_completo,
                'saldo': pior_mes.saldo_operacional
            },
            'meses_positivos': len([m for m in movimentacoes if m.saldo_operacional > 0]),
            'meses_negativos': len([m for m in movimentacoes if m.saldo_operacional < 0]),
            'volatilidade': self._calcular_volatilidade_saldos(movimentacoes)
        }
    
    def _calcular_volatilidade_saldos(self, movimentacoes: List[MovimentacaoFinanceira]) -> Decimal:
        """Calcula volatilidade dos saldos operacionais"""
        saldos = [float(mov.saldo_operacional) for mov in movimentacoes]
        if len(saldos) < 2:
            return Decimal('0')
        
        volatilidade = statistics.stdev(saldos)
        return Decimal(str(volatilidade)).quantize(Decimal('0.01'))
    
    def _analisar_tendencias(self, movimentacoes: List[MovimentacaoFinanceira]) -> List[TendenciaFinanceira]:
        """Analisa tendências do fluxo de caixa"""
        tendencias = []
        
        # Tendência de créditos
        tendencia_creditos = self._calcular_tendencia_metrica(
            [mov.credito for mov in movimentacoes], "Créditos Mensais"
        )
        tendencias.append(tendencia_creditos)
        
        # Tendência de débitos
        tendencia_debitos = self._calcular_tendencia_metrica(
            [mov.debito for mov in movimentacoes], "Débitos Mensais"
        )
        tendencias.append(tendencia_debitos)
        
        # Tendência de saldo operacional
        tendencia_saldo = self._calcular_tendencia_metrica(
            [mov.saldo_operacional for mov in movimentacoes], "Saldo Operacional"
        )
        tendencias.append(tendencia_saldo)
        
        return tendencias
    
    def _calcular_tendencia_metrica(self, valores: List[Decimal], nome_metrica: str) -> TendenciaFinanceira:
        """Calcula tendência de uma métrica específica"""
        valores_float = [float(v) for v in valores]
        
        # Calcular slope da regressão linear simples
        n = len(valores_float)
        x = list(range(n))
        
        # Fórmulas da regressão linear
        sum_x = sum(x)
        sum_y = sum(valores_float)
        sum_xy = sum(x[i] * valores_float[i] for i in range(n))
        sum_x2 = sum(xi ** 2 for xi in x)
        
        if n * sum_x2 - sum_x ** 2 == 0:
            slope = 0
        else:
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        
        # Determinar direção da tendência
        if abs(slope) < 0.1:
            direcao = TrendDirection.ESTAVEL
            intensidade = Decimal('20')
        elif slope > 0:
            direcao = TrendDirection.CRESCIMENTO
            intensidade = min(Decimal('100'), Decimal(str(abs(slope * 100))))
        else:
            direcao = TrendDirection.DECLINIO
            intensidade = min(Decimal('100'), Decimal(str(abs(slope * 100))))
        
        # Calcular volatilidade como indicador de estabilidade
        volatilidade = statistics.stdev(valores_float) if len(valores_float) > 1 else 0
        confiabilidade = max(Decimal('50'), Decimal('100') - Decimal(str(volatilidade / max(valores_float) * 100)))
        
        # Identificar pontos críticos
        pontos_criticos = []
        for i, valor in enumerate(valores):
            if valor < 0:
                mes_index = i
                pontos_criticos.append(f"Mês {mes_index + 1}: Valor negativo ({self.formatter.formatar_moeda(valor, compacto=True)})")
        
        return TendenciaFinanceira(
            metrica=nome_metrica,
            direcao=direcao,
            intensidade=intensidade.quantize(Decimal('0.1')),
            periodo_analise=f"{len(valores)} meses",
            pontos_criticos=pontos_criticos,
            confiabilidade=confiabilidade.quantize(Decimal('0.1'))
        )
    
    def _identificar_meses_criticos(self, movimentacoes: List[MovimentacaoFinanceira]) -> List[Dict[str, Any]]:
        """Identifica meses com performance crítica"""
        meses_criticos = []
        
        for mov in movimentacoes:
            criticidade = []
            score_risco = 0
            
            # Verificar saldo negativo
            if mov.saldo_operacional < 0:
                criticidade.append("Saldo operacional negativo")
                score_risco += 50
            
            # Verificar desbalanceamento extremo (débitos >> créditos)
            if mov.debito > mov.credito * Decimal('1.5'):
                criticidade.append("Débitos muito superiores aos créditos")
                score_risco += 30
            
            # Verificar valores extremos
            media_creditos = sum(m.credito for m in movimentacoes) / len(movimentacoes)
            if mov.credito < media_creditos * Decimal('0.5'):
                criticidade.append("Créditos muito abaixo da média")
                score_risco += 20
            
            # Se há alguma criticidade, incluir no resultado
            if criticidade:
                meses_criticos.append({
                    'periodo': mov.periodo_completo,
                    'saldo_operacional': mov.saldo_operacional,
                    'problemas_identificados': criticidade,
                    'score_risco': min(100, score_risco),
                    'recomendacao_prazo': self._sugerir_prazo_acao_mes(score_risco)
                })
        
        # Ordenar por score de risco (maior primeiro)
        return sorted(meses_criticos, key=lambda x: x['score_risco'], reverse=True)
    
    def _sugerir_prazo_acao_mes(self, score_risco: int) -> str:
        """Sugere prazo de ação baseado no score de risco"""
        if score_risco >= 70:
            return "Ação imediata (0-7 dias)"
        elif score_risco >= 40:
            return "Ação prioritária (7-15 dias)"
        else:
            return "Monitoramento (15-30 dias)"
    
    def _analisar_sazonalidade(self, movimentacoes: List[MovimentacaoFinanceira]) -> Dict[str, Any]:
        """Analisa padrões sazonais no fluxo de caixa"""
        if len(movimentacoes) < 6:
            return {"erro": "Dados insuficientes para análise sazonal"}
        
        # Identificar meses de alta e baixa performance
        saldos_por_mes = [(mov.mes, mov.saldo_operacional) for mov in movimentacoes]
        melhor_performance = max(saldos_por_mes, key=lambda x: x[1])
        pior_performance = min(saldos_por_mes, key=lambda x: x[1])
        
        # Calcular média móvel para suavizar flutuações
        saldos = [mov.saldo_operacional for mov in movimentacoes]
        media_movel = []
        for i in range(len(saldos) - 2):
            media = sum(saldos[i:i+3]) / 3
            media_movel.append(media)
        
        return {
            'melhor_periodo_sazonal': melhor_performance[0],
            'melhor_valor_sazonal': melhor_performance[1],
            'pior_periodo_sazonal': pior_performance[0],
            'pior_valor_sazonal': pior_performance[1],
            'amplitude_sazonal': melhor_performance[1] - pior_performance[1],
            'media_movel_trimestral': media_movel,
            'variacao_sazonal': self._calcular_coeficiente_variacao(saldos)
        }
    
    def _calcular_coeficiente_variacao(self, valores: List[Decimal]) -> Decimal:
        """Calcula coeficiente de variação (desvio padrão / média)"""
        valores_float = [float(v) for v in valores]
        if not valores_float:
            return Decimal('0')
        
        media = statistics.mean(valores_float)
        if media == 0:
            return Decimal('0')
        
        desvio = statistics.stdev(valores_float) if len(valores_float) > 1 else 0
        coef_variacao = (desvio / abs(media)) * 100
        
        return Decimal(str(coef_variacao)).quantize(Decimal('0.1'))
    
    def _gerar_projecoes(self, movimentacoes: List[MovimentacaoFinanceira]) -> Dict[str, Any]:
        """Gera projeções para próximos meses"""
        if len(movimentacoes) < 3:
            return {"erro": "Dados insuficientes para projeção"}
        
        # Calcular médias dos últimos 3 meses
        ultimos_3 = movimentacoes[-3:]
        media_creditos = sum(mov.credito for mov in ultimos_3) / 3
        media_debitos = sum(mov.debito for mov in ultimos_3) / 3
        
        # Projeção simples baseada na tendência
        tendencia_saldo = self._calcular_tendencia_metrica(
            [mov.saldo_operacional for mov in movimentacoes], "Saldo"
        )
        
        projecoes_meses = {}
        for i in range(1, 4):  # Próximos 3 meses
            # Aplicar tendência à média
            fator_tendencia = 1.0
            if tendencia_saldo.direcao == TrendDirection.CRESCIMENTO:
                fator_tendencia = 1.0 + (float(tendencia_saldo.intensidade) / 100 * 0.1)
            elif tendencia_saldo.direcao == TrendDirection.DECLINIO:
                fator_tendencia = 1.0 - (float(tendencia_saldo.intensidade) / 100 * 0.1)
            
            credito_projetado = media_creditos * Decimal(str(fator_tendencia))
            debito_projetado = media_debitos
            saldo_projetado = credito_projetado - debito_projetado
            
            projecoes_meses[f"mes_{i}"] = {
                'credito_projetado': credito_projetado.quantize(Decimal('0.01')),
                'debito_projetado': debito_projetado.quantize(Decimal('0.01')),
                'saldo_projetado': saldo_projetado.quantize(Decimal('0.01'))
            }
        
        return {
            'projecoes_mensais': projecoes_meses,
            'base_calculo': "Média dos últimos 3 meses + tendência",
            'confiabilidade': tendencia_saldo.confiabilidade,
            'observacoes': ["Projeção baseada em tendência histórica", "Considerar fatores externos e sazonalidade"]
        }
    
    def _calcular_metricas_gerais(self, movimentacoes: List[MovimentacaoFinanceira]) -> Dict[str, Any]:
        """Calcula métricas gerais do fluxo de caixa"""
        creditos = [mov.credito for mov in movimentacoes]
        debitos = [mov.debito for mov in movimentacoes]
        saldos = [mov.saldo_operacional for mov in movimentacoes]
        
        return {
            'eficiencia_operacional': (sum(creditos) / sum(debitos)) * 100 if sum(debitos) > 0 else Decimal('0'),
            'margem_operacional_media': (sum(saldos) / sum(creditos)) * 100 if sum(creditos) > 0 else Decimal('0'),
            'crescimento_creditos': self._calcular_crescimento_periodo(creditos),
            'crescimento_debitos': self._calcular_crescimento_periodo(debitos),
            'estabilidade_saldo': Decimal('100') - self._calcular_coeficiente_variacao(saldos),
            'meses_superavit': len([s for s in saldos if s > 0]),
            'meses_deficit': len([s for s in saldos if s < 0])
        }
    
    def _calcular_crescimento_periodo(self, valores: List[Decimal]) -> Decimal:
        """Calcula crescimento entre primeiro e último período"""
        if len(valores) < 2 or valores[0] == 0:
            return Decimal('0')
        
        crescimento = ((valores[-1] - valores[0]) / valores[0]) * 100
        return crescimento.quantize(Decimal('0.1'))
    
    def _gerar_alertas_cashflow(self, movimentacoes: List[MovimentacaoFinanceira], 
                              meses_criticos: List[Dict]) -> List[Dict[str, Any]]:
        """Gera alertas baseados na análise do fluxo de caixa"""
        alertas = []
        
        # Alerta para meses consecutivos negativos
        meses_negativos_consecutivos = 0
        for mov in movimentacoes:
            if mov.saldo_operacional < 0:
                meses_negativos_consecutivos += 1
            else:
                meses_negativos_consecutivos = 0
                
            if meses_negativos_consecutivos >= 2:
                alertas.append({
                    'tipo': 'CRITICO',
                    'titulo': 'Meses Consecutivos com Saldo Negativo',
                    'descricao': f'Identificados {meses_negativos_consecutivos} meses consecutivos com saldo operacional negativo',
                    'impacto': 'Alto - Comprometimento do fluxo de caixa',
                    'acao_requerida': 'Revisão urgente da estrutura de custos e estratégia de receitas'
                })
                break
        
        # Alerta para alta volatilidade
        volatilidade = self._calcular_volatilidade_saldos(movimentacoes)
        media_saldos = sum(mov.saldo_operacional for mov in movimentacoes) / len(movimentacoes)
        if float(volatilidade) > abs(float(media_saldos)) * 0.5:
            alertas.append({
                'tipo': 'ATENCAO',
                'titulo': 'Alta Volatilidade no Fluxo de Caixa',
                'descricao': f'Volatilidade de {self.formatter.formatar_moeda(volatilidade, compacto=True)} indica instabilidade',
                'impacto': 'Médio - Dificuldade de planejamento financeiro',
                'acao_requerida': 'Implementar controles para reduzir flutuações'
            })
        
        return alertas
    
    def _gerar_recomendacoes_cashflow(self, tendencias: List[TendenciaFinanceira], 
                                    meses_criticos: List[Dict]) -> List[str]:
        """Gera recomendações baseadas na análise"""
        recomendacoes = []
        
        # Recomendações baseadas em tendências
        for tendencia in tendencias:
            if tendencia.direcao == TrendDirection.DECLINIO and tendencia.intensidade > 30:
                if 'Crédito' in tendencia.metrica:
                    recomendacoes.append(
                        f"📉 {tendencia.metrica}: Implementar ações para reversão da tendência de queda. "
                        f"Intensidade: {self.formatter.formatar_porcentagem(tendencia.intensidade)}"
                    )
                elif 'Saldo' in tendencia.metrica:
                    recomendacoes.append(
                        f"⚠️ {tendencia.metrica}: Urgente revisão de despesas para estabilizar saldo operacional"
                    )
        
        # Recomendações para meses críticos
        if meses_criticos:
            recomendacoes.append(
                f"🚨 Meses Críticos: {len(meses_criticos)} meses identificados com problemas. "
                f"Foco prioritário em: {meses_criticos[0]['periodo']}"
            )
        
        return recomendacoes
    
    def gerar_relatorio_cashflow(self, analise_cashflow: Dict[str, Any]) -> str:
        """Gera relatório formatado do fluxo de caixa"""
        relatorio = []
        relatorio.append("=" * 60)
        relatorio.append("💰 ANÁLISE DE FLUXO DE CAIXA")
        relatorio.append("=" * 60)
        relatorio.append("")
        
        resumo = analise_cashflow['resumo_mensal']
        
        # Resumo executivo
        relatorio.append("📊 RESUMO EXECUTIVO:")
        relatorio.append(f"   • Período: {analise_cashflow['periodo_analisado']}")  
        relatorio.append(f"   • Saldo Consolidado: {self.formatter.formatar_moeda(resumo['saldo_consolidado'], compacto=True)}")
        relatorio.append(f"   • Meses Positivos: {resumo['meses_positivos']}")
        relatorio.append(f"   • Meses Negativos: {resumo['meses_negativos']}")
        relatorio.append(f"   • Melhor Mês: {resumo['melhor_mes']['periodo']} ({self.formatter.formatar_moeda(resumo['melhor_mes']['saldo'], compacto=True)})")
        relatorio.append(f"   • Pior Mês: {resumo['pior_mes']['periodo']} ({self.formatter.formatar_moeda(resumo['pior_mes']['saldo'], compacto=True)})")
        relatorio.append("")
        
        # Meses críticos
        if analise_cashflow['meses_criticos']:
            relatorio.append("🚨 MESES CRÍTICOS:")
            for mes_critico in analise_cashflow['meses_criticos'][:3]:  # Top 3
                relatorio.append(f"   • {mes_critico['periodo']}:")
                relatorio.append(f"     Saldo: {self.formatter.formatar_moeda(mes_critico['saldo_operacional'], compacto=True)}")
                relatorio.append(f"     Problemas: {', '.join(mes_critico['problemas_identificados'])}")
                relatorio.append(f"     Prazo Ação: {mes_critico['recomendacao_prazo']}")
            relatorio.append("")
        
        # Tendências
        relatorio.append("📈 TENDÊNCIAS IDENTIFICADAS:")
        for tendencia in analise_cashflow['tendencias']:
            emoji_tendencia = {"CRESCIMENTO": "📈", "DECLÍNIO": "📉", "ESTÁVEL": "➡️"}.get(tendencia.direcao.value, "⚪")
            relatorio.append(f"   {emoji_tendencia} {tendencia.metrica}:")
            relatorio.append(f"      Direção: {tendencia.direcao.value}")
            relatorio.append(f"      Intensidade: {self.formatter.formatar_porcentagem(tendencia.intensidade)}")
            relatorio.append(f"      Confiabilidade: {self.formatter.formatar_porcentagem(tendencia.confiabilidade)}")
        relatorio.append("")
        
        # Recomendações
        if analise_cashflow['recomendacoes']:
            relatorio.append("💡 RECOMENDAÇÕES:")
            for rec in analise_cashflow['recomendacoes']:
                relatorio.append(f"   • {rec}")
            relatorio.append("")
        
        return "\n".join(relatorio)