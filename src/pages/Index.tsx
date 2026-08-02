import { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Percent, TrendingUp, Loader2, DollarSign, Wallet, Unlock } from 'lucide-react';
import { AppHeader } from '@/components/audit/AppHeader';
import { MetricCard } from '@/components/audit/MetricCard';
import { SalesFilters, getDefaultFilters } from '@/components/audit/SalesFilters';
import { SalesTable } from '@/components/audit/SalesTable';
import { useSales } from '@/hooks/useSales';
import { useAlertWebhook } from '@/hooks/useAlertWebhook';
import { SalesFilters as FiltersType, SaleItem } from '@/types/sales';
import { isSaleInDateRange } from '@/lib/salesDate';
import { corMargem, faixaMargem, FAIXA_MARGEM_CONFIG } from '@/lib/margem';
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

  const subgrupos = useMemo(() => {
    const allSubgrupos = new Set<string>();
    sales.forEach(s => {
      const items = (s.items as unknown as Array<{ subgrupo?: string }>) || [];
      items.forEach(item => {
        if (item.subgrupo) allSubgrupos.add(item.subgrupo);
      });
    });
    return [...allSubgrupos].sort();
  }, [sales]);

  const operacoes = useMemo(() =>
    [...new Set(sales.map(s => s.operacao).filter(Boolean))].sort() as string[],
    [sales]
  );

  // Filter sales based on current filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date range filter (compara só YYYY-MM-DD, ignorando timezone)
      if (!isSaleInDateRange(sale, filters.dateRange.from, filters.dateRange.to)) return false;

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
      if (filters.subgrupo) {
        const items = (sale.items as unknown as Array<{ subgrupo?: string }>) || [];
        const hasSubgrupo = items.some(item => item.subgrupo === filters.subgrupo);
        if (!hasSubgrupo) return false;
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

    // Com filtro de subgrupo ativo, os valores somam APENAS os itens daquele subgrupo.
    // Sem ele, uma venda mista (ex: colchão + utilidades) inflaria o total do subgrupo.
    let totalFaturamento = 0;
    let totalDescontoReais = 0;
    let totalLucro = 0;

    if (filters.subgrupo) {
      filteredSales.forEach(s => {
        const items = (s.items as unknown as SaleItem[]) || [];
        items.forEach(item => {
          if (item.subgrupo !== filters.subgrupo) return;
          totalFaturamento += Number(item.vlr_liquido) || 0;
          totalDescontoReais += Number(item.vlr_desconto) || 0;
          totalLucro += Number(item.lucro_reais) || 0;
        });
      });
    } else {
      filteredSales.forEach(s => {
        totalFaturamento += s.vlr_liquido ?? 0;
        totalDescontoReais += s.vlr_desconto ?? 0;
        totalLucro += s.lucro_reais ?? 0;
      });
    }

    // Percentuais REAIS, ponderados pelo valor — não média aritmética dos percentuais.
    // Média simples faria uma venda de R$ 9,80 pesar igual a uma de R$ 2.515,00,
    // e o resultado não corresponderia a nenhum dinheiro que existe de fato.
    const totalBruto = totalFaturamento + totalDescontoReais;
    const percentualDescontoMedio =
      totalBruto > 0 ? ((totalDescontoReais / totalBruto) * 100).toFixed(2) : '0.00';
    const margemMedia =
      totalFaturamento > 0 ? ((totalLucro / totalFaturamento) * 100).toFixed(2) : '0.00';

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
  }, [filteredSales, filters.subgrupo]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Deixa explícito nos cards que os valores estão restritos ao subgrupo filtrado
  const escopoSubgrupo = filters.subgrupo ? `Somente itens de ${filters.subgrupo}` : null;

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
      <AppHeader
        title="Auditoria de Vendas"
        subtitle="Análise de tabelas de preço, descontos e comissão"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isFetching={isFetching}
      />

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
                subtitle={filters.subgrupo ? `Vendas com ${filters.subgrupo}` : 'Vendas no período'}
                icon={ShoppingCart}
                variant="primary"
                className="stagger-1"
              />
              <MetricCard
                title="Total Faturamento"
                value={`R$ ${formatCurrency(metrics.totalFaturamento)}`}
                subtitle={escopoSubgrupo ?? 'Valor líquido total'}
                icon={DollarSign}
                variant="success"
                className="stagger-2"
              />
              <MetricCard
                title="Total Desconto"
                value={`R$ ${formatCurrency(metrics.totalDescontoReais)}`}
                subtitle={escopoSubgrupo ?? `${metrics.percentualDescontoMedio}% do valor bruto`}
                icon={Percent}
                variant="orange"
                className="stagger-3"
              />
              <MetricCard
                title="Total Lucro"
                value={`R$ ${formatCurrency(metrics.totalLucro)}`}
                subtitle={escopoSubgrupo ?? `Margem de ${metrics.margemMedia}%`}
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
                title="Desconto Geral"
                value={`${metrics.percentualDescontoMedio}%`}
                subtitle="Desconto ÷ valor bruto"
                icon={Percent}
                variant="neutral"
                className="stagger-5"
              />
              <MetricCard
                title="Margem Geral"
                value={`${metrics.margemMedia}%`}
                valueClassName={corMargem(Number(metrics.margemMedia))}
                subtitle={FAIXA_MARGEM_CONFIG[faixaMargem(Number(metrics.margemMedia))].label + ' • lucro ÷ faturamento'}
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
              subgrupos={subgrupos}
              operacoes={operacoes}
            />

            {/* Sales Table */}
            <SalesTable sales={filteredSales} highlightSubgrupo={filters.subgrupo} />

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