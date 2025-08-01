import { 
  BarChart3, 
  Building2, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Map, 
  Calculator,
  Zap,
  PieChart,
  Activity,
  DollarSign,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  {
    id: "overview",
    label: "Visão Geral",
    icon: BarChart3,
    description: "Dashboard Principal"
  },
  {
    id: "financial",
    label: "Financeiro",
    icon: DollarSign,
    description: "Análise Financeira"
  },
  {
    id: "inadimplencia",
    label: "Inadimplência",
    icon: AlertTriangle,
    description: "Controle de Recebíveis"
  },
  {
    id: "orcamento",
    label: "Orçamento",
    icon: Calculator,
    description: "Controle Orçamentário"
  },
  {
    id: "visualizacoes",
    label: "Visualizações",
    icon: Layout,
    description: "Todos os Gráficos"
  },
  {
    id: "assets",
    label: "Ativos",
    icon: Building2,
    description: "Shopping Centers"
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: TrendingUp,
    description: "Modelos Preditivos"
  },
  {
    id: "portfolio",
    label: "Portfólio",
    icon: PieChart,
    description: "Otimização MPT"
  },
  {
    id: "monte-carlo",
    label: "Monte Carlo",
    icon: Target,
    description: "Simulação de Risco"
  },
  {
    id: "geo-intelligence",
    label: "Geo Intel",
    icon: Map,
    description: "Analytics Espacial"
  },
  {
    id: "alpha-signals",
    label: "Alpha Signals",
    icon: Zap,
    description: "Detecção de Oportunidades"
  }
];

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-card border-r border-border shadow-financial">
      <div className="p-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3",
                  isActive && "bg-gradient-secondary shadow-accent"
                )}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className={cn(
                  "h-5 w-5 mr-3", 
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="text-left">
                  <div className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Performance Indicator */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gradient-primary p-4 rounded-lg text-center">
          <Activity className="h-6 w-6 text-primary-foreground mx-auto mb-2" />
          <div className="text-sm font-medium text-primary-foreground">
            Real-time Analytics
          </div>
          <div className="text-xs text-primary-foreground/80">
            Live data streaming
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;