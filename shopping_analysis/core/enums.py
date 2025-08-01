"""
Enumerações para classificações do sistema de análise financeira.
Baseado na arquitetura do projeto React/TypeScript com padrões brasileiros.
"""
from enum import Enum


class StatusKPI(str, Enum):
    """Status de classificação dos KPIs financeiros"""
    CRITICO = "CRÍTICO"
    ATENCAO = "ATENÇÃO"
    BOM = "BOM"
    EXCELENTE = "EXCELENTE"


class RiskLevel(str, Enum):
    """Níveis de risco para inadimplência e análises"""
    MUITO_ALTO = "MUITO_ALTO"
    ALTO = "ALTO"
    MEDIO = "MÉDIO"
    BAIXO = "BAIXO"
    MUITO_BAIXO = "MUITO_BAIXO"


class TrendDirection(str, Enum):
    """Direção das tendências financeiras"""
    CRESCIMENTO = "CRESCIMENTO"
    DECLINIO = "DECLÍNIO"
    ESTAVEL = "ESTÁVEL"
    VOLATIL = "VOLÁTIL"


class InsightType(str, Enum):
    """Tipos de insights gerados pelo sistema"""
    KPI = "KPI"
    FLUXO_CAIXA = "FLUXO_CAIXA"
    INADIMPLENCIA = "INADIMPLÊNCIA"
    TENDENCIA = "TENDÊNCIA"
    ORCAMENTO = "ORÇAMENTO"
    OPERACIONAL = "OPERACIONAL"


class InsightPriority(str, Enum):
    """Prioridade dos insights para classificação"""
    CRITICA = "CRÍTICA"
    ALTA = "ALTA"
    MEDIA = "MÉDIA"
    BAIXA = "BAIXA"


class DebtStatus(str, Enum):
    """Status das dívidas de inadimplentes"""
    CONFISSAO_DIVIDA = "CONFISSÃO_DE_DÍVIDA"
    EM_ATRASO = "EM_ATRASO"
    NEGOCIACAO = "NEGOCIAÇÃO"
    ACORDO = "ACORDO"
    QUITADO = "QUITADO"
    JURIDICO = "JURÍDICO"


class CashFlowType(str, Enum):
    """Tipos de movimentação no fluxo de caixa"""
    CREDITO = "CRÉDITO"
    DEBITO = "DÉBITO"
    SALDO_OPERACIONAL = "SALDO_OPERACIONAL"


class PeriodType(str, Enum):
    """Tipos de período para análise temporal"""
    MENSAL = "MENSAL"
    TRIMESTRAL = "TRIMESTRAL"
    SEMESTRAL = "SEMESTRAL"
    ANUAL = "ANUAL"