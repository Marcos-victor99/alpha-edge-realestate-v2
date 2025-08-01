"""
Gerador de Relatórios Executivos para Shopping Centers.
Consolida todas as análises em relatório final estruturado em português brasileiro.
"""
import json
from decimal import Decimal
from typing import List, Dict, Optional, Any
from datetime import datetime

from ..core.models import RelatorioExecutivo, InsightFinanceiro, ConfiguracaoAnalise
from ..core.enums import InsightPriority, StatusKPI
from ..core.exceptions import ReportGenerationError
from ..formatters.brazilian import BrazilianFormatter


class ReportGenerator:
    """Gerador principal de relatórios executivos consolidados"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        self.configuracao = configuracao or ConfiguracaoAnalise()
        self.formatter = BrazilianFormatter()
    
    def gerar_relatorio_completo(self, dados_analises: Dict[str, Any], 
                               shopping_center: str = "Shopping Park Botucatu") -> RelatorioExecutivo:
        """
        Gera relatório executivo completo baseado em todas as análises.
        
        Args:
            dados_analises: Dict com resultados de todas as análises
            shopping_center: Nome do shopping center
            
        Returns:
            RelatorioExecutivo completo
        """
        try:
            # Extrair dados das análises
            analise_kpis = dados_analises.get('analise_kpis', {})
            analise_cashflow = dados_analises.get('analise_cashflow', {})
            analise_inadimplencia = dados_analises.get('analise_inadimplencia', {})
            insights = dados_analises.get('insights', [])
            
            # Determinar período de referência
            periodo_referencia = self._determinar_periodo_referencia(dados_analises)
            
            # Criar relatório estruturado
            relatorio = RelatorioExecutivo(
                titulo=f"Relatório Executivo Financeiro - {shopping_center}",
                shopping_center=shopping_center,
                periodo_referencia=periodo_referencia,
                
                # Dados consolidados
                kpis_principais=self._extrair_kpis_principais(analise_kpis),
                fluxo_caixa=self._extrair_fluxo_caixa(analise_cashflow),
                maiores_inadimplentes=self._extrair_maiores_inadimplentes(analise_inadimplencia),
                insights_criticos=self._extrair_insights_criticos(insights),
                tendencias=self._extrair_tendencias(dados_analises),
                
                # Resumo executivo
                resumo_executivo=self._gerar_resumo_executivo(dados_analises),
                recomendacoes_priorizadas=self._extrair_recomendacoes_priorizadas(insights),
                score_saude_financeira=self._calcular_score_geral(dados_analises)
            )
            
            return relatorio
            
        except Exception as e:
            raise ReportGenerationError("relatorio_completo", str(e)) from e
    
    def _determinar_periodo_referencia(self, dados_analises: Dict[str, Any]) -> str:
        """Determina período de referência baseado nos dados disponíveis"""
        try:
            # Tentar extrair período do cashflow
            cashflow = dados_analises.get('analise_cashflow', {})
            if 'periodo_analisado' in cashflow:
                return cashflow['periodo_analisado']
            
            # Fallback para período baseado em movimentações
            movimentacoes = cashflow.get('movimentacoes_analisadas', [])
            if movimentacoes:
                primeiro = movimentacoes[0].periodo_completo
                ultimo = movimentacoes[-1].periodo_completo
                return f"{primeiro} - {ultimo}"
            
            # Fallback para data atual
            return f"Análise de {self.formatter.formatar_data(datetime.now(), 'mmm/yyyy')}"
            
        except Exception:
            return "Período não determinado"
    
    def _extrair_kpis_principais(self, analise_kpis: Dict[str, Any]) -> List:
        """Extrai KPIs principais da análise"""
        if not analise_kpis or 'kpis_analisados' not in analise_kpis:
            return []
        
        return analise_kpis['kpis_analisados']
    
    def _extrair_fluxo_caixa(self, analise_cashflow: Dict[str, Any]) -> List:
        """Extrai dados de fluxo de caixa da análise"""
        if not analise_cashflow or 'movimentacoes_analisadas' not in analise_cashflow:
            return []
        
        return analise_cashflow['movimentacoes_analisadas']
    
    def _extrair_maiores_inadimplentes(self, analise_inadimplencia: Dict[str, Any]) -> List:
        """Extrai maiores inadimplentes da análise"""
        if not analise_inadimplencia or 'inadimplentes_analisados' not in analise_inadimplencia:
            return []
        
        inadimplentes = analise_inadimplencia['inadimplentes_analisados']
        # Retornar os 10 maiores ordenados por valor
        return sorted(inadimplentes, key=lambda x: x.valor_divida, reverse=True)[:10]
    
    def _extrair_insights_criticos(self, insights: List[InsightFinanceiro]) -> List[InsightFinanceiro]:
        """Extrai apenas insights críticos"""
        if not insights:
            return []
        
        return [i for i in insights if i.prioridade == InsightPriority.CRITICA]
    
    def _extrair_tendencias(self, dados_analises: Dict[str, Any]) -> List:
        """Extrai tendências de todas as análises"""
        tendencias = []
        
        # Tendências do cashflow
        cashflow = dados_analises.get('analise_cashflow', {})
        if 'tendencias' in cashflow:
            tendencias.extend(cashflow['tendencias'])
        
        # Tendências poderiam vir de outras análises também
        # (TrendAnalyzer quando implementado)
        
        return tendencias
    
    def _gerar_resumo_executivo(self, dados_analises: Dict[str, Any]) -> Dict[str, Any]:
        """Gera resumo executivo consolidado"""
        resumo = {
            'situacao_geral': 'Indefinida',
            'principais_desafios': [],
            'oportunidades_identificadas': [],
            'metricas_consolidadas': {},
            'status_geral': 'Em Análise'
        }
        
        try:
            # Avaliar situação geral baseada nos KPIs
            analise_kpis = dados_analises.get('analise_kpis', {})
            score_saude = analise_kpis.get('score_saude_financeira', 0)
            
            if score_saude < 30:
                resumo['situacao_geral'] = 'Crítica - Requer intervenção imediata'
                resumo['status_geral'] = 'CRÍTICO'
            elif score_saude < 60:
                resumo['situacao_geral'] = 'Preocupante - Necessita monitoramento próximo'
                resumo['status_geral'] = 'ATENÇÃO'
            elif score_saude < 80:
                resumo['situacao_geral'] = 'Estável - Algumas melhorias necessárias'
                resumo['status_geral'] = 'BOM'
            else:
                resumo['situacao_geral'] = 'Excelente - Performance acima da média'
                resumo['status_geral'] = 'EXCELENTE'
            
            # Identificar principais desafios
            if analise_kpis.get('kpis_criticos'):
                resumo['principais_desafios'].append('KPIs financeiros em estado crítico')
            
            cashflow = dados_analises.get('analise_cashflow', {})
            if cashflow.get('meses_criticos'):
                resumo['principais_desafios'].append('Meses com saldo operacional negativo')
            
            inadimplencia = dados_analises.get('analise_inadimplencia', {})
            if inadimplencia:
                concentracao = inadimplencia.get('concentracao_dividas', {})
                if concentracao.get('concentracao_top3', 0) > 60:
                    resumo['principais_desafios'].append('Alta concentração de inadimplência')
            
            # Identificar oportunidades
            if cashflow.get('resumo_mensal', {}).get('meses_positivos', 0) > 0:
                resumo['oportunidades_identificadas'].append('Meses com performance positiva identificados')
            
            if inadimplencia:
                recuperacao = inadimplencia.get('impacto_financeiro', {}).get('potencial_recuperacao', {})
                if recuperacao.get('cenario_otimista', 0) > 0:
                    resumo['oportunidades_identificadas'].append('Potencial de recuperação de crédito significativo')
            
            # Métricas consolidadas
            resumo['metricas_consolidadas'] = {
                'score_saude_financeira': float(score_saude),
                'total_kpis_analisados': analise_kpis.get('total_kpis', 0),
                'kpis_criticos': len(analise_kpis.get('kpis_criticos', [])),
                'meses_analisados': len(cashflow.get('movimentacoes_analisadas', [])),
                'total_inadimplentes': inadimplencia.get('total_inadimplentes', 0) if inadimplencia else 0,
                'insights_gerados': len(dados_analises.get('insights', []))
            }
            
        except Exception as e:
            resumo['observacoes'] = f"Erro na geração do resumo: {str(e)}"
        
        return resumo
    
    def _extrair_recomendacoes_priorizadas(self, insights: List[InsightFinanceiro]) -> List[str]:
        """Extrai e prioriza recomendações de todos os insights"""
        recomendacoes = []
        
        # Priorizar recomendações dos insights críticos
        insights_criticos = [i for i in insights if i.prioridade == InsightPriority.CRITICA]
        for insight in insights_criticos:
            if insight.recomendacoes:
                # Adicionar as 2 primeiras recomendações de cada insight crítico
                recomendacoes.extend(insight.recomendacoes[:2])
        
        # Adicionar recomendações de insights de alta prioridade se necessário
        if len(recomendacoes) < 8:
            insights_altos = [i for i in insights if i.prioridade == InsightPriority.ALTA]
            for insight in insights_altos:
                if len(recomendacoes) >= 10:
                    break
                if insight.recomendacoes:
                    recomendacoes.append(insight.recomendacoes[0])
        
        # Remover duplicatas mantendo ordem
        recomendacoes_unicas = []
        for rec in recomendacoes:
            if rec not in recomendacoes_unicas:
                recomendacoes_unicas.append(rec)
        
        return recomendacoes_unicas[:10]  # Máximo 10 recomendações
    
    def _calcular_score_geral(self, dados_analises: Dict[str, Any]) -> Optional[Decimal]:
        """Calcula score geral de saúde financeira"""
        try:
            analise_kpis = dados_analises.get('analise_kpis', {})
            score_kpis = analise_kpis.get('score_saude_financeira', 0)
            
            # Por enquanto, usar score dos KPIs como base
            # Futuramente, incorporar outros fatores
            return Decimal(str(score_kpis)).quantize(Decimal('0.1'))
            
        except Exception:
            return None
    
    def gerar_relatorio_texto(self, relatorio: RelatorioExecutivo) -> str:
        """Gera relatório em formato texto estruturado"""
        try:
            texto = []
            
            # Cabeçalho
            texto.append("=" * 80)
            texto.append(f"📊 {relatorio.titulo.upper()}")
            texto.append("=" * 80)
            texto.append(f"Shopping Center: {relatorio.shopping_center}")
            texto.append(f"Período de Referência: {relatorio.periodo_referencia}")
            texto.append(f"Data de Geração: {self.formatter.formatar_data(relatorio.data_geracao, 'dd/mm/yyyy hh:mm')}")
            
            if relatorio.score_saude_financeira:
                texto.append(f"Score de Saúde Financeira: {self.formatter.formatar_porcentagem(relatorio.score_saude_financeira)}")
            
            texto.append("")
            
            # Resumo Executivo
            texto.append("🎯 RESUMO EXECUTIVO")
            texto.append("-" * 50)
            resumo = relatorio.resumo_executivo
            texto.append(f"Situação Geral: {resumo.get('situacao_geral', 'Não avaliada')}")
            texto.append("")
            
            # Principais Desafios
            desafios = resumo.get('principais_desafios', [])
            if desafios:
                texto.append("🚨 PRINCIPAIS DESAFIOS:")
                for i, desafio in enumerate(desafios, 1):
                    texto.append(f"   {i}. {desafio}")
                texto.append("")
            
            # Oportunidades
            oportunidades = resumo.get('oportunidades_identificadas', [])
            if oportunidades:
                texto.append("💡 OPORTUNIDADES IDENTIFICADAS:")
                for i, oportunidade in enumerate(oportunidades, 1):
                    texto.append(f"   {i}. {oportunidade}")
                texto.append("")
            
            # KPIs Principais
            if relatorio.kpis_principais:
                texto.append("📈 INDICADORES FINANCEIROS PRINCIPAIS")
                texto.append("-" * 50)
                for kpi in relatorio.kpis_principais:
                    emoji_status = self._obter_emoji_status(kpi.status)
                    valor_formatado = self._formatar_valor_kpi(kpi)
                    texto.append(f"{emoji_status} {kpi.nome}: {valor_formatado} ({kpi.status.value})")
                    if kpi.observacoes:
                        texto.append(f"   Observação: {kpi.observacoes}")
                texto.append("")
            
            # Fluxo de Caixa - Resumo
            if relatorio.fluxo_caixa:
                texto.append("💰 FLUXO DE CAIXA - RESUMO")
                texto.append("-" * 50)
                
                # Calcular totais
                total_creditos = sum(mov.credito for mov in relatorio.fluxo_caixa)
                total_debitos = sum(mov.debito for mov in relatorio.fluxo_caixa)
                saldo_total = sum(mov.saldo_operacional for mov in relatorio.fluxo_caixa)
                
                texto.append(f"Total de Créditos: {self.formatter.formatar_moeda(total_creditos, compacto=True)}")
                texto.append(f"Total de Débitos: {self.formatter.formatar_moeda(total_debitos, compacto=True)}")
                texto.append(f"Saldo Consolidado: {self.formatter.formatar_moeda(saldo_total, compacto=True)}")
                
                # Melhor e pior mês
                melhor_mes = max(relatorio.fluxo_caixa, key=lambda x: x.saldo_operacional)
                pior_mes = min(relatorio.fluxo_caixa, key=lambda x: x.saldo_operacional)
                
                texto.append(f"Melhor Mês: {melhor_mes.periodo_completo} ({self.formatter.formatar_moeda(melhor_mes.saldo_operacional, compacto=True)})")
                texto.append(f"Pior Mês: {pior_mes.periodo_completo} ({self.formatter.formatar_moeda(pior_mes.saldo_operacional, compacto=True)})")
                texto.append("")
            
            # Maiores Inadimplentes
            if relatorio.maiores_inadimplentes:
                texto.append("⚠️  TOP 5 MAIORES INADIMPLENTES")
                texto.append("-" * 50)
                for i, inadimplente in enumerate(relatorio.maiores_inadimplentes[:5], 1):
                    valor_formatado = self.formatter.formatar_moeda(inadimplente.valor_divida, compacto=True)
                    texto.append(f"{i}º. {inadimplente.nome}: {valor_formatado}")
                    texto.append(f"    Status: {inadimplente.status.value} | Risco: {inadimplente.risco.value}")
                texto.append("")
            
            # Insights Críticos
            if relatorio.insights_criticos:
                texto.append("🧠 INSIGHTS CRÍTICOS")
                texto.append("-" * 50)
                for i, insight in enumerate(relatorio.insights_criticos, 1):
                    texto.append(f"{i}. {insight.titulo}")
                    texto.append(f"   {insight.descricao}")
                    if insight.valor_impacto:
                        texto.append(f"   Impacto Estimado: {self.formatter.formatar_moeda(insight.valor_impacto, compacto=True)}")
                    if insight.recomendacoes:
                        texto.append(f"   Ação Principal: {insight.recomendacoes[0]}")
                    texto.append("")
            
            # Recomendações Priorizadas
            if relatorio.recomendacoes_priorizadas:
                texto.append("🎯 RECOMENDAÇÕES PRIORITÁRIAS")
                texto.append("-" * 50)
                for i, recomendacao in enumerate(relatorio.recomendacoes_priorizadas, 1):
                    texto.append(f"{i}. {recomendacao}")
                texto.append("")
            
            # Rodapé
            texto.append("=" * 80)
            texto.append("📋 Relatório gerado automaticamente pelo Sistema de Análise Financeira")
            texto.append(f"🏢 {relatorio.shopping_center} - {self.formatter.formatar_data(datetime.now(), 'dd/mm/yyyy')}")
            texto.append("=" * 80)
            
            return "\n".join(texto)
            
        except Exception as e:
            raise ReportGenerationError("relatorio_texto", str(e)) from e
    
    def gerar_relatorio_json(self, relatorio: RelatorioExecutivo) -> str:
        """Gera relatório em formato JSON estruturado"""
        try:
            # Converter Decimal e outros tipos para JSON serializable
            relatorio_dict = self._converter_para_json_serializable(relatorio.dict())
            
            return json.dumps(relatorio_dict, indent=2, ensure_ascii=False)
            
        except Exception as e:
            raise ReportGenerationError("relatorio_json", str(e)) from e
    
    def _converter_para_json_serializable(self, obj: Any) -> Any:
        """Converte objetos para tipos serializáveis em JSON"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: self._converter_para_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._converter_para_json_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):
            return self._converter_para_json_serializable(obj.__dict__)
        else:
            return obj
    
    def _obter_emoji_status(self, status: StatusKPI) -> str:
        """Retorna emoji correspondente ao status do KPI"""
        emojis = {
            StatusKPI.CRITICO: "🔴",
            StatusKPI.ATENCAO: "🟡",
            StatusKPI.BOM: "🟢",
            StatusKPI.EXCELENTE: "🌟"
        }
        return emojis.get(status, "⚪")
    
    def _formatar_valor_kpi(self, kpi) -> str:
        """Formata valor do KPI conforme sua unidade"""
        if kpi.unidade == 'R$':
            return self.formatter.formatar_moeda(kpi.valor, compacto=True)
        elif kpi.unidade == '%':
            return self.formatter.formatar_porcentagem(kpi.valor)
        else:
            return str(kpi.valor)
    
    def salvar_relatorio(self, relatorio: RelatorioExecutivo, 
                        formato: str = "texto", 
                        caminho: Optional[str] = None) -> str:
        """
        Salva relatório em arquivo.
        
        Args:
            relatorio: Relatório a ser salvo
            formato: 'texto' ou 'json'
            caminho: Caminho do arquivo (opcional)
            
        Returns:
            Caminho do arquivo salvo
        """
        try:
            if not caminho:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                extensao = "txt" if formato == "texto" else "json"
                caminho = f"relatorio_financeiro_{timestamp}.{extensao}"
            
            if formato == "texto":
                conteudo = self.gerar_relatorio_texto(relatorio)
            elif formato == "json":
                conteudo = self.gerar_relatorio_json(relatorio)
            else:
                raise ValueError(f"Formato não suportado: {formato}")
            
            with open(caminho, 'w', encoding='utf-8') as arquivo:
                arquivo.write(conteudo)
            
            return caminho
            
        except Exception as e:
            raise ReportGenerationError("salvar_relatorio", str(e)) from e