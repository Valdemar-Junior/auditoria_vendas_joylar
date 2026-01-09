import { useState } from 'react';
import { CalendarIcon, Filter, Search, X } from 'lucide-react';
import { format, startOfDay, startOfMonth, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { SalesFilters as FiltersType, PeriodType } from '@/types/sales';

interface SalesFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  filiais: string[];
  vendedores: string[];
  tabelas: string[];
  operacoes: string[];
}

const getDefaultFilters = (): FiltersType => {
  const today = new Date();
  return {
    periodType: 'hoje',
    dateRange: { from: startOfDay(today), to: endOfDay(today) },
    filial: '',
    vendedor: '',
    lancamento: '',
    tabela: '',
    operacao: '',
    alertaStatus: '',
    descontoMinimo: 0,
  };
};

export function SalesFilters({ 
  filters, 
  onFiltersChange, 
  filiais, 
  vendedores, 
  tabelas,
  operacoes
}: SalesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClearFilters = () => {
    onFiltersChange(getDefaultFilters());
  };

  const handlePeriodChange = (period: PeriodType) => {
    const today = new Date();
    let dateRange = { from: undefined as Date | undefined, to: undefined as Date | undefined };

    if (period === 'hoje') {
      dateRange = { from: startOfDay(today), to: endOfDay(today) };
    } else if (period === 'mes') {
      dateRange = { from: startOfMonth(today), to: endOfDay(today) };
    }
    // For 'intervalo', keep empty until user selects

    onFiltersChange({ ...filters, periodType: period, dateRange });
  };

  const hasActiveFilters = 
    filters.periodType !== 'hoje' ||
    filters.filial || 
    filters.vendedor || 
    filters.lancamento || 
    filters.tabela || 
    filters.operacao ||
    filters.alertaStatus ||
    filters.descontoMinimo > 0;

  const getPeriodLabel = () => {
    if (filters.periodType === 'hoje') return 'Hoje';
    if (filters.periodType === 'mes') return 'Este Mês';
    if (filters.periodType === 'intervalo') {
      if (filters.dateRange.from && filters.dateRange.to) {
        return `${format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })}`;
      }
      if (filters.dateRange.from) {
        return format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR });
      }
      return 'Selecionar período';
    }
    return 'Selecionar período';
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Filtros Avançados</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? 'Filtros ativos' : 'Filtro padrão: Hoje'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); handleClearFilters(); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Period Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.periodType === 'hoje' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('hoje')}
                  className="flex-1"
                >
                  Hoje
                </Button>
                <Button
                  variant={filters.periodType === 'mes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('mes')}
                  className="flex-1"
                >
                  Este Mês
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={filters.periodType === 'intervalo' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "flex-1",
                        filters.periodType === 'intervalo' && "ring-2 ring-primary/20"
                      )}
                      onClick={() => {
                        if (filters.periodType !== 'intervalo') {
                          handlePeriodChange('intervalo');
                        }
                      }}
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Intervalo
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange.from}
                      selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                      onSelect={(range) => {
                        onFiltersChange({ 
                          ...filters, 
                          periodType: 'intervalo',
                          dateRange: { from: range?.from, to: range?.to } 
                        });
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {filters.periodType === 'intervalo' && (
                <p className="text-xs text-muted-foreground">
                  {getPeriodLabel()}
                </p>
              )}
            </div>

            {/* Operação */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operação</Label>
              <Select
                value={filters.operacao || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, operacao: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as operações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as operações</SelectItem>
                  {operacoes.map((operacao) => (
                    <SelectItem key={operacao} value={operacao}>{operacao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filial */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filial</Label>
              <Select
                value={filters.filial || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, filial: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as filiais</SelectItem>
                  {filiais.map((filial) => (
                    <SelectItem key={filial} value={filial}>{filial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendedor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vendedor</Label>
              <Select
                value={filters.vendedor || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, vendedor: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor} value={vendedor}>{vendedor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lançamento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lançamento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lançamento..."
                  value={filters.lancamento}
                  onChange={(e) => onFiltersChange({ ...filters, lancamento: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tabela Utilizada</Label>
              <Select
                value={filters.tabela || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, tabela: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  {tabelas.map((tabela) => (
                    <SelectItem key={tabela} value={tabela}>{tabela}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Alerta */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status Auditoria</Label>
              <Select
                value={filters.alertaStatus || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, alertaStatus: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="OK">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-status-ok" />
                      OK
                    </span>
                  </SelectItem>
                  <SelectItem value="ALERTA">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-status-alert" />
                      ALERTA
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desconto Mínimo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Desconto Mínimo (%)</Label>
              <Input
                type="number"
                placeholder="Ex: 15"
                value={filters.descontoMinimo || ''}
                onChange={(e) => onFiltersChange({ ...filters, descontoMinimo: Number(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { getDefaultFilters };
