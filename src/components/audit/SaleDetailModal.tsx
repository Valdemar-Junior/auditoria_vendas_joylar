import { AlertTriangle, Tag, Package, User, Building2, Receipt, ShieldCheck, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import { Sale, SaleItem } from '@/types/sales';
import { cn } from '@/lib/utils';

interface SaleDetailModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailModal({ sale, open, onOpenChange }: SaleDetailModalProps) {
  if (!sale) return null;

  const items = (sale.items as unknown as SaleItem[]) || [];
  
  // Verifica alerta nos itens (a coluna alerta_auditoria da venda não é confiável)
  const hasItemAlert = items.some(item => 
    item.alerta_auditoria && 
    item.alerta_auditoria !== 'OK' && 
    item.alerta_auditoria.toLowerCase().includes('alerta')
  );
  
  // Coleta os motivos de alerta dos itens
  const alertReasons = items
    .filter(item => item.alerta_auditoria && item.alerta_auditoria !== 'OK' && item.alerta_auditoria.toLowerCase().includes('alerta'))
    .map(item => item.alerta_auditoria);

  const parseTabelasExiste = (tabelas: string | null) => {
    if (!tabelas) return [];
    return tabelas.split(' | ').map((item) => {
      const [nome, preco] = item.split(': ');
      return { nome, preco };
    });
  };

  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return (isNaN(num) ? 0 : num).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatPercent = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return (isNaN(num) ? 0 : num).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                Lançamento #{sale.numero_lancamento}
                <StatusBadge status={hasItemAlert ? 'ALERTA' : 'OK'} />
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatInTimeZone(
                  new Date(`${(sale.sale_date || sale.data_emissao).slice(0, 10)}T${(sale.hora_emissao || '00:00:00').slice(0, 8)}Z`),
                  'America/Sao_Paulo',
                  "dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR }
                )}{' '}
                às{' '}
                {formatInTimeZone(
                  new Date(`${(sale.sale_date || sale.data_emissao).slice(0, 10)}T${(sale.hora_emissao || '00:00:00').slice(0, 8)}Z`),
                  'America/Sao_Paulo',
                  'HH:mm:ss',
                  { locale: ptBR }
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Alert Banner - mostra motivo específico dos itens */}
          {hasItemAlert && (
            <div className="rounded-lg bg-status-alert-bg border border-status-alert/30 p-4 animate-fade-in">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-status-alert shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-status-alert-foreground">Atenção: Possível irregularidade detectada</p>
                  {alertReasons.map((reason, idx) => (
                    <p key={idx} className="text-sm text-status-alert-foreground/80 bg-status-alert/10 rounded px-2 py-1">
                      {reason}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Produtos ({items.length})
            </h4>
            <div className="space-y-3">
              {items.map((item, index) => {
                const tabelasDisponiveis = parseTabelasExiste(item.tabelas_onde_existe);
                const itemHasAlerta = item.alerta_auditoria && item.alerta_auditoria !== 'OK' && item.alerta_auditoria.toLowerCase().includes('alerta');
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "rounded-lg border p-4 space-y-3",
                      itemHasAlerta && "border-status-alert/50 bg-status-alert-bg/30"
                    )}
                  >
                    {/* Product Header */}
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{item.produto || '-'}</p>
                          {itemHasAlerta && <StatusBadge status="ALERTA" />}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">SKU: {item.sku || '-'}</p>
                      </div>
                    </div>

                    {/* Product Values Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Quantidade</p>
                        <p className="font-mono font-medium">{item.qtd}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Valor Líquido</p>
                        <p className="font-mono font-medium">R$ {formatCurrency(item.vlr_liquido)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Desconto</p>
                        <p className={cn(
                          "font-mono font-medium",
                          item.perc_desconto > 20 && "text-status-alert"
                        )}>
                          {formatPercent(item.perc_desconto)}%
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Tabela Usada</p>
                        <p className="font-medium truncate" title={item.tabela_usada}>{item.tabela_usada || '-'}</p>
                      </div>
                    </div>

                    {/* Product Margin & Profit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          item.margem_perc >= 20 ? "text-status-ok" :
                          item.margem_perc >= 15 ? "text-status-warning" : "text-status-alert"
                        )} />
                        <div>
                          <p className="text-xs text-muted-foreground">Margem</p>
                          <p className={cn(
                            "font-mono font-bold",
                            item.margem_perc >= 20 ? "text-status-ok" :
                            item.margem_perc >= 15 ? "text-status-warning" : "text-status-alert"
                          )}>
                            {formatPercent(item.margem_perc)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lucro</p>
                          <p className={cn(
                            "font-mono font-bold",
                            item.lucro_reais >= 100 ? "text-status-ok" : "text-muted-foreground"
                          )}>
                            R$ {formatCurrency(item.lucro_reais)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Available Tables */}
                    {tabelasDisponiveis.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Tabelas Disponíveis</p>
                        <div className="flex flex-wrap gap-2">
                          {tabelasDisponiveis.map((tabela, tIndex) => {
                            const isUsed = item.tabela_usada === tabela.nome;
                            const isPromo = tabela.nome.toLowerCase().includes('black') || tabela.nome.toLowerCase().includes('promo');
                            
                            return (
                              <div 
                                key={tIndex}
                                className={cn(
                                  'rounded-lg border px-3 py-1.5 flex items-center gap-2 text-sm',
                                  isUsed && 'border-primary bg-primary/5',
                                  itemHasAlerta && isPromo && !isUsed && 'border-status-alert/50 bg-status-alert-bg/50'
                                )}
                              >
                                <Tag className={cn(
                                  'h-3 w-3',
                                  isUsed ? 'text-primary' : 'text-muted-foreground'
                                )} />
                                <span className={cn(isUsed && 'text-primary font-medium')}>
                                  {tabela.nome}: {tabela.preco}
                                </span>
                                {isUsed && (
                                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                    Usada
                                  </span>
                                )}
                                {itemHasAlerta && isPromo && !isUsed && (
                                  <span className="text-xs bg-status-alert text-primary-foreground px-1.5 py-0.5 rounded">
                                    Deveria usar
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sale Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informações da Venda</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Filial:</span>
                  <span className="font-medium">{sale.nome_filial || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium">{sale.nome_vendedor || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{sale.nome_cliente || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Operação:</span>
                  <span className="font-medium">{sale.operacao || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pagamento:</span>
                  <span className="font-medium">{sale.formas_pagamento || '-'}</span>
                </div>
                {sale.teve_liberacao === 'SIM' && (
                  <div className="flex items-center gap-2 text-sm mt-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="text-amber-800 dark:text-amber-400 font-medium">Liberação autorizada</span>
                      {sale.quem_autorizou && (
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                          Por: {sale.quem_autorizou}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Totais da Venda</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Bruto:</span>
                  <span className="font-mono font-medium">R$ {formatCurrency(sale.vlr_bruto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className={cn(
                    'font-mono font-medium',
                    parseFloat(String(sale.perc_desconto ?? 0)) > 20 && 'text-status-alert'
                  )}>
                    R$ {formatCurrency(sale.vlr_desconto)} ({formatPercent(sale.perc_desconto)}%)
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Valor Líquido:</span>
                  <span className="font-mono">R$ {formatCurrency(sale.vlr_liquido)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* General Margin and Profit */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Margem Geral</p>
                <p className={cn(
                  'text-2xl font-bold font-mono',
                  parseFloat(String(sale.margem_perc ?? 0)) >= 20 ? 'text-status-ok' : 
                  parseFloat(String(sale.margem_perc ?? 0)) >= 15 ? 'text-status-warning' : 'text-status-alert'
                )}>
                  {formatPercent(sale.margem_perc)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={cn(
                  'text-2xl font-bold font-mono',
                  parseFloat(String(sale.lucro_reais ?? 0)) >= 200 ? 'text-status-ok' : 'text-muted-foreground'
                )}>
                  R$ {formatCurrency(sale.lucro_reais)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
