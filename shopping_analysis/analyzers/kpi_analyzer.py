"""
Analisador de KPIs financeiros para Shopping Centers.
Baseado nos dados reais do Shopping Park Botucatu.
"""
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import List, Dict, Optional, Any
from datetime import datetime

from ..core.models import KPIFinanceiro, ConfiguracaoAnalise
from ..core.enums import StatusKPI, InsightType, InsightPriority
from ..core.exceptions import CalculationError, InsufficientDataError
from ..formatters.brazilian import BrazilianFormatter


class BaseAnalyzer(ABC):
    """Classe base abstrata para todos os analisadores"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        self.configuracao = configuracao or ConfiguracaoAnalise()
        self.formatter = BrazilianFormatter()
    
    @abstractmethod
    def analisar(self, dados: Any) -> Dict[str, Any]:
        """Método abstrato para análise"""
        pass


class KPIAnalyzer(BaseAnalyzer):
    """Analisador especializado em KPIs financeiros"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        super().__init__(configuracao)
        self.thresholds_padrao = {
            'receita_total': {'critico': 10000000, 'atencao': 15000000, 'bom': 20000000},
            'taxa_inadimplencia': {'critico': 50, 'atencao': 20, 'bom': 10},  # Invertido (menor é melhor)
            'saldo_operacional': {'critico': 0, 'atencao': 1000000, 'bom': 2000000},
            'saldo_projetado': {'critico': 0, 'atencao': 2000000, 'bom': 4000000},
            'despesa_total': {'critico': 20000000, 'atencao': 15000000, 'bom': 10000000},  # Invertido
            'recebidos_atraso': {'critico': 200, 'atencao': 100, 'bom': 50}  # Invertido
        }
    
    def analisar(self, dados_kpis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa os KPIs financeiros principais.
        
        Args:
            dados_kpis: Dict com os dados dos KPIs
            
        Returns:
            Dict com análise completa dos KPIs
        """
        try:
            kpis_analisados = []
            resumo_status = {"critico": 0, "atencao": 0, "bom": 0, "excelente": 0}
            
            # Analisar cada KPI individualmente
            for nome_kpi, valor in dados_kpis.items():
                kpi_analise = self._analisar_kpi_individual(nome_kpi, valor)
                kpis_analisados.append(kpi_analise)
                
                # Contar status para resumo
                status_lower = kpi_analise.status.value.lower()
                if status_lower in resumo_status:
                    resumo_status[status_lower] += 1
            
            # Calcular score geral de saúde financeira
            score_saude = self._calcular_score_saude_financeira(kpis_analisados)
            
            # Identificar KPIs críticos
            kpis_criticos = [kpi for kpi in kpis_analisados if kpi.status == StatusKPI.CRITICO]
            
            # Gerar recomendações específicas
            recomendacoes = self._gerar_recomendacoes_kpis(kpis_analisados)
            
            return {
                'kpis_analisados': kpis_analisados,
                'resumo_status': resumo_status,
                'score_saude_financeira': score_saude,
                'kpis_criticos': kpis_criticos,
                'total_kpis': len(kpis_analisados),
                'recomendacoes': recomendacoes,
                'data_analise': datetime.now(),
                'prioridades_acao': self._priorizar_acoes(kpis_criticos)
            }
            
        except Exception as e:
            raise CalculationError("analise_kpis", str(e)) from e
    
    def _analisar_kpi_individual(self, nome: str, valor: Any) -> KPIFinanceiro:
        """Analisa um KPI individual"""
        try:
            valor_decimal = Decimal(str(valor))
            nome_normalizado = nome.lower().replace(' ', '_')
            
            # Obter thresholds específicos
            thresholds = self.configuracao.thresholds_kpi.get(
                nome_normalizado, 
                self.thresholds_padrao.get(nome_normalizado, {})
            )
            
            # Determinar status baseado no tipo de KPI
            status, observacao = self._classificar_status_kpi(nome_normalizado, valor_decimal, thresholds)
            
            # Determinar unidade
            unidade = self._determinar_unidade_kpi(nome_normalizado)
            
            # Calcular variação se houver meta
            meta = self._obter_meta_kpi(nome_normalizado)
            variacao = None
            if meta:
                variacao = ((valor_decimal - meta) / meta) * 100
            
            return KPIFinanceiro(
                nome=nome.replace('_', ' ').title(),
                valor=valor_decimal,
                unidade=unidade,
                status=status,
                meta=meta,
                variacao_percentual=variacao,
                observacoes=observacao,
                data_referencia=datetime.now()
            )
            
        except Exception as e:
            raise CalculationError(f"analise_kpi_{nome}", str(e)) from e
    
    def _classificar_status_kpi(self, nome_kpi: str, valor: Decimal, thresholds: Dict) -> tuple:
        """Classifica o status de um KPI específico"""
        if not thresholds:
            return StatusKPI.BOM, "Thresholds não configurados"
        
        # KPIs onde menor valor é melhor (invertidos)
        kpis_invertidos = ['taxa_inadimplencia', 'despesa_total', 'recebidos_atraso']
        
        if nome_kpi in kpis_invertidos:
            # Para KPIs invertidos, usar lógica contrária
            if valor >= thresholds.get('critico', float('inf')):
                return StatusKPI.CRITICO, "Valor muito alto, requer ação imediata"
            elif valor >= thresholds.get('atencao', float('inf')):
                return StatusKPI.ATENCAO, "Valor acima do ideal, monitorar"
            elif valor >= thresholds.get('bom', float('inf')):
                return StatusKPI.BOM, "Valor dentro do aceitável"
            else:
                return StatusKPI.EXCELENTE, "Valor excelente"
        else:
            # Para KPIs normais, maior valor é melhor
            if valor <= thresholds.get('critico', 0):
                return StatusKPI.CRITICO, "Valor muito baixo, requer ação imediata"
            elif valor <= thresholds.get('atencao', 0):
                return StatusKPI.ATENCAO, "Valor abaixo do ideal, monitorar"
            elif valor <= thresholds.get('bom', 0):
                return StatusKPI.BOM, "Valor dentro do esperado"
            else:
                return StatusKPI.EXCELENTE, "Valor acima das expectativas"
    
    def _determinar_unidade_kpi(self, nome_kpi: str) -> str:
        """Determina a unidade apropriada para cada KPI"""
        unidades = {
            'receita_total': 'R$',
            'taxa_inadimplencia': '%',
            'saldo_operacional': 'R$',
            'saldo_projetado': 'R$',
            'despesa_total': 'R$',
            'recebidos_atraso': '%'
        }
        return unidades.get(nome_kpi, 'unidade')
    
    def _obter_meta_kpi(self, nome_kpi: str) -> Optional[Decimal]:
        """Obtém a meta estabelecida para o KPI"""
        if not self.configuracao.metas_mensais:
            return None
        return self.configuracao.metas_mensais.get(nome_kpi)
    
    def _calcular_score_saude_financeira(self, kpis: List[KPIFinanceiro]) -> Decimal:
        """Calcula score geral de saúde financeira (0-100)"""
        if not kpis:
            return Decimal('0')
        
        # Pesos para cada status
        pesos_status = {
            StatusKPI.CRITICO: 0,
            StatusKPI.ATENCAO: 25,
            StatusKPI.BOM: 70,
            StatusKPI.EXCELENTE: 100
        }
        
        total_pontos = sum(pesos_status.get(kpi.status, 0) for kpi in kpis)
        score = Decimal(total_pontos) / Decimal(len(kpis))
        
        return score.quantize(Decimal('0.1'))
    
    def _gerar_recomendacoes_kpis(self, kpis: List[KPIFinanceiro]) -> List[str]:
        """Gera recomendações específicas baseadas nos KPIs"""
        recomendacoes = []
        
        for kpi in kpis:
            if kpi.status == StatusKPI.CRITICO:
                if 'inadimplência' in kpi.nome.lower():
                    recomendacoes.append(
                        f"🚨 {kpi.nome}: Implementar estratégia urgente de recuperação de crédito. "
                        f"Taxa atual de {self.formatter.formatar_porcentagem(kpi.valor)} está crítica."
                    )
                elif 'receita' in kpi.nome.lower():
                    recomendacoes.append(
                        f"📉 {kpi.nome}: Revisar estratégia comercial e campanhas de marketing. "
                        f"Valor atual de {self.formatter.formatar_moeda(kpi.valor, compacto=True)} abaixo do esperado."
                    )
                elif 'saldo' in kpi.nome.lower():
                    recomendacoes.append(
                        f"💰 {kpi.nome}: Urgente revisão do fluxo de caixa. "
                        f"Saldo de {self.formatter.formatar_moeda(kpi.valor, compacto=True)} requer atenção imediata."
                    )
            
            elif kpi.status == StatusKPI.ATENCAO:
                recomendacoes.append(
                    f"⚠️ {kpi.nome}: Monitorar de perto e implementar ações preventivas. "
                    f"Valor atual: {self._formatar_valor_kpi(kpi)}"
                )
        
        return recomendacoes
    
    def _formatar_valor_kpi(self, kpi: KPIFinanceiro) -> str:
        """Formata o valor do KPI conforme sua unidade"""
        if kpi.unidade == 'R$':
            return self.formatter.formatar_moeda(kpi.valor, compacto=True)
        elif kpi.unidade == '%':
            return self.formatter.formatar_porcentagem(kpi.valor)
        else:
            return str(kpi.valor)
    
    def _priorizar_acoes(self, kpis_criticos: List[KPIFinanceiro]) -> List[Dict[str, Any]]:
        """Prioriza ações baseadas na criticidade e impacto"""
        acoes_priorizadas = []
        
        # Ordenar por impacto (valor absoluto para KPIs em R$)
        kpis_ordenados = sorted(
            kpis_criticos, 
            key=lambda k: abs(k.valor) if k.unidade == 'R$' else k.valor, 
            reverse=True
        )
        
        for i, kpi in enumerate(kpis_ordenados, 1):
            acao = {
                'prioridade': i,
                'kpi': kpi.nome,
                'valor_atual': self._formatar_valor_kpi(kpi),
                'impacto_estimado': self._calcular_impacto_financeiro(kpi),
                'prazo_sugerido': self._sugerir_prazo_acao(kpi),
                'responsavel_sugerido': self._sugerir_responsavel(kpi)
            }
            acoes_priorizadas.append(acao)
        
        return acoes_priorizadas
    
    def _calcular_impacto_financeiro(self, kpi: KPIFinanceiro) -> str:
        """Calcula o impacto financeiro potencial"""
        if kpi.unidade == 'R$':
            return f"Alto - {self.formatter.formatar_moeda(abs(kpi.valor), compacto=True)}"
        elif 'inadimplência' in kpi.nome.lower():
            return "Muito Alto - Impacta fluxo de caixa diretamente"
        else:
            return "Médio - Monitoramento necessário"
    
    def _sugerir_prazo_acao(self, kpi: KPIFinanceiro) -> str:
        """Sugere prazo para ação baseado na criticidade"""
        if 'inadimplência' in kpi.nome.lower():
            return "0-15 dias"
        elif 'saldo' in kpi.nome.lower() and kpi.valor <= 0:
            return "0-7 dias"
        else:
            return "15-30 dias"
    
    def _sugerir_responsavel(self, kpi: KPIFinanceiro) -> str:
        """Sugere responsável pela ação"""
        if 'inadimplência' in kpi.nome.lower():
            return "Gerência Financeira + Jurídico"
        elif 'receita' in kpi.nome.lower():
            return "Gerência Comercial + Marketing"
        elif 'despesa' in kpi.nome.lower():
            return "Gerência Administrativa"
        else:
            return "Diretoria Executiva"
    
    def gerar_relatorio_kpis(self, analise_kpis: Dict[str, Any]) -> str:
        """Gera relatório formatado dos KPIs"""
        relatorio = []
        relatorio.append("=" * 60)
        relatorio.append("📊 ANÁLISE DE KPIs FINANCEIROS")
        relatorio.append("=" * 60)
        relatorio.append("")
        
        # Resumo geral
        resumo = analise_kpis['resumo_status']
        score = analise_kpis['score_saude_financeira']
        
        relatorio.append("🎯 RESUMO EXECUTIVO:")
        relatorio.append(f"   • Score de Saúde Financeira: {score}/100")
        relatorio.append(f"   • KPIs Críticos: {resumo['critico']}")
        relatorio.append(f"   • KPIs em Atenção: {resumo['atencao']}")
        relatorio.append(f"   • KPIs Bons/Excelentes: {resumo['bom'] + resumo['excelente']}")
        relatorio.append("")
        
        # Detalhamento dos KPIs
        relatorio.append("📈 DETALHAMENTO DOS KPIs:")
        for kpi in analise_kpis['kpis_analisados']:
            emoji = self._obter_emoji_status(kpi.status)
            valor_formatado = self._formatar_valor_kpi(kpi)
            
            relatorio.append(f"   {emoji} {kpi.nome}:")
            relatorio.append(f"      Valor: {valor_formatado}")
            relatorio.append(f"      Status: {kpi.status.value}")
            if kpi.observacoes:
                relatorio.append(f"      Observação: {kpi.observacoes}")
            relatorio.append("")
        
        # Recomendações
        if analise_kpis['recomendacoes']:
            relatorio.append("💡 RECOMENDAÇÕES PRIORITÁRIAS:")
            for rec in analise_kpis['recomendacoes']:
                relatorio.append(f"   • {rec}")
            relatorio.append("")
        
        return "\n".join(relatorio)
    
    def _obter_emoji_status(self, status: StatusKPI) -> str:
        """Retorna emoji correspondente ao status"""
        emojis = {
            StatusKPI.CRITICO: "🔴",
            StatusKPI.ATENCAO: "🟡",
            StatusKPI.BOM: "🟢",
            StatusKPI.EXCELENTE: "🌟"
        }
        return emojis.get(status, "⚪")