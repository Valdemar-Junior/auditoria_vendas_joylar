import { useState, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Package } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { SaleDetailModal } from './SaleDetailModal';
import { Sale, SaleItem } from '@/types/sales';
import { cn } from '@/lib/utils';

interface SalesTableProps {
  sales: Sale[];
}

type SortField = 'numero_lancamento' | 'data_emissao' | 'perc_desconto' | 'margem_perc' | 'vlr_liquido';
type SortDirection = 'asc' | 'desc';

export function SalesTable({ sales }: SalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('data_emissao');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  
  // Drag to scroll states
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortField) {
        case 'numero_lancamento':
          aVal = a.numero_lancamento;
          bVal = b.numero_lancamento;
          break;
        case 'data_emissao':
          aVal = new Date(a.data_emissao).getTime();
          bVal = new Date(b.data_emissao).getTime();
          break;
        case 'perc_desconto':
          aVal = Number(a.perc_desconto) || 0;
          bVal = Number(b.perc_desconto) || 0;
          break;
        case 'margem_perc':
          aVal = Number(a.margem_perc) || 0;
          bVal = Number(b.margem_perc) || 0;
          break;
        case 'vlr_liquido':
          aVal = Number(a.vlr_liquido) || 0;
          bVal = Number(b.vlr_liquido) || 0;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [sales, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" />
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  const handleRowDoubleClick = (sale: Sale) => {
    setSelectedSale(sale);
    setModalOpen(true);
  };

  const toggleSale = (saleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return (isNaN(num) ? 0 : num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatPercent = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return (isNaN(num) ? 0 : num).toFixed(2);
  };

  const getSaleDateTimeUtc = (sale: Sale) => {
    // hora_emissao vem sem timezone; no seu caso ela está em UTC (3h a mais).
    // Montamos um Date em UTC e formatamos para America/Sao_Paulo.
    const datePart = sale.sale_date || sale.data_emissao;
    const baseDate = typeof datePart === 'string' ? datePart.slice(0, 10) : '';
    const timePart = sale.hora_emissao?.slice(0, 8) || '00:00:00';

    // Ex: 2025-12-24T15:28:54Z
    return new Date(`${baseDate}T${timePart}Z`);
  };

  const getItems = (sale: Sale): SaleItem[] => {
    if (!sale.items) return [];
    return sale.items as unknown as SaleItem[];
  };

  // Verifica se algum item da venda tem alerta (a coluna alerta_auditoria do nível da venda não é confiável)
  const hasItemAlert = (sale: Sale): boolean => {
    const items = getItems(sale);
    return items.some(item => 
      item.alerta_auditoria && 
      item.alerta_auditoria !== 'OK' && 
      item.alerta_auditoria.toLowerCase().includes('alerta')
    );
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    const x = e.touches[0].pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div 
        ref={tableContainerRef}
        className={cn(
          "rounded-2xl border border-border/50 bg-card shadow-lg overflow-x-auto scrollbar-thin",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Table className="w-full min-w-[1000px]" style={{ tableLayout: 'fixed' }}>
          <TableHeader>
            <TableRow className="table-header-gradient hover:bg-transparent border-b-0">
              <TableHead className="text-primary-foreground font-semibold w-[3%]"></TableHead>
              <TableHead 
                className="text-primary-foreground font-semibold cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap w-[8%]"
                onClick={() => handleSort('numero_lancamento')}
              >
                Nº Lanç. <SortIcon field="numero_lancamento" />
              </TableHead>
              <TableHead 
                className="text-primary-foreground font-semibold cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap w-[10%]"
                onClick={() => handleSort('data_emissao')}
              >
                Data/Hora <SortIcon field="data_emissao" />
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold whitespace-nowrap w-[12%]">Filial</TableHead>
              <TableHead className="text-primary-foreground font-semibold w-[20%]">Produto(s)</TableHead>
              <TableHead className="text-primary-foreground font-semibold whitespace-nowrap w-[10%]">Tabela</TableHead>
              <TableHead className="text-primary-foreground font-semibold whitespace-nowrap w-[10%]">Forma Pgto</TableHead>
              <TableHead 
                className="text-primary-foreground font-semibold text-right cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap w-[8%]"
                onClick={() => handleSort('vlr_liquido')}
              >
                Total <SortIcon field="vlr_liquido" />
              </TableHead>
              <TableHead 
                className="text-primary-foreground font-semibold text-right cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap w-[6%]"
                onClick={() => handleSort('perc_desconto')}
              >
                Desc. <SortIcon field="perc_desconto" />
              </TableHead>
              <TableHead 
                className="text-primary-foreground font-semibold text-right cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap w-[6%]"
                onClick={() => handleSort('margem_perc')}
              >
                Margem <SortIcon field="margem_perc" />
              </TableHead>
              <TableHead className="text-primary-foreground font-semibold text-center whitespace-nowrap w-[7%]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSales.map((sale, index) => {
              const items = getItems(sale);
              const isExpanded = expandedSales.has(sale.id);
              const hasMultipleItems = items.length > 1;
              const highDiscount = Number(sale.perc_desconto) > 20;
              const lowMargin = Number(sale.margem_perc) < 15;
              // Verifica alerta nos itens (JSON) em vez da coluna da venda
              const hasAlerta = hasItemAlert(sale);
              const primaryTabela = items[0]?.tabela_usada || '-';
              
              return (
                <>
                  {/* Main Sale Row */}
                  <TableRow 
                    key={sale.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:bg-table-row-hover border-border/30',
                      hasAlerta && 'row-alert',
                      `opacity-0 animate-fade-in`
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                    onDoubleClick={() => handleRowDoubleClick(sale)}
                    title="Duplo clique para ver detalhes"
                  >
                    <TableCell className="p-2">
                      {hasMultipleItems && (
                        <button
                          onClick={(e) => toggleSale(sale.id, e)}
                          className="p-1 hover:bg-muted rounded-lg transition-colors"
                        >
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform text-muted-foreground",
                            isExpanded && "rotate-90"
                          )} />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-primary whitespace-nowrap">
                      {sale.numero_lancamento}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {formatInTimeZone(getSaleDateTimeUtc(sale), 'America/Sao_Paulo', 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatInTimeZone(getSaleDateTimeUtc(sale), 'America/Sao_Paulo', 'HH:mm:ss', { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate" title={sale.nome_filial || ''}>
                        {sale.nome_filial || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasMultipleItems ? (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-accent shrink-0" />
                          <span className="font-medium text-accent">
                            {items.length} produtos
                          </span>
                        </div>
                      ) : (
                        <div className="truncate" title={items[0]?.produto || ''}>
                          {items[0]?.produto || '-'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="truncate text-sm" title={primaryTabela}>
                        {primaryTabela}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate text-sm max-w-[120px]" title={sale.formas_pagamento || ''}>
                        {sale.formas_pagamento || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold whitespace-nowrap text-status-ok">
                      R$ {formatCurrency(sale.vlr_liquido)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={cn(
                        'font-mono font-semibold',
                        highDiscount && 'text-status-alert'
                      )}>
                        {formatPercent(sale.perc_desconto)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={cn(
                        'font-mono font-semibold',
                        Number(sale.margem_perc) >= 20 ? 'text-status-ok' :
                        lowMargin ? 'text-status-alert' : ''
                      )}>
                        {formatPercent(sale.margem_perc)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={hasAlerta ? 'ALERTA' : 'OK'} />
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Items */}
                  {isExpanded && items.map((item, itemIndex) => {
                    const itemHighDiscount = item.perc_desconto > 20;
                    const itemLowMargin = item.margem_perc < 15;
                    const itemHasAlerta = item.alerta_auditoria && item.alerta_auditoria !== 'OK' && item.alerta_auditoria.toLowerCase().includes('alerta');
                    
                    return (
                      <TableRow 
                        key={`${sale.id}-item-${itemIndex}`}
                        className={cn(
                          'cursor-pointer transition-all duration-200 hover:bg-table-row-hover bg-secondary/30 border-border/20',
                          itemHasAlerta && 'row-alert'
                        )}
                        onDoubleClick={() => handleRowDoubleClick(sale)}
                        title="Duplo clique para ver detalhes"
                      >
                        <TableCell className="p-2"></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          └
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground font-mono">
                            SKU: {item.sku || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            Qtd: {item.qtd}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm truncate" title={item.produto || ''}>
                            {item.produto || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="truncate" title={item.tabela_usada || ''}>
                            {item.tabela_usada || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                          R$ {formatCurrency(item.vlr_liquido)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                          R$ {formatCurrency(item.vlr_liquido)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className={cn(
                            'font-mono text-sm',
                            itemHighDiscount && 'text-status-alert'
                          )}>
                            {formatPercent(item.perc_desconto)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className={cn(
                            'font-mono text-sm',
                            item.margem_perc >= 20 ? 'text-status-ok' :
                            itemLowMargin ? 'text-status-alert' : ''
                          )}>
                            {formatPercent(item.margem_perc)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={item.alerta_auditoria} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              );
            })}
          </TableBody>
        </Table>
        
        {sortedSales.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">Nenhuma venda encontrada</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </div>
        )}
        
        {/* Summary */}
        <div className="px-6 py-4 glass-effect border-t border-border/30 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{sortedSales.length}</span> vendas • 
          <span className="font-semibold text-foreground ml-1">
            {sortedSales.reduce((acc, s) => acc + getItems(s).length, 0)}
          </span> itens no total
        </div>
      </div>

      <SaleDetailModal 
        sale={selectedSale} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
      />
    </>
  );
}
