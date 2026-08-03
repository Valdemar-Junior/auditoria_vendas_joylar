import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarIcon, DollarSign, Loader2, Package, Percent, Wallet } from 'lucide-react';
import { format, startOfDay, startOfMonth, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AppHeader } from '@/components/audit/AppHeader';
import { useSales } from '@/hooks/useSales';
import { PeriodType } from '@/types/sales';
import { isSaleInDateRange } from '@/lib/salesDate';
import { analisarSubgrupos, somarSubgrupos } from '@/lib/subgrupoMetrics';
import { SubgrupoMultiSelect } from '@/components/audit/SubgrupoMultiSelect';
import { faixaMargem, FAIXA_MARGEM_CONFIG, LEGENDA_MARGEM, LIMITES_MARGEM } from '@/lib/margem';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const MargemSubgrupo = () => {
  const { data: sales = [], isLoading, error, refetch, isFetching, dataUpdatedAt } = useSales();

  const [periodType, setPeriodType] = useState<PeriodType>('mes');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(
    () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfDay(today) };
    }
  );
  const [filial, setFilial] = useState('');
  /** null = todos no estado inicial; lista vazia = nenhum */
  const [subgruposSel, setSubgruposSel] = useState<string[] | null>(null);

  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.isSuccess) toast.success('Dados atualizados com sucesso!');
    else if (result.isError) toast.error('Erro ao atualizar dados');
  };

  const handlePeriodChange = (period: PeriodType) => {
    const today = new Date();
    setPeriodType(period);
    if (period === 'hoje') setDateRange({ from: startOfDay(today), to: endOfDay(today) });
    else if (period === 'mes') setDateRange({ from: startOfMonth(today), to: endOfDay(today) });
  };

  const filiais = useMemo(
    () => [...new Set(sales.map((s) => s.nome_filial).filter(Boolean))].sort() as string[],
    [sales]
  );

  const vendasFiltradas = useMemo(
    () =>
      sales.filter((sale) => {
        if (!isSaleInDateRange(sale, dateRange.from, dateRange.to)) return false;
        if (filial && sale.nome_filial !== filial) return false;
        return true;
      }),
    [sales, dateRange, filial]
  );

  const analise = useMemo(() => analisarSubgrupos(vendasFiltradas), [vendasFiltradas]);

  // Recorte selecionado. Como cada linha já traz os valores em reais, somar as
  // linhas escolhidas dá a margem do recorte sem varrer as vendas de novo.
  const linhas = useMemo(
    () =>
      subgruposSel === null
        ? analise.linhas
        : analise.linhas.filter((l) => subgruposSel.includes(l.subgrupo)),
    [analise.linhas, subgruposSel]
  );

  const totais = useMemo(() => somarSubgrupos(linhas), [linhas]);

  const quantidadeSelecionada = linhas.length;
  const recorteAtivo = quantidadeSelecionada < analise.linhas.length;

  /** Fatia que o recorte representa no faturamento do período inteiro */
  const fatiaDoPeriodo =
    analise.totalFaturamento > 0 ? (totais.faturamento / analise.totalFaturamento) * 100 : 0;

  // Escala comum das barras: teto "redondo" acima da maior margem, para todas serem comparáveis
  const escalaMax = useMemo(() => {
    const maior = Math.max(totais.margemPerc, ...linhas.map((l) => l.margemPerc), 10);
    return Math.ceil(maior / 10) * 10;
  }, [linhas, totais.margemPerc]);

  const periodoLabel =
    periodType === 'hoje'
      ? 'Hoje'
      : periodType === 'mes'
        ? 'Este mês'
        : dateRange.from && dateRange.to
          ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
          : 'Selecionar período';

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

  const situacaoGeral = FAIXA_MARGEM_CONFIG[faixaMargem(totais.margemPerc)];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Margem por Subgrupo"
        subtitle="Quanto cada categoria de produto realmente deixa de lucro"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isFetching={isFetching}
      />

      <main className="px-4 py-6 space-y-6 max-w-[1400px] mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando vendas...</span>
          </div>
        ) : (
          <>
            {/* Filtros — uma linha acima dos dados */}
            <div className="rounded-xl border bg-card shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={periodType === 'hoje' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePeriodChange('hoje')}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant={periodType === 'mes' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePeriodChange('mes')}
                    >
                      Este Mês
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={periodType === 'intervalo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (periodType !== 'intervalo') setPeriodType('intervalo');
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
                          defaultMonth={dateRange.from}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            setPeriodType('intervalo');
                            setDateRange({ from: range?.from, to: range?.to });
                          }}
                          numberOfMonths={2}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2 sm:w-52">
                  <Label className="text-sm font-medium">Filial</Label>
                  <Select
                    value={filial || 'all'}
                    onValueChange={(value) => setFilial(value === 'all' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as filiais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as filiais</SelectItem>
                      {filiais.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:w-64">
                  <Label className="text-sm font-medium">Subgrupos</Label>
                  <SubgrupoMultiSelect
                    opcoes={analise.linhas.map((l) => ({
                      subgrupo: l.subgrupo,
                      faturamento: l.faturamento,
                      participacaoPerc: l.participacaoPerc,
                    }))}
                    selecionados={subgruposSel}
                    onChange={setSubgruposSel}
                  />
                </div>

                <p className="text-sm text-muted-foreground sm:ml-auto pb-2">
                  {periodoLabel} • {totais.itens} itens
                  {filial && ` • ${filial}`}
                </p>
              </div>
            </div>

            {/* Número principal + apoio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="metric-card metric-card-primary lg:col-span-1 flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                  {recorteAtivo ? 'Margem dos Selecionados' : 'Margem Geral'}
                </p>
                <p className={cn('text-5xl font-bold tracking-tight mt-2', situacaoGeral.text)}>
                  {formatPercent(totais.margemPerc)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Lucro de R$ {formatCurrency(totais.lucro)} sobre R${' '}
                  {formatCurrency(totais.faturamento)} faturados
                </p>
                {recorteAtivo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {quantidadeSelecionada} de {analise.linhas.length} subgrupos •{' '}
                    {fatiaDoPeriodo.toFixed(1)}% do faturamento do período
                  </p>
                )}
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Faturamento',
                    value: `R$ ${formatCurrency(totais.faturamento)}`,
                    sub: `${linhas.length} ${linhas.length === 1 ? 'subgrupo' : 'subgrupos'}`,
                    icon: DollarSign,
                    variant: 'success',
                  },
                  {
                    title: 'Lucro',
                    value: `R$ ${formatCurrency(totais.lucro)}`,
                    sub: 'Soma do lucro dos itens',
                    icon: Wallet,
                    variant: 'purple',
                  },
                  {
                    title: 'Desconto',
                    value: formatPercent(totais.descontoPerc),
                    sub: `R$ ${formatCurrency(totais.desconto)} concedidos`,
                    icon: Percent,
                    variant: 'orange',
                  },
                ].map(({ title, value, sub, icon: Icon, variant }) => (
                  <div key={title} className={cn('metric-card', `metric-card-${variant}`)}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                          {title}
                        </p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela + barras */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Margem por subgrupo</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Ordenado por faturamento. A linha vertical marca a margem
                    {recorteAtivo ? ' dos selecionados' : ' geral'} de{' '}
                    {formatPercent(totais.margemPerc)}.
                  </p>
                </div>
                {/* Legenda da régua — a cor nunca é o único sinal */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {(
                    [
                      ['excelente', `≥ ${LIMITES_MARGEM.excelente}%`],
                      ['boa', `≥ ${LIMITES_MARGEM.boa}%`],
                      ['atencao', `≥ ${LIMITES_MARGEM.atencao}%`],
                      ['critica', `< ${LIMITES_MARGEM.atencao}%`],
                    ] as const
                  ).map(([faixa, corte]) => (
                    <span key={faixa} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className={cn('h-2 w-2 rounded-full', FAIXA_MARGEM_CONFIG[faixa].bar)} />
                      {FAIXA_MARGEM_CONFIG[faixa].label} {corte}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="text-left font-medium px-6 py-3">Subgrupo</th>
                      <th className="text-right font-medium px-3 py-3">Itens</th>
                      <th className="text-right font-medium px-3 py-3">Faturamento</th>
                      <th className="text-right font-medium px-3 py-3">Desconto</th>
                      <th className="text-right font-medium px-3 py-3">Lucro</th>
                      <th className="text-left font-medium px-3 py-3 w-[26%]">
                        Margem <span className="normal-case">(0 – {escalaMax}%)</span>
                      </th>
                      <th className="text-center font-medium px-6 py-3">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha) => {
                      const cfg = FAIXA_MARGEM_CONFIG[faixaMargem(linha.margemPerc)];
                      const Icone = cfg.icon;
                      const larguraBarra = Math.max(
                        0,
                        Math.min(100, (linha.margemPerc / escalaMax) * 100)
                      );

                      return (
                        <tr
                          key={linha.subgrupo}
                          className="border-b border-border/30 last:border-0 hover:bg-table-row-hover transition-colors"
                          title={`${linha.subgrupo}: R$ ${formatCurrency(linha.lucro)} de lucro sobre R$ ${formatCurrency(linha.faturamento)} — margem ${formatPercent(linha.margemPerc)}`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium">{linha.subgrupo}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {linha.participacaoPerc.toFixed(1)}% do faturamento •{' '}
                              {linha.vendas} {linha.vendas === 1 ? 'venda' : 'vendas'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right font-mono text-muted-foreground">
                            {linha.itens}
                          </td>
                          <td className="px-3 py-4 text-right font-mono font-medium whitespace-nowrap">
                            R$ {formatCurrency(linha.faturamento)}
                          </td>
                          <td className="px-3 py-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                            {formatPercent(linha.descontoPerc)}
                          </td>
                          <td className="px-3 py-4 text-right font-mono font-medium whitespace-nowrap">
                            R$ {formatCurrency(linha.lucro)}
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1 h-2 rounded-full bg-muted min-w-[80px]">
                                <div
                                  className={cn(
                                    'absolute inset-y-0 left-0 rounded-full transition-all',
                                    cfg.bar
                                  )}
                                  style={{ width: `${larguraBarra}%` }}
                                />
                                {/* Referência: margem geral */}
                                <div
                                  className="absolute -inset-y-1 w-0.5 bg-foreground/40"
                                  style={{
                                    left: `${Math.min(100, (totais.margemPerc / escalaMax) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={cn(
                                  'font-mono font-semibold tabular-nums w-16 text-right',
                                  cfg.text
                                )}
                              >
                                {formatPercent(linha.margemPerc)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
                                cfg.badge
                              )}
                            >
                              <Icone className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {linhas.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold bg-muted/30">
                        <td className="px-6 py-4">
                          {recorteAtivo ? 'Selecionados' : 'Geral'}
                        </td>
                        <td className="px-3 py-4 text-right font-mono">{totais.itens}</td>
                        <td className="px-3 py-4 text-right font-mono whitespace-nowrap">
                          R$ {formatCurrency(totais.faturamento)}
                        </td>
                        <td className="px-3 py-4 text-right font-mono whitespace-nowrap">
                          {formatPercent(totais.descontoPerc)}
                        </td>
                        <td className="px-3 py-4 text-right font-mono whitespace-nowrap">
                          R$ {formatCurrency(totais.lucro)}
                        </td>
                        <td className={cn('px-3 py-4 text-right font-mono', situacaoGeral.text)}>
                          {formatPercent(totais.margemPerc)}
                        </td>
                        <td className="px-6 py-4" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {linhas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="h-8 w-8 mb-3" />
                  <p className="text-lg font-medium">
                    {analise.linhas.length === 0
                      ? 'Nenhuma venda no período'
                      : 'Nenhum subgrupo selecionado'}
                  </p>
                  <p className="text-sm">
                    {analise.linhas.length === 0
                      ? 'Tente outro período ou filial'
                      : 'Marque ao menos um subgrupo no filtro acima'}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground pb-4">
              Margem = lucro ÷ faturamento líquido do subgrupo. Cada item pesa pelo seu valor, então
              um móvel de R$ 3.000 influencia mais que uma utilidade de R$ 9,90. Régua:{' '}
              {LEGENDA_MARGEM}.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default MargemSubgrupo;
