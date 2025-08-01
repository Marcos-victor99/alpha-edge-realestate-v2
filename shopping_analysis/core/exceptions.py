"""
Exceções customizadas para o sistema de análise financeira.
Permite tratamento específico de erros e debugging melhorado.
"""


class ShoppingAnalysisError(Exception):
    """Exceção base para erros do sistema de análise"""
    pass


class DataValidationError(ShoppingAnalysisError):
    """Erro na validação de dados financeiros"""
    def __init__(self, field: str, value: any, message: str = None):
        self.field = field
        self.value = value
        self.message = message or f"Erro na validação do campo '{field}' com valor '{value}'"
        super().__init__(self.message)


class InsufficientDataError(ShoppingAnalysisError):
    """Erro quando não há dados suficientes para análise"""
    def __init__(self, analysis_type: str, minimum_required: int, actual: int):
        self.analysis_type = analysis_type
        self.minimum_required = minimum_required
        self.actual = actual
        message = (
            f"Dados insuficientes para análise '{analysis_type}'. "
            f"Mínimo necessário: {minimum_required}, atual: {actual}"
        )
        super().__init__(message)


class CalculationError(ShoppingAnalysisError):
    """Erro durante cálculos financeiros"""
    def __init__(self, calculation_type: str, details: str = None):
        self.calculation_type = calculation_type
        self.details = details
        message = f"Erro no cálculo '{calculation_type}'"
        if details:
            message += f": {details}"
        super().__init__(message)


class FormattingError(ShoppingAnalysisError):
    """Erro na formatação de valores brasileiros"""
    def __init__(self, value: any, format_type: str):
        self.value = value
        self.format_type = format_type
        message = f"Erro na formatação {format_type} do valor '{value}'"
        super().__init__(message)


class InsightGenerationError(ShoppingAnalysisError):
    """Erro na geração de insights automáticos"""
    def __init__(self, insight_type: str, data_source: str, details: str = None):
        self.insight_type = insight_type
        self.data_source = data_source
        self.details = details
        message = f"Erro na geração de insight '{insight_type}' a partir de '{data_source}'"
        if details:
            message += f": {details}"
        super().__init__(message)


class ReportGenerationError(ShoppingAnalysisError):
    """Erro na geração de relatórios"""
    def __init__(self, report_type: str, section: str = None):
        self.report_type = report_type
        self.section = section
        message = f"Erro na geração do relatório '{report_type}'"
        if section:
            message += f" na seção '{section}'"
        super().__init__(message)