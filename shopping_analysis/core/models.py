"""
Modelos Pydantic para dados financeiros do sistema de análise.
Baseado nos dados reais do Shopping Park Botucatu com validação robusta.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from .enums import (
    StatusKPI, RiskLevel, TrendDirection, InsightType, 
    InsightPriority, DebtStatus, CashFlowType, PeriodType
)


class KPIFinanceiro(BaseModel):
    """Modelo para KPIs financeiros principais"""
    nome: str = Field(..., description="Nome do KPI")
    valor: Decimal = Field(..., description="Valor numérico do KPI")
    unidade: str = Field(..., description="Unidade (R$, %, unidade)")
    status: StatusKPI = Field(..., description="Status de classificação")
    meta: Optional[Decimal] = Field(None, description="Meta estabelecida")
    variacao_percentual: Optional[Decimal] = Field(None, description="Variação % em relação à meta ou período anterior")
    observacoes: Optional[str] = Field(None, description="Observações adicionais")
    data_referencia: datetime = Field(default_factory=datetime.now, description="Data de referência do KPI")

    @validator('valor')
    def validar_valor(cls, v):
        if v < 0 and "saldo" not in cls.__name__.lower():
            raise ValueError("KPIs não podem ter valores negativos (exceto saldos)")
        return v

    @validator('variacao_percentual')
    def validar_variacao(cls, v):
        if v is not None and abs(v) > 1000:
            raise ValueError("Variação percentual muito alta, verificar dados")
        return v


class MovimentacaoFinanceira(BaseModel):
    """Modelo para movimentações do fluxo de caixa"""
    mes: str = Field(..., description="Mês da movimentação (ex: 'Maio')")
    ano: int = Field(..., description="Ano da movimentação")
    credito: Decimal = Field(..., description="Valor de créditos")
    debito: Decimal = Field(..., description="Valor de débitos")
    saldo_operacional: Decimal = Field(..., description="Saldo operacional do mês")
    tipo_periodo: PeriodType = Field(PeriodType.MENSAL, description="Tipo do período")

    @validator('credito', 'debito')
    def validar_movimentacoes(cls, v):
        if v < 0:
            raise ValueError("Valores de crédito e débito devem ser positivos")
        return v

    @property
    def saldo_calculado(self) -> Decimal:
        """Calcula o saldo baseado em crédito - débito"""
        return self.credito - self.debito

    @property
    def periodo_completo(self) -> str:
        """Retorna o período completo formatado"""
        return f"{self.mes}/{self.ano}"


class Inadimplente(BaseModel):
    """Modelo para dados de inadimplentes"""
    nome: str = Field(..., description="Nome do inadimplente")
    valor_divida: Decimal = Field(..., description="Valor da dívida em R$")
    status: DebtStatus = Field(..., description="Status da dívida")
    dias_atraso: Optional[int] = Field(None, description="Dias em atraso")
    categoria: Optional[str] = Field(None, description="Categoria do estabelecimento")
    observacoes: Optional[str] = Field(None, description="Observações sobre a dívida")
    data_vencimento: Optional[datetime] = Field(None, description="Data de vencimento original")
    ultima_negociacao: Optional[datetime] = Field(None, description="Data da última negociação")
    risco: Optional[RiskLevel] = Field(None, description="Nível de risco calculado")

    @validator('valor_divida')
    def validar_valor_divida(cls, v):
        if v <= 0:
            raise ValueError("Valor da dívida deve ser positivo")
        return v

    @validator('dias_atraso')
    def validar_dias_atraso(cls, v):
        if v is not None and v < 0:
            raise ValueError("Dias em atraso não podem ser negativos")
        return v

    @property
    def percentual_inadimplencia(self) -> Decimal:
        """Calcula impacto percentual (necessita total geral)"""
        # Será calculado no analyzer com dados completos
        return Decimal('0.0')


class InsightFinanceiro(BaseModel):
    """Modelo para insights gerados automaticamente"""
    tipo: InsightType = Field(..., description="Tipo do insight")
    titulo: str = Field(..., description="Título do insight")
    descricao: str = Field(..., description="Descrição detalhada")
    prioridade: InsightPriority = Field(..., description="Prioridade do insight")
    valor_impacto: Optional[Decimal] = Field(None, description="Valor de impacto financeiro")
    recomendacoes: List[str] = Field(default_factory=list, description="Lista de recomendações")
    metricas_relacionadas: Dict[str, Any] = Field(default_factory=dict, description="Métricas relacionadas")
    data_geracao: datetime = Field(default_factory=datetime.now, description="Data de geração do insight")
    score_confianca: Optional[Decimal] = Field(None, description="Score de confiança (0-100)")

    @validator('score_confianca')
    def validar_score(cls, v):
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Score de confiança deve estar entre 0 e 100")
        return v


class TendenciaFinanceira(BaseModel):
    """Modelo para análise de tendências"""
    metrica: str = Field(..., description="Nome da métrica analisada")
    direcao: TrendDirection = Field(..., description="Direção da tendência")
    intensidade: Decimal = Field(..., description="Intensidade da tendência (0-100)")
    periodo_analise: str = Field(..., description="Período analisado")
    pontos_criticos: List[str] = Field(default_factory=list, description="Pontos críticos identificados")
    previsao_proximos_meses: Optional[Dict[str, Decimal]] = Field(None, description="Previsão para próximos meses")
    confiabilidade: Decimal = Field(..., description="Confiabilidade da análise (0-100)")

    @validator('intensidade', 'confiabilidade')
    def validar_percentuais(cls, v):
        if not (0 <= v <= 100):
            raise ValueError("Valores devem estar entre 0 e 100")
        return v


class RelatorioExecutivo(BaseModel):
    """Modelo para o relatório executivo completo"""
    titulo: str = Field(..., description="Título do relatório")
    shopping_center: str = Field(..., description="Nome do shopping center")
    periodo_referencia: str = Field(..., description="Período de referência")
    data_geracao: datetime = Field(default_factory=datetime.now, description="Data de geração")
    
    # Seções do relatório
    kpis_principais: List[KPIFinanceiro] = Field(..., description="KPIs principais")
    fluxo_caixa: List[MovimentacaoFinanceira] = Field(..., description="Dados de fluxo de caixa")
    maiores_inadimplentes: List[Inadimplente] = Field(..., description="Maiores inadimplentes")
    insights_criticos: List[InsightFinanceiro] = Field(..., description="Insights críticos")
    tendencias: List[TendenciaFinanceira] = Field(..., description="Análises de tendência")
    
    # Métricas consolidadas
    resumo_executivo: Dict[str, Any] = Field(default_factory=dict, description="Resumo executivo")
    recomendacoes_priorizadas: List[str] = Field(default_factory=list, description="Recomendações priorizadas")
    score_saude_financeira: Optional[Decimal] = Field(None, description="Score geral de saúde financeira")

    @validator('score_saude_financeira')
    def validar_score_saude(cls, v):
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Score de saúde financeira deve estar entre 0 e 100")
        return v


class ConfiguracaoAnalise(BaseModel):
    """Configurações para personalizar as análises"""
    thresholds_kpi: Dict[str, Dict[str, Decimal]] = Field(default_factory=dict, description="Thresholds para classificação de KPIs")
    metas_mensais: Optional[Dict[str, Decimal]] = Field(None, description="Metas mensais")
    categorias_priorizadas: List[str] = Field(default_factory=list, description="Categorias com prioridade de análise")
    incluir_previsoes: bool = Field(True, description="Incluir análises preditivas")
    nivel_detalhamento: str = Field("completo", description="Nível de detalhamento (resumido, completo, detalhado)")
    formato_saida: str = Field("json", description="Formato de saída (json, texto, html)")

    class Config:
        schema_extra = {
            "example": {
                "thresholds_kpi": {
                    "taxa_inadimplencia": {"critico": 50, "atencao": 20, "bom": 10},
                    "saldo_operacional": {"critico": 0, "atencao": 100000, "bom": 500000}
                },
                "categorias_priorizadas": ["alimentacao", "vestuario", "servicos"],
                "incluir_previsoes": True,
                "nivel_detalhamento": "completo"
            }
        }