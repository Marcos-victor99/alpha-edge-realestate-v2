"""
Formatadores brasileiros para valores financeiros.
Inspirado nos formatadores do projeto React/TypeScript (src/lib/formatters.ts).
"""
import locale
from decimal import Decimal
from datetime import datetime
from typing import Union, Optional, Tuple
from ..core.enums import StatusKPI, RiskLevel
from ..core.exceptions import FormattingError


# Configurar locale brasileiro (fallback para padrão se não disponível)
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
    except locale.Error:
        # Fallback para locale C se não encontrar brasileiro
        locale.setlocale(locale.LC_ALL, 'C')


class BrazilianFormatter:
    """Classe principal para formatação brasileira de valores financeiros"""
    
    @staticmethod
    def formatar_moeda(valor: Union[Decimal, float, int], compacto: bool = False) -> str:
        """
        Formata valores monetários em Real brasileiro.
        
        Args:
            valor: Valor a ser formatado
            compacto: Se True, usa formato compacto (1.2M, 850K)
            
        Returns:
            String formatada (ex: "R$ 1.234.567,89" ou "R$ 1.2M")
        """
        try:
            valor_decimal = Decimal(str(valor))
            
            if compacto:
                return BrazilianFormatter._formatar_moeda_compacta(valor_decimal)
            
            # Formatar com locale brasileiro
            if valor_decimal >= 0:
                formatado = f"R$ {valor_decimal:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            else:
                valor_abs = abs(valor_decimal)
                formatado = f"-R$ {valor_abs:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            return formatado
            
        except (ValueError, TypeError) as e:
            raise FormattingError(valor, "moeda") from e
    
    @staticmethod
    def _formatar_moeda_compacta(valor: Decimal) -> str:
        """Formata moeda em formato compacto"""
        valor_abs = abs(valor)
        sinal = "-" if valor < 0 else ""
        
        if valor_abs >= 1_000_000_000:
            return f"{sinal}R$ {valor_abs / 1_000_000_000:.1f}B"
        elif valor_abs >= 1_000_000:
            return f"{sinal}R$ {valor_abs / 1_000_000:.1f}M"
        elif valor_abs >= 1_000:
            return f"{sinal}R$ {valor_abs / 1_000:.1f}K"
        else:
            return f"{sinal}R$ {valor_abs:.2f}".replace('.', ',')
    
    @staticmethod
    def formatar_data(data: Union[datetime, str], formato: str = "dd/mm/yyyy") -> str:
        """
        Formata datas no padrão brasileiro.
        
        Args:
            data: Data a ser formatada
            formato: Formato desejado
            
        Returns:
            String formatada (ex: "15/01/2025")
        """
        try:
            if isinstance(data, str):
                # Tentar converter string para datetime
                data = datetime.fromisoformat(data.replace('Z', '+00:00'))
            
            if formato == "dd/mm/yyyy":
                return data.strftime("%d/%m/%Y")
            elif formato == "dd/mm/yyyy hh:mm":
                return data.strftime("%d/%m/%Y %H:%M")
            elif formato == "mmm/yyyy":
                meses = {
                    1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
                    7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
                }
                return f"{meses[data.month]}/{data.year}"
            else:
                return data.strftime(formato)
                
        except (ValueError, AttributeError) as e:
            raise FormattingError(data, "data") from e
    
    @staticmethod
    def formatar_porcentagem(valor: Union[Decimal, float], casas_decimais: int = 1) -> str:
        """
        Formata porcentagens no padrão brasileiro.
        
        Args:
            valor: Valor percentual (ex: 12.5 para 12.5%)
            casas_decimais: Número de casas decimais
            
        Returns:
            String formatada (ex: "12,5%")
        """
        try:
            valor_decimal = Decimal(str(valor))
            formatado = f"{valor_decimal:.{casas_decimais}f}%".replace('.', ',')
            return formatado
            
        except (ValueError, TypeError) as e:
            raise FormattingError(valor, "porcentagem") from e
    
    @staticmethod
    def formatar_variacao(valor: Union[Decimal, float], incluir_sinal: bool = True) -> dict:
        """
        Formata variações percentuais com classificação de tipo.
        
        Args:
            valor: Valor da variação
            incluir_sinal: Se True, inclui sinal + ou -
            
        Returns:
            Dict com 'texto', 'tipo' e 'cor'
        """
        try:
            valor_decimal = Decimal(str(valor))
            
            # Determinar tipo e cor
            if valor_decimal > 0:
                tipo = "positivo"
                cor = "#10B981"  # Verde
                sinal = "+" if incluir_sinal else ""
            elif valor_decimal < 0:
                tipo = "negativo"
                cor = "#EF4444"  # Vermelho
                sinal = ""  # O sinal negativo já está no número
            else:
                tipo = "neutro"
                cor = "#6B7280"  # Cinza
                sinal = ""
            
            texto = f"{sinal}{BrazilianFormatter.formatar_porcentagem(valor_decimal)}"
            
            return {
                "texto": texto,
                "tipo": tipo,
                "cor": cor,
                "valor_numerico": float(valor_decimal)
            }
            
        except (ValueError, TypeError) as e:
            raise FormattingError(valor, "variacao") from e
    
    @staticmethod
    def formatar_noi(valor: Union[Decimal, float]) -> str:
        """
        Formata Net Operating Income (NOI) específico.
        
        Args:
            valor: Valor do NOI
            
        Returns:
            String formatada com indicação de NOI
        """
        try:
            return f"NOI {BrazilianFormatter.formatar_moeda(valor, compacto=True)}"
        except Exception as e:
            raise FormattingError(valor, "NOI") from e
    
    @staticmethod
    def classificar_status_kpi(valor: Union[Decimal, float], thresholds: dict) -> Tuple[StatusKPI, str]:
        """
        Classifica o status de um KPI baseado em thresholds.
        
        Args:
            valor: Valor do KPI
            thresholds: Dict com limites {'critico': x, 'atencao': y, 'bom': z}
            
        Returns:
            Tuple com (StatusKPI, descrição)
        """
        try:
            valor_decimal = Decimal(str(valor))
            
            if valor_decimal <= thresholds.get('critico', 0):
                return StatusKPI.CRITICO, "Necessita atenção imediata"
            elif valor_decimal <= thresholds.get('atencao', 50):
                return StatusKPI.ATENCAO, "Requer monitoramento"
            elif valor_decimal <= thresholds.get('bom', 80):
                return StatusKPI.BOM, "Dentro do esperado"
            else:
                return StatusKPI.EXCELENTE, "Acima das expectativas"
                
        except (ValueError, TypeError, KeyError) as e:
            raise FormattingError(valor, "classificacao_kpi") from e
    
    @staticmethod
    def classificar_risco_inadimplencia(valor_divida: Union[Decimal, float], dias_atraso: int = 0) -> RiskLevel:
        """
        Classifica o risco de inadimplência baseado em valor e tempo.
        
        Args:
            valor_divida: Valor da dívida
            dias_atraso: Dias em atraso
            
        Returns:
            RiskLevel correspondente
        """
        try:
            valor_decimal = Decimal(str(valor_divida))
            
            # Algoritmo de classificação baseado em valor e tempo
            if valor_decimal >= 50000 or dias_atraso >= 90:
                return RiskLevel.MUITO_ALTO
            elif valor_decimal >= 20000 or dias_atraso >= 60:
                return RiskLevel.ALTO
            elif valor_decimal >= 5000 or dias_atraso >= 30:
                return RiskLevel.MEDIO
            elif valor_decimal >= 1000 or dias_atraso >= 15:
                return RiskLevel.BAIXO
            else:
                return RiskLevel.MUITO_BAIXO
                
        except (ValueError, TypeError) as e:
            raise FormattingError(valor_divida, "classificacao_risco") from e
    
    @staticmethod
    def formatar_ranking(posicao: int, total: int, nome: str, valor: Union[Decimal, float]) -> str:
        """
        Formata entrada de ranking.
        
        Args:
            posicao: Posição no ranking (1-based)
            total: Total de itens
            nome: Nome do item
            valor: Valor associado
            
        Returns:
            String formatada para ranking
        """
        try:
            valor_formatado = BrazilianFormatter.formatar_moeda(valor, compacto=True)
            return f"{posicao}º/{total} - {nome}: {valor_formatado}"
            
        except Exception as e:
            raise FormattingError(f"{nome}:{valor}", "ranking") from e
    
    @staticmethod
    def formatar_periodo_brasileiro(mes: str, ano: int) -> str:
        """
        Formata período no padrão brasileiro.
        
        Args:
            mes: Nome do mês
            ano: Ano
            
        Returns:
            String formatada (ex: "Janeiro/2025")
        """
        meses_mapping = {
            'janeiro': 'Janeiro', 'jan': 'Janeiro',
            'fevereiro': 'Fevereiro', 'fev': 'Fevereiro',
            'março': 'Março', 'mar': 'Março', 'marco': 'Março',
            'abril': 'Abril', 'abr': 'Abril',
            'maio': 'Maio', 'mai': 'Maio',
            'junho': 'Junho', 'jun': 'Junho',
            'julho': 'Julho', 'jul': 'Julho',
            'agosto': 'Agosto', 'ago': 'Agosto',
            'setembro': 'Setembro', 'set': 'Setembro',
            'outubro': 'Outubro', 'out': 'Outubro',
            'novembro': 'Novembro', 'nov': 'Novembro',
            'dezembro': 'Dezembro', 'dez': 'Dezembro'
        }
        
        mes_normalizado = meses_mapping.get(mes.lower(), mes.capitalize())
        return f"{mes_normalizado}/{ano}"


# Funções de conveniência para uso direto
def formatar_moeda(valor: Union[Decimal, float, int], compacto: bool = False) -> str:
    """Função de conveniência para formatação de moeda"""
    return BrazilianFormatter.formatar_moeda(valor, compacto)


def formatar_data(data: Union[datetime, str], formato: str = "dd/mm/yyyy") -> str:
    """Função de conveniência para formatação de data"""
    return BrazilianFormatter.formatar_data(data, formato)


def formatar_porcentagem(valor: Union[Decimal, float], casas_decimais: int = 1) -> str:
    """Função de conveniência para formatação de porcentagem"""
    return BrazilianFormatter.formatar_porcentagem(valor, casas_decimais)


def formatar_variacao(valor: Union[Decimal, float], incluir_sinal: bool = True) -> dict:
    """Função de conveniência para formatação de variação"""
    return BrazilianFormatter.formatar_variacao(valor, incluir_sinal)