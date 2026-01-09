import { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Percent, TrendingUp, Loader2, DollarSign, Wallet, Unlock, RefreshCw } from 'lucide-react';
import { MetricCard } from '@/components/audit/MetricCard';
import { SalesFilters, getDefaultFilters } from '@/components/audit/SalesFilters';
import { SalesTable } from '@/components/audit/SalesTable';
import { useSales } from '@/hooks/useSales';
import { useAlertWebhook } from '@/hooks/useAlertWebhook';
import { SalesFilters as FiltersType } from '@/types/sales';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Index = () => {
  const { data: sales = [], isLoading, error, refetch, isFetching, dataUpdatedAt } = useSales();
  const { processAlertsForSales } = useAlertWebhook();

  const [filters, setFilters] = useState<FiltersType>(getDefaultFilters());

  // Track last updated time based on actual data fetch
  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.isSuccess) {
      toast.success('Dados atualizados com sucesso!');
    } else if (result.isError) {
      toast.error('Erro ao atualizar dados');
    }
  };

  // Extract unique values for filter dropdowns
  const filiais = useMemo(() =>
    [...new Set(sales.map(s => s.nome_filial).filter(Boolean))].sort() as string[],
    [sales]
  );

  const vendedores = useMemo(() =>
    [...new Set(sales.map(s => s.nome_vendedor).filter(Boolean))].sort() as string[],
    [sales]
  );

  const tabelas = useMemo(() => {
    const allTabelas = new Set<string>();
    sales.forEach(s => {
      const items = (s.items as unknown as Array<{ tabela_usada: string }>) || [];
      items.forEach(item => {
        if (item.tabela_usada) allTabelas.add(item.tabela_usada);
      });
    });
    return [...allTabelas].sort();
  }, [sales]);

  const operacoes = useMemo(() =>
    [...new Set(sales.map(s => s.operacao).filter(Boolean))].sort() as string[],
    [sales]
  );

  // Filter sales based on current filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date range filter
      // Formatar as datas para comparação ignorando o timezone (comparar apenas YYYY-MM-DD)
      if (filters.dateRange.from) {
        // Criar data local a partir da string YYYY-MM-DD (garantindo pegar apenas a parte da data)
        const [year, month, day] = sale.data_emissao.slice(0, 10).split('-').map(Number);
        const saleDate = new Date(year, month - 1, day);
        // Resetar horas do filtro para garantir comparação correta
        const filterFrom = new Date(filters.dateRange.from);
        filterFrom.setHours(0, 0, 0, 0);

        if (saleDate < filterFrom) return false;
      }
      if (filters.dateRange.to) {
        const [year, month, day] = sale.data_emissao.slice(0, 10).split('-').map(Number);
        const saleDate = new Date(year, month - 1, day);
        // Ajustar filtro para final do dia
        const filterTo = new Date(filters.dateRange.to);
        filterTo.setHours(23, 59, 59, 999);

        if (saleDate > filterTo) return false;
      }

      // Text filters
      if (filters.filial && sale.nome_filial !== filters.filial) return false;
      if (filters.vendedor && sale.nome_vendedor !== filters.vendedor) return false;
      if (filters.lancamento && !String(sale.numero_lancamento).includes(filters.lancamento)) return false;
      if (filters.operacao && sale.operacao !== filters.operacao) return false;
      if (filters.tabela) {
        const items = (sale.items as unknown as Array<{ tabela_usada: string }>) || [];
        const hasTabela = items.some(item => item.tabela_usada === filters.tabela);
        if (!hasTabela) return false;
      }
      if (filters.alertaStatus) {
        const items = (sale.items as unknown as Array<{ alerta_auditoria?: string }>) || [];
        const hasItemAlert = items.some(item =>
          item.alerta_auditoria &&
          item.alerta_auditoria !== 'OK' &&
          item.alerta_auditoria.toLowerCase().includes('alerta')
        );
        if (filters.alertaStatus === 'ALERTA' && !hasItemAlert) return false;
        if (filters.alertaStatus === 'OK' && hasItemAlert) return false;
      }
      if (filters.descontoMinimo > 0 && (sale.perc_desconto ?? 0) < filters.descontoMinimo) return false;

      return true;
    });
  }, [sales, filters]);

  // Calculate metrics - group by numero_lancamento for unique sales count
  const metrics = useMemo(() => {
    // Group by numero_lancamento to count unique sales
    const uniqueSales = new Map<number, typeof filteredSales[0][]>();
    filteredSales.forEach(sale => {
      const key = sale.numero_lancamento;
      if (!uniqueSales.has(key)) {
        uniqueSales.set(key, []);
      }
      uniqueSales.get(key)!.push(sale);
    });

    const totalVendas = uniqueSales.size;

    // Count unique sales with alerts - verificar nos itens (JSON), não na coluna da venda
    let vendasComAlerta = 0;
    let vendasComLiberacao = 0;
    uniqueSales.forEach(salesList => {
      // Verifica se algum item de qualquer venda tem alerta
      const hasItemAlert = salesList.some(s => {
        const items = (s.items as unknown as Array<{ alerta_auditoria?: string }>) || [];
        return items.some(item =>
          item.alerta_auditoria &&
          item.alerta_auditoria !== 'OK' &&
          item.alerta_auditoria.toLowerCase().includes('alerta')
        );
      });
      if (hasItemAlert) {
        vendasComAlerta++;
      }
      if (salesList.some(s => s.teve_liberacao === 'SIM')) {
        vendasComLiberacao++;
      }
    });

    // Sum values from all items
    const totalFaturamento = filteredSales.reduce((acc, s) => acc + (s.vlr_liquido ?? 0), 0);
    const totalDescontoReais = filteredSales.reduce((acc, s) => acc + (s.vlr_desconto ?? 0), 0);
    const totalLucro = filteredSales.reduce((acc, s) => acc + (s.lucro_reais ?? 0), 0);

    const totalDesconto = filteredSales.reduce((acc, s) => acc + (s.perc_desconto ?? 0), 0);
    const percentualDescontoMedio = filteredSales.length > 0 ? (totalDesconto / filteredSales.length).toFixed(2) : '0.00';

    const totalMargem = filteredSales.reduce((acc, s) => acc + (s.margem_perc ?? 0), 0);
    const margemMedia = filteredSales.length > 0 ? (totalMargem / filteredSales.length).toFixed(2) : '0.00';

    return {
      totalVendas,
      vendasComAlerta,
      vendasComLiberacao,
      totalFaturamento,
      totalDescontoReais,
      totalLucro,
      percentualDescontoMedio,
      margemMedia,
    };
  }, [filteredSales]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Process alerts when sales are loaded
  useEffect(() => {
    if (sales.length > 0) {
      processAlertsForSales(sales);
    }
  }, [sales, processAlertsForSales]);


  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass-effect sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">
                Auditoria de Vendas
              </h1>
              <p className="text-muted-foreground mt-1">
                Análise de tabelas de preço, descontos e comissão
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden md:inline">Última atualização:</span>
                <span className="font-medium text-foreground">{lastUpdated}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-[1920px] mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando vendas...</span>
          </div>
        ) : (
          <>
            {/* Metrics Cards - Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total de Vendas"
                value={metrics.totalVendas}
                subtitle="Vendas no período"
                icon={ShoppingCart}
                variant="primary"
                className="stagger-1"
              />
              <MetricCard
                title="Total Faturamento"
                value={`R$ ${formatCurrency(metrics.totalFaturamento)}`}
                subtitle="Valor líquido total"
                icon={DollarSign}
                variant="success"
                className="stagger-2"
              />
              <MetricCard
                title="Total Desconto"
                value={`R$ ${formatCurrency(metrics.totalDescontoReais)}`}
                subtitle={`Média de ${metrics.percentualDescontoMedio}%`}
                icon={Percent}
                variant="orange"
                className="stagger-3"
              />
              <MetricCard
                title="Total Lucro"
                value={`R$ ${formatCurrency(metrics.totalLucro)}`}
                subtitle={`Margem média ${metrics.margemMedia}%`}
                icon={Wallet}
                variant="purple"
                className="stagger-4"
              />
            </div>

            {/* Metrics Cards - Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Vendas com Alerta"
                value={metrics.vendasComAlerta}
                subtitle={`${((metrics.vendasComAlerta / metrics.totalVendas) * 100 || 0).toFixed(1)}% do total`}
                icon={AlertTriangle}
                variant="alert"
                className="stagger-5"
              />
              <MetricCard
                title="Pedidos de Liberação"
                value={metrics.vendasComLiberacao}
                subtitle={`${((metrics.vendasComLiberacao / metrics.totalVendas) * 100 || 0).toFixed(1)}% do total`}
                icon={Unlock}
                variant="neutral"
                className="stagger-6"
              />
              <MetricCard
                title="Desconto Médio"
                value={`${metrics.percentualDescontoMedio}%`}
                subtitle="Média de desconto aplicado"
                icon={Percent}
                variant="neutral"
                className="stagger-5"
              />
              <MetricCard
                title="Margem Média"
                value={`${metrics.margemMedia}%`}
                subtitle="Margem de lucro média"
                icon={TrendingUp}
                variant="success"
                className="stagger-6"
              />
            </div>

            {/* Filters */}
            <SalesFilters
              filters={filters}
              onFiltersChange={setFilters}
              filiais={filiais}
              vendedores={vendedores}
              tabelas={tabelas}
              operacoes={operacoes}
            />

            {/* Sales Table */}
            <SalesTable sales={filteredSales} />

            {/* Footer info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground py-4">
              <p>
                Exibindo <span className="font-medium text-foreground">{new Set(filteredSales.map(s => s.numero_lancamento)).size}</span> vendas com{' '}
                <span className="font-medium text-foreground">
                  {filteredSales.reduce((acc, sale) => {
                    const items = (sale.items as unknown as Array<unknown>) || [];
                    return acc + items.length;
                  }, 0)}
                </span> itens no total
              </p>
              <p className="hidden md:block">
                Clique em uma linha para ver os detalhes completos da venda
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;