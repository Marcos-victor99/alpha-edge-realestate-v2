"""
Analisador de Tendências para Shopping Centers.
Identifica tendências, pontos críticos e padrões temporais nos dados financeiros.
"""
from decimal import Decimal
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
import statistics
from math import sqrt

from .kpi_analyzer import BaseAnalyzer
from ..core.models import MovimentacaoFinanceira, ConfiguracaoAnalise
from ..core.enums import TrendDirection, InsightType, InsightPriority, StatusKPI
from ..core.exceptions import CalculationError, InsufficientDataError
from ..formatters.brazilian import BrazilianFormatter


class TrendAnalyzer(BaseAnalyzer):
    """Analisador especializado em identificação de tendências financeiras"""
    
    def __init__(self, configuracao: Optional[ConfiguracaoAnalise] = None):
        super().__init__(configuracao)
        self.min_periodos_tendencia = 3  # Mínimo de períodos para identificar tendência
        self.threshold_volatilidade = Decimal('0.15')  # 15% de variação para alta volatilidade
        self.threshold_crescimento = Decimal('0.05')   # 5% de crescimento significativo
    
    def analisar(self, dados_temporais: List[Dict[str, Any]], tipo_analise: str = 'fluxo_caixa') -> Dict[str, Any]:
        """
        Analisa tendências em dados temporais.
        
        Args:
            dados_temporais: Lista de dados ordenados por período
            tipo_analise: Tipo de análise ('fluxo_caixa', 'kpis', 'inadimplencia')
            
        Returns:
            Dict com análise completa de tendências
        """
        try:
            if len(dados_temporais) < self.min_periodos_tendencia:
                raise InsufficientDataError("analise_tendencias", self.min_periodos_tendencia, len(dados_temporais))
            
            # Converter dados para formato padronizado
            series_temporais = self._converter_series_temporais(dados_temporais, tipo_analise)
            
            # Análises principais
            tendencia_geral = self._identificar_tendencia_geral(series_temporais)
            pontos_criticos = self._detectar_pontos_criticos(series_temporais)
            volatilidade = self._calcular_volatilidade(series_temporais)
            sazonalidade = self._analisar_sazonalidade(series_temporais)
            
            # Análises estatísticas avançadas
            correlacoes = self._analisar_correlacoes_temporais(series_temporais)
            previsoes = self._gerar_previsoes_simples(series_temporais)
            
            # Insights e recomendações
            insights_tendencia = self._gerar_insights_tendencia(
                tendencia_geral, pontos_criticos, volatilidade, sazonalidade
            )
            recomendacoes = self._gerar_recomendacoes_tendencia(
                tendencia_geral, pontos_criticos, volatilidade
            )
            
            return {
                'series_analisadas': series_temporais,
                'tendencia_geral': tendencia_geral,
                'pontos_criticos': pontos_criticos,
                'volatilidade': volatilidade,
                'sazonalidade': sazonalidade,
                'correlacoes_temporais': correlacoes,
                'previsoes': previsoes,
                'insights_tendencia': insights_tendencia,
                'recomendacoes': recomendacoes,
                'data_analise': datetime.now(),
                'periodos_analisados': len(series_temporais),
                'tipo_analise': tipo_analise
            }
            
        except Exception as e:
            raise CalculationError("analise_tendencias", str(e)) from e
    
    def _converter_series_temporais(self, dados: List[Dict[str, Any]], tipo: str) -> List[Dict[str, Any]]:
        """Converte dados brutos em séries temporais padronizadas"""
        series = []
        
        for i, periodo in enumerate(dados):
            try:
                # Determinar valor principal baseado no tipo de análise
                if tipo == 'fluxo_caixa':
                    valor = Decimal(str(periodo.get('saldo_operacional', 0)))
                    credito = Decimal(str(periodo.get('credito', 0)))
                    debito = Decimal(str(periodo.get('debito', 0)))
                    
                    item = {
                        'periodo': i + 1,
                        'mes': periodo.get('mes', f'Período {i+1}'),
                        'ano': periodo.get('ano', 2025),
                        'valor_principal': valor,
                        'credito': credito,
                        'debito': debito,
                        'data_periodo': f"{periodo.get('mes', f'P{i+1}')}/{periodo.get('ano', 2025)}"
                    }
                elif tipo == 'kpis':
                    # Para KPIs, usar receita total como principal
                    valor = Decimal(str(periodo.get('receita_total', periodo.get('valor', 0))))
                    item = {
                        'periodo': i + 1,
                        'valor_principal': valor,
                        'data_periodo': periodo.get('periodo', f'Período {i+1}')
                    }
                else:  # inadimplencia
                    valor = Decimal(str(periodo.get('valor_total', periodo.get('valor', 0))))
                    item = {
                        'periodo': i + 1,
                        'valor_principal': valor,
                        'data_periodo': periodo.get('periodo', f'Período {i+1}')
                    }
                
                series.append(item)
                
            except Exception as e:
                raise CalculationError(f"conversao_periodo_{i}", str(e)) from e
        
        return series
    
    def _identificar_tendencia_geral(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identifica tendência geral da série temporal"""
        valores = [item['valor_principal'] for item in series]
        n = len(valores)
        
        # Regressão linear simples
        x_medio = (n + 1) / 2
        y_medio = sum(valores) / n
        
        numerador = sum((i + 1 - x_medio) * (float(valores[i]) - float(y_medio)) for i in range(n))
        denominador = sum((i + 1 - x_medio) ** 2 for i in range(n))
        
        if denominador == 0:
            inclinacao = 0
        else:
            inclinacao = numerador / denominador
        
        intercepto = float(y_medio) - inclinacao * x_medio
        
        # Classificar tendência
        if abs(inclinacao) < 100:  # Ajustar threshold baseado nos dados
            direcao = TrendDirection.ESTAVEL
            intensidade = "BAIXA"
        elif inclinacao > 0:
            direcao = TrendDirection.CRESCIMENTO
            intensidade = "ALTA" if inclinacao > 1000 else "MODERADA"
        else:
            direcao = TrendDirection.DECLINIO
            intensidade = "ALTA" if inclinacao < -1000 else "MODERADA"
        
        # Calcular R²
        y_pred = [inclinacao * (i + 1) + intercepto for i in range(n)]
        ss_res = sum((float(valores[i]) - y_pred[i]) ** 2 for i in range(n))
        ss_tot = sum((float(valores[i]) - float(y_medio)) ** 2 for i in range(n))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        # Determinar confiabilidade
        if r_squared > 0.8:
            confiabilidade = "ALTA"
        elif r_squared > 0.5:
            confiabilidade = "MODERADA"
        else:
            confiabilidade = "BAIXA"
        
        return {
            'direcao': direcao,
            'intensidade': intensidade,
            'inclinacao': Decimal(str(inclinacao)).quantize(Decimal('0.01')),
            'intercepto': Decimal(str(intercepto)).quantize(Decimal('0.01')),
            'r_squared': Decimal(str(r_squared)).quantize(Decimal('0.001')),
            'confiabilidade': confiabilidade,
            'valor_inicial': valores[0],
            'valor_final': valores[-1],
            'variacao_total': valores[-1] - valores[0],
            'variacao_percentual': ((valores[-1] - valores[0]) / valores[0] * 100).quantize(Decimal('0.1')) if valores[0] != 0 else Decimal('0')
        }
    
    def _detectar_pontos_criticos(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detecta pontos críticos na série temporal"""
        valores = [item['valor_principal'] for item in series]
        
        # Encontrar máximos e mínimos locais
        maximos_locais = []
        minimos_locais = []
        
        for i in range(1, len(valores) - 1):
            if valores[i] > valores[i-1] and valores[i] > valores[i+1]:
                maximos_locais.append({
                    'periodo': i + 1,
                    'valor': valores[i],
                    'data_periodo': series[i]['data_periodo']
                })
            elif valores[i] < valores[i-1] and valores[i] < valores[i+1]:
                minimos_locais.append({
                    'periodo': i + 1,
                    'valor': valores[i],
                    'data_periodo': series[i]['data_periodo']
                })
        
        # Maior e menor valores absolutos
        max_absoluto = max(valores)
        min_absoluto = min(valores)
        idx_max = valores.index(max_absoluto)
        idx_min = valores.index(min_absoluto)
        
        # Detectar mudanças bruscas (>20% entre períodos consecutivos)
        mudancas_bruscas = []
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                variacao = abs((valores[i] - valores[i-1]) / valores[i-1] * 100)
                if variacao > 20:  # Mudança maior que 20%
                    mudancas_bruscas.append({
                        'periodo_anterior': i,
                        'periodo_atual': i + 1,
                        'valor_anterior': valores[i-1],
                        'valor_atual': valores[i],
                        'variacao_percentual': variacao.quantize(Decimal('0.1')),
                        'tipo': 'QUEDA' if valores[i] < valores[i-1] else 'ALTA'
                    })
        
        return {
            'maximo_absoluto': {
                'periodo': idx_max + 1,
                'valor': max_absoluto,
                'data_periodo': series[idx_max]['data_periodo']
            },
            'minimo_absoluto': {
                'periodo': idx_min + 1,
                'valor': min_absoluto,
                'data_periodo': series[idx_min]['data_periodo']
            },
            'maximos_locais': maximos_locais,
            'minimos_locais': minimos_locais,
            'mudancas_bruscas': mudancas_bruscas,
            'amplitude_total': max_absoluto - min_absoluto,
            'numero_pontos_criticos': len(maximos_locais) + len(minimos_locais) + len(mudancas_bruscas)
        }
    
    def _calcular_volatilidade(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcula métricas de volatilidade"""
        valores = [float(item['valor_principal']) for item in series]
        
        # Variações período a período
        variacoes = []
        for i in range(1, len(valores)):
            if valores[i-1] != 0:
                variacao = (valores[i] - valores[i-1]) / valores[i-1]
                variacoes.append(variacao)
        
        if not variacoes:
            return {
                'desvio_padrao': Decimal('0'),
                'coeficiente_variacao': Decimal('0'),
                'volatilidade_media': Decimal('0'),
                'classificacao': 'DADOS_INSUFICIENTES'
            }
        
        # Métricas estatísticas
        media_valores = sum(valores) / len(valores)
        desvio_padrao = Decimal(str(sqrt(sum((v - media_valores) ** 2 for v in valores) / len(valores))))
        coeficiente_variacao = (desvio_padrao / Decimal(str(media_valores))) * 100 if media_valores != 0 else Decimal('0')
        
        volatilidade_media = Decimal(str(sum(abs(v) for v in variacoes) / len(variacoes)))
        
        # Classificar volatilidade
        if volatilidade_media > self.threshold_volatilidade:
            classificacao = "ALTA"
        elif volatilidade_media > self.threshold_volatilidade / 2:
            classificacao = "MODERADA"
        else:
            classificacao = "BAIXA"
        
        return {
            'desvio_padrao': desvio_padrao.quantize(Decimal('0.01')),
            'coeficiente_variacao': coeficiente_variacao.quantize(Decimal('0.1')),
            'volatilidade_media': volatilidade_media.quantize(Decimal('0.003')),
            'classificacao': classificacao,
            'numero_variacoes_significativas': len([v for v in variacoes if abs(v) > float(self.threshold_volatilidade)]),
            'maior_variacao_positiva': max(variacoes) if variacoes else 0,
            'maior_variacao_negativa': min(variacoes) if variacoes else 0
        }
    
    def _analisar_sazonalidade(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analisa padrões sazonais nos dados"""
        # Para uma análise simples, verificar se há padrões por mês
        valores_por_mes = {}
        
        for item in series:
            mes = item.get('mes', f"P{item['periodo']}")
            if mes not in valores_por_mes:
                valores_por_mes[mes] = []
            valores_por_mes[mes].append(float(item['valor_principal']))
        
        # Calcular médias por mês
        medias_mensais = {}
        for mes, valores in valores_por_mes.items():
            medias_mensais[mes] = sum(valores) / len(valores)
        
        # Identificar mês com melhor e pior performance
        if medias_mensais:
            melhor_mes = max(medias_mensais.keys(), key=lambda k: medias_mensais[k])
            pior_mes = min(medias_mensais.keys(), key=lambda k: medias_mensais[k])
            
            # Calcular amplitude sazonal
            amplitude_sazonal = medias_mensais[melhor_mes] - medias_mensais[pior_mes]
            
            return {
                'medias_por_periodo': {mes: Decimal(str(media)).quantize(Decimal('0.01')) 
                                     for mes, media in medias_mensais.items()},
                'melhor_periodo': melhor_mes,
                'pior_periodo': pior_mes,
                'valor_melhor_periodo': Decimal(str(medias_mensais[melhor_mes])).quantize(Decimal('0.01')),
                'valor_pior_periodo': Decimal(str(medias_mensais[pior_mes])).quantize(Decimal('0.01')),
                'amplitude_sazonal': Decimal(str(amplitude_sazonal)).quantize(Decimal('0.01')),
                'tem_sazonalidade': amplitude_sazonal > (sum(medias_mensais.values()) / len(medias_mensais)) * 0.2
            }
        
        return {
            'medias_por_periodo': {},
            'tem_sazonalidade': False
        }
    
    def _analisar_correlacoes_temporais(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analisa correlações entre períodos consecutivos"""
        valores = [float(item['valor_principal']) for item in series]
        
        if len(valores) < 2:
            return {'correlacao_lag1': Decimal('0'), 'autocorrelacao': 'INDEFINIDA'}
        
        # Correlação lag-1 (período atual vs anterior)
        valores_atual = valores[1:]
        valores_anterior = valores[:-1]
        
        if len(valores_atual) == 0:
            return {'correlacao_lag1': Decimal('0'), 'autocorrelacao': 'INDEFINIDA'}
        
        # Calcular correlação de Pearson simples
        n = len(valores_atual)
        media_atual = sum(valores_atual) / n
        media_anterior = sum(valores_anterior) / n
        
        numerador = sum((valores_atual[i] - media_atual) * (valores_anterior[i] - media_anterior) for i in range(n))
        denominador_atual = sum((v - media_atual) ** 2 for v in valores_atual)
        denominador_anterior = sum((v - media_anterior) ** 2 for v in valores_anterior)
        
        if denominador_atual == 0 or denominador_anterior == 0:
            correlacao = 0
        else:
            correlacao = numerador / sqrt(denominador_atual * denominador_anterior)
        
        # Classificar autocorrelação
        if abs(correlacao) > 0.7:
            autocorrelacao = "FORTE"
        elif abs(correlacao) > 0.3:
            autocorrelacao = "MODERADA"
        else:
            autocorrelacao = "FRACA"
        
        return {
            'correlacao_lag1': Decimal(str(correlacao)).quantize(Decimal('0.003')),
            'autocorrelacao': autocorrelacao,
            'direcao_correlacao': 'POSITIVA' if correlacao > 0 else 'NEGATIVA'
        }
    
    def _gerar_previsoes_simples(self, series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Gera previsões simples baseadas na tendência"""
        if len(series) < 3:
            return {'previsoes_disponiveis': False}
        
        valores = [float(item['valor_principal']) for item in series]
        
        # Previsão por média móvel simples (últimos 3 períodos)
        media_movel = sum(valores[-3:]) / 3
        
        # Previsão por tendência linear
        n = len(valores)
        x_values = list(range(1, n + 1))
        y_values = valores
        
        x_medio = sum(x_values) / n
        y_medio = sum(y_values) / n
        
        numerador = sum((x_values[i] - x_medio) * (y_values[i] - y_medio) for i in range(n))
        denominador = sum((x - x_medio) ** 2 for x in x_values)
        
        if denominador != 0:
            inclinacao = numerador / denominador
            intercepto = y_medio - inclinacao * x_medio
            previsao_linear = inclinacao * (n + 1) + intercepto
        else:
            previsao_linear = y_medio
        
        return {
            'previsoes_disponiveis': True,
            'proximo_periodo_media_movel': Decimal(str(media_movel)).quantize(Decimal('0.01')),
            'proximo_periodo_tendencia_linear': Decimal(str(previsao_linear)).quantize(Decimal('0.01')),
            'cenario_conservador': min(media_movel, previsao_linear),
            'cenario_otimista': max(media_movel, previsao_linear),
            'confiabilidade_previsao': 'BAIXA' if len(series) < 6 else 'MODERADA'
        }
    
    def _gerar_insights_tendencia(self, tendencia: Dict[str, Any], pontos_criticos: Dict[str, Any], 
                                volatilidade: Dict[str, Any], sazonalidade: Dict[str, Any]) -> List[str]:
        """Gera insights baseados na análise de tendências"""
        insights = []
        
        # Insight sobre tendência geral
        if tendencia['direcao'] == TrendDirection.CRESCIMENTO:
            insights.append(f"📈 TENDÊNCIA POSITIVA: Crescimento de {self.formatter.formatar_porcentagem(tendencia['variacao_percentual'])} no período analisado")
        elif tendencia['direcao'] == TrendDirection.DECLINIO:
            insights.append(f"📉 TENDÊNCIA NEGATIVA: Declínio de {self.formatter.formatar_porcentagem(abs(tendencia['variacao_percentual']))} no período analisado")
        else:
            insights.append("📊 TENDÊNCIA ESTÁVEL: Variação mínima observada no período")
        
        # Insight sobre volatilidade
        if volatilidade['classificacao'] == 'ALTA':
            insights.append(f"⚡ ALTA VOLATILIDADE: Coeficiente de variação de {self.formatter.formatar_porcentagem(volatilidade['coeficiente_variacao'])}")
        
        # Insight sobre pontos críticos
        if len(pontos_criticos['mudancas_bruscas']) > 0:
            maior_mudanca = max(pontos_criticos['mudancas_bruscas'], key=lambda x: x['variacao_percentual'])
            insights.append(f"🚨 MUDANÇA BRUSCA DETECTADA: {maior_mudanca['tipo']} de {self.formatter.formatar_porcentagem(maior_mudanca['variacao_percentual'])} no período {maior_mudanca['periodo_atual']}")
        
        # Insight sobre sazonalidade
        if sazonalidade.get('tem_sazonalidade', False):
            insights.append(f"📅 PADRÃO SAZONAL: Melhor performance em {sazonalidade['melhor_periodo']}, pior em {sazonalidade['pior_periodo']}")
        
        return insights
    
    def _gerar_recomendacoes_tendencia(self, tendencia: Dict[str, Any], pontos_criticos: Dict[str, Any], 
                                     volatilidade: Dict[str, Any]) -> List[str]:
        """Gera recomendações baseadas na análise de tendências"""
        recomendacoes = []
        
        # Recomendações baseadas na tendência
        if tendencia['direcao'] == TrendDirection.DECLINIO and tendencia['intensidade'] == 'ALTA':
            recomendacoes.append("🔴 AÇÃO URGENTE: Tendência de declínio acentuado detectada. Implementar medidas corretivas imediatas.")
        elif tendencia['direcao'] == TrendDirection.CRESCIMENTO:
            recomendacoes.append("🟢 APROVEITAR MOMENTUM: Tendência positiva identificada. Considerar investimentos para acelerar crescimento.")
        
        # Recomendações baseadas na volatilidade
        if volatilidade['classificacao'] == 'ALTA':
            recomendacoes.append("⚖️ GESTÃO DE RISCO: Alta volatilidade detectada. Implementar controles de risco e monitoramento contínuo.")
        
        # Recomendações baseadas em pontos críticos
        if len(pontos_criticos['mudancas_bruscas']) > 2:
            recomendacoes.append("📊 MONITORAMENTO INTENSIVO: Múltiplas mudanças bruscas detectadas. Revisar processos operacionais.")
        
        # Recomendação sobre previsibilidade
        if tendencia['confiabilidade'] == 'BAIXA':
            recomendacoes.append("🔍 ANÁLISE APROFUNDADA: Padrão pouco previsível. Coletar mais dados para melhor compreensão.")
        
        return recomendacoes
    
    def gerar_relatorio_tendencias(self, analise_tendencias: Dict[str, Any]) -> str:
        """Gera relatório formatado de análise de tendências"""
        relatorio = []
        relatorio.append("=" * 60)
        relatorio.append("📈 ANÁLISE DE TENDÊNCIAS")
        relatorio.append("=" * 60)
        relatorio.append("")
        
        tendencia = analise_tendencias['tendencia_geral']
        volatilidade = analise_tendencias['volatilidade']
        pontos_criticos = analise_tendencias['pontos_criticos']
        
        # Tendência geral
        relatorio.append("📊 TENDÊNCIA GERAL:")
        relatorio.append(f"   • Direção: {tendencia['direcao'].value}")
        relatorio.append(f"   • Intensidade: {tendencia['intensidade']}")
        relatorio.append(f"   • Variação Total: {self.formatter.formatar_porcentagem(tendencia['variacao_percentual'])}")
        relatorio.append(f"   • Confiabilidade: {tendencia['confiabilidade']} (R² = {tendencia['r_squared']})")
        relatorio.append("")
        
        # Volatilidade
        relatorio.append("⚡ VOLATILIDADE:")
        relatorio.append(f"   • Classificação: {volatilidade['classificacao']}")
        relatorio.append(f"   • Coeficiente de Variação: {self.formatter.formatar_porcentagem(volatilidade['coeficiente_variacao'])}")
        relatorio.append(f"   • Variações Significativas: {volatilidade['numero_variacoes_significativas']}")
        relatorio.append("")
        
        # Pontos críticos
        relatorio.append("🔍 PONTOS CRÍTICOS:")
        relatorio.append(f"   • Máximo: {self.formatter.formatar_moeda(pontos_criticos['maximo_absoluto']['valor'], compacto=True)} ({pontos_criticos['maximo_absoluto']['data_periodo']})")
        relatorio.append(f"   • Mínimo: {self.formatter.formatar_moeda(pontos_criticos['minimo_absoluto']['valor'], compacto=True)} ({pontos_criticos['minimo_absoluto']['data_periodo']})")
        relatorio.append(f"   • Mudanças Bruscas: {len(pontos_criticos['mudancas_bruscas'])}")
        relatorio.append("")
        
        # Insights
        if analise_tendencias['insights_tendencia']:
            relatorio.append("💡 INSIGHTS:")
            for insight in analise_tendencias['insights_tendencia']:
                relatorio.append(f"   • {insight}")
            relatorio.append("")
        
        # Recomendações
        if analise_tendencias['recomendacoes']:
            relatorio.append("🎯 RECOMENDAÇÕES:")
            for rec in analise_tendencias['recomendacoes']:
                relatorio.append(f"   • {rec}")
            relatorio.append("")
        
        return "\n".join(relatorio)