# 🔄 Estratégia de Rollback - Dashboard Financeiro

## 🚨 Detecção de Problemas em Produção

### Monitoramento Sentry
1. **Alertas Automáticos**: Configurados para errors de import/componente
2. **Tags Específicas**: `error_type: 'import_error'`, `component_type: 'dashboard'`
3. **Threshold**: Mais de 5 erros similares em 10 minutos
4. **Notificação**: Email/Slack imediato para equipe de desenvolvimento

### Sinais de Alerta
- White screen em dashboards
- Erros JavaScript no console
- Componentes não renderizando
- Performance degradada (>3s carregamento)

## 🔧 Estratégias de Rollback

### 1. Rollback Git Completo (Mais Seguro)
```bash
# Identificar commit estável anterior
git log --oneline -10

# Fazer rollback para commit específico
git reset --hard <commit-hash-estavel>

# Force push (apenas em emergência)
git push --force-with-lease origin main

# Rebuild e redeploy
npm run build
# Deploy para produção
```

### 2. Rollback Seletivo de Componente
```bash
# Reverter apenas arquivos específicos
git checkout <commit-hash-estavel> -- src/components/Dashboard/InadimplenciaDashboard.tsx

# Commit da correção
git add .
git commit -m "fix: reverter InadimplenciaDashboard para versão estável"

# Deploy apenas do componente afetado
npm run build
```

### 3. Fallback de Componente (Código)
```tsx
// ErrorBoundary com fallback automático
import { Component, ReactNode } from 'react';

class DashboardErrorBoundary extends Component {
  state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log para Sentry
    console.error('Dashboard Error:', error, errorInfo);
    
    // Reportar para Sentry com contexto
    Sentry.captureException(error, {
      tags: { component: 'dashboard', rollback_needed: true },
      extra: { errorInfo, timestamp: new Date().toISOString() }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Dashboard Temporariamente Indisponível
          </h3>
          <p className="text-red-600 mb-4">
            Detectamos um problema técnico. Nossa equipe foi notificada.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. Feature Flags (Prevenção)
```tsx
// Implementar feature flags para dashboards
const DASHBOARD_FEATURES = {
  inadimplencia: import.meta.env.VITE_ENABLE_INADIMPLENCIA_DASHBOARD !== 'false',
  financial: import.meta.env.VITE_ENABLE_FINANCIAL_DASHBOARD !== 'false',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS_DASHBOARD !== 'false'
};

// Uso condicional
{DASHBOARD_FEATURES.inadimplencia && <InadimplenciaDashboard />}
```

## ⏱️ Cronograma de Ação

### 0-5 minutos (Resposta Imediata)
1. ✅ Confirmar problema via Sentry/monitoramento
2. ✅ Avaliar impacto (quantos usuários afetados)
3. ✅ Decidir entre rollback completo vs seletivo
4. ✅ Comunicar ao time via Slack

### 5-15 minutos (Execução)
1. ✅ Executar rollback escolhido
2. ✅ Verificar build local
3. ✅ Deploy para produção
4. ✅ Verificar funcionamento

### 15-30 minutos (Validação)
1. ✅ Monitorar erros no Sentry
2. ✅ Testar manualmente dashboards
3. ✅ Confirmar métricas de performance
4. ✅ Comunicar resolução

## 🛠️ Scripts de Rollback Automático

### Script de Rollback Rápido
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 INICIANDO ROLLBACK DE EMERGÊNCIA"

# Buscar último commit estável (tagged)
LAST_STABLE=$(git describe --tags --abbrev=0)
echo "📍 Último commit estável: $LAST_STABLE"

# Confirmar rollback
read -p "Confirmar rollback para $LAST_STABLE? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# Fazer rollback
git reset --hard $LAST_STABLE
echo "✅ Rollback executado"

# Build e validação
echo "🔨 Rebuilding..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido"
    echo "🚀 Pronto para deploy"
else
    echo "❌ Build falhou - verificar manualmente"
    exit 1
fi
```

### Rollback Seletivo por Dashboard
```bash
#!/bin/bash
# scripts/rollback-dashboard.sh

DASHBOARD=$1
if [ -z "$DASHBOARD" ]; then
    echo "Uso: ./rollback-dashboard.sh [inadimplencia|financial|overview|analytics]"
    exit 1
fi

DASHBOARD_FILE="src/components/Dashboard/${DASHBOARD^}Dashboard.tsx"

# Buscar último commit estável do arquivo
LAST_COMMIT=$(git log -1 --format="%H" --grep="stable" -- $DASHBOARD_FILE)

if [ -z "$LAST_COMMIT" ]; then
    echo "❌ Não foi possível encontrar commit estável para $DASHBOARD"
    exit 1
fi

echo "🔄 Revertendo $DASHBOARD_FILE para commit $LAST_COMMIT"

# Reverter arquivo específico
git checkout $LAST_COMMIT -- $DASHBOARD_FILE

# Commit da correção
git add $DASHBOARD_FILE
git commit -m "fix: rollback $DASHBOARD dashboard para versão estável"

echo "✅ Rollback de $DASHBOARD concluído"
```

## 📞 Plano de Comunicação

### Canais de Comunicação
1. **Slack #tech-alerts**: Notificação imediata
2. **Email equipe**: Resumo pós-resolução
3. **Status page**: Se múltiplos usuários afetados
4. **Post-mortem**: Análise detalhada em 24h

### Template de Comunicação
```
🚨 INCIDENT ALERT - Dashboard Error

**Status**: RESOLVED ✅
**Duration**: 12 minutes
**Impact**: Inadimplência dashboard unavailable
**Root Cause**: Missing icon import in component
**Resolution**: Rollback to stable version + hotfix deployed

**Timeline**:
17:23 - Issue detected via Sentry alerts
17:25 - Rollback initiated
17:28 - Fix deployed and verified
17:35 - Monitoring confirmed resolution

**Prevention**:
- Pre-commit hooks now validate icon imports
- Enhanced Sentry monitoring for component errors
- Updated deployment checklist
```

## 🔍 Post-Incident

### Checklist Pós-Rollback
- [ ] Validar todos os dashboards funcionando
- [ ] Confirmar métricas de erro voltaram ao normal
- [ ] Analisar logs para identificar causa raiz
- [ ] Atualizar documentação se necessário
- [ ] Criar issue para fix definitivo
- [ ] Agendar post-mortem se incident > 30min

### Melhorias Contínuas
1. **Testes Automatizados**: Adicionar testes de renderização
2. **Staging Environment**: Deploy obrigatório em staging primeiro
3. **Gradual Rollout**: Feature flags para releases graduais
4. **Better Monitoring**: Métricas de performance por dashboard

## 🎯 Contatos de Emergência

- **DevOps Lead**: @joao.silva (Slack)
- **Frontend Lead**: @maria.santos (Slack)
- **Product Owner**: @carlos.lima (Slack)
- **Sentry**: dashboard-alerts@company.com