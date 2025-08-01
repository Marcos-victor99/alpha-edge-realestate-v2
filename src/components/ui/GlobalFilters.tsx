import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Card, Title, Text, Button, Flex, Select, SelectItem } from '@tremor/react';
import { Calendar, Filter, RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interfaces para tipos de filtros
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface GlobalFiltersState {
  dateRange: DateRange;
  selectedShopping: string[];
  selectedCategoria: string[];
  selectedStatus: string;
  isLoading: boolean;
}

export interface GlobalFiltersContextType {
  filters: GlobalFiltersState;
  updateDateRange: (range: DateRange) => void;
  updateShopping: (shopping: string[]) => void;
  updateCategoria: (categoria: string[]) => void;
  updateStatus: (status: string) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

// Estado inicial dos filtros
const initialFilters: GlobalFiltersState = {
  dateRange: {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  selectedShopping: [],
  selectedCategoria: [],
  selectedStatus: 'todos',
  isLoading: false
};

// Context
const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

// Hook para usar o contexto
export const useGlobalFilters = () => {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    throw new Error('useGlobalFilters deve ser usado dentro de GlobalFiltersProvider');
  }
  return context;
};

// Provider
interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export const GlobalFiltersProvider: React.FC<GlobalFiltersProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFiltersState>(initialFilters);

  const updateDateRange = (range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const updateShopping = (shopping: string[]) => {
    setFilters(prev => ({ ...prev, selectedShopping: shopping }));
  };

  const updateCategoria = (categoria: string[]) => {
    setFilters(prev => ({ ...prev, selectedCategoria: categoria }));
  };

  const updateStatus = (status: string) => {
    setFilters(prev => ({ ...prev, selectedStatus: status }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const setLoading = (loading: boolean) => {
    setFilters(prev => ({ ...prev, isLoading: loading }));
  };

  const value: GlobalFiltersContextType = {
    filters,
    updateDateRange,
    updateShopping,
    updateCategoria,
    updateStatus,
    resetFilters,
    setLoading
  };

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
};

// Componente UI dos filtros
interface GlobalFiltersProps {
  className?: string;
  compact?: boolean;
  onApplyFilters?: () => void;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({ 
  className, 
  compact = false,
  onApplyFilters 
}) => {
  const { filters, updateDateRange, updateStatus, resetFilters, setLoading } = useGlobalFilters();

  // Opções de shopping (simuladas - em produção viriam da API)
  const shoppingOptions = [
    'Shopping Park Botucatu',
    'Shopping Center Norte',
    'Shopping Plaza Sul',
    'Mall Central'
  ];

  // Opções de categoria
  const categoriaOptions = [
    'Alimentação',
    'Moda',
    'Eletrônicos',
    'Serviços',
    'Farmácia',
    'Entretenimento',
    'Casa & Construção'
  ];

  const handleApplyFilters = () => {
    setLoading(true);
    if (onApplyFilters) {
      onApplyFilters();
    }
    // Simular delay de aplicação de filtros
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleReset = () => {
    resetFilters();
    handleApplyFilters();
  };

  if (compact) {
    return (
      <Card className={cn("p-4", className)}>
        <Flex alignItems="center" justifyContent="between" className="gap-4">
          <Flex alignItems="center" className="gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) => updateDateRange({
                    ...filters.dateRange,
                    startDate: e.target.value
                  })}
                  className="text-xs border rounded px-2 py-1"
                />
                <span className="text-xs text-gray-500">até</span>
                <input
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) => updateDateRange({
                    ...filters.dateRange,
                    endDate: e.target.value
                  })}
                  className="text-xs border rounded px-2 py-1"
                />
              </div>
            </div>

            <Select 
              value={filters.selectedStatus} 
              onValueChange={updateStatus}
            >
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inadimplente">Inadimplentes</SelectItem>
              <SelectItem value="critico">Críticos</SelectItem>
            </Select>
          </Flex>

          <Flex alignItems="center" className="gap-2">
            <Button
              size="xs"
              variant="secondary"
              icon={RotateCcw}
              onClick={handleReset}
            >
              Limpar
            </Button>
            <Button
              size="xs"
              variant="primary"
              icon={Search}
              onClick={handleApplyFilters}
              loading={filters.isLoading}
            >
              Aplicar
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <Flex alignItems="center" justifyContent="start" className="gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <Title className="text-lg font-semibold">Filtros Globais</Title>
          <Text className="text-sm text-gray-600">
            Aplicados a todos os gráficos simultaneamente
          </Text>
        </div>
      </Flex>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Período */}
        <div>
          <Text className="text-sm font-medium mb-2">Período</Text>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => updateDateRange({
                ...filters.dateRange,
                startDate: e.target.value
              })}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
            <input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => updateDateRange({
                ...filters.dateRange,
                endDate: e.target.value
              })}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Shopping */}
        <div>
          <Text className="text-sm font-medium mb-2">Shopping</Text>
          <Select 
            placeholder="Todos os shoppings"
          >
            {shoppingOptions.map(shopping => (
              <SelectItem key={shopping} value={shopping}>
                {shopping}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Categoria */}
        <div>
          <Text className="text-sm font-medium mb-2">Categoria</Text>
          <Select 
            placeholder="Todas as categorias"
          >
            {categoriaOptions.map(categoria => (
              <SelectItem key={categoria} value={categoria}>
                {categoria}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div>
          <Text className="text-sm font-medium mb-2">Status</Text>
          <Select value={filters.selectedStatus} onValueChange={updateStatus}>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inadimplente">Inadimplentes</SelectItem>
            <SelectItem value="critico">Críticos</SelectItem>
          </Select>
        </div>
      </div>

      {/* Ações */}
      <Flex alignItems="center" justifyContent="end" className="gap-3">
        <Button
          variant="secondary"
          icon={RotateCcw}
          onClick={handleReset}
        >
          Limpar Filtros
        </Button>
        <Button
          variant="primary"
          icon={Search}
          onClick={handleApplyFilters}
          loading={filters.isLoading}
        >
          Aplicar Filtros
        </Button>
      </Flex>

      {/* Status dos filtros aplicados */}
      {(filters.selectedShopping.length > 0 || 
        filters.selectedCategoria.length > 0 || 
        filters.selectedStatus !== 'todos') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Text className="text-xs font-medium text-gray-600 mb-2">
            Filtros Ativos:
          </Text>
          <div className="flex flex-wrap gap-2">
            {filters.selectedShopping.map(shopping => (
              <span key={shopping} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Shopping: {shopping}
              </span>
            ))}
            {filters.selectedCategoria.map(categoria => (
              <span key={categoria} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Categoria: {categoria}
              </span>
            ))}
            {filters.selectedStatus !== 'todos' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Status: {filters.selectedStatus}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GlobalFilters;