import { Tables } from '@/integrations/supabase/types';

export type Sale = Tables<'sales'>;

export interface SaleItem {
  qtd: number;
  sku: string;
  produto: string;
  vlr_bruto: number;
  vlr_liquido: number;
  vlr_desconto: number;
  perc_desconto: number;
  margem_perc: number;
  lucro_reais: number;
  tabela_usada: string;
  tabelas_onde_existe: string;
  alerta_auditoria: string;
  local_estoque: string;
  prc_venda_unitario: number;
}

export type PeriodType = 'hoje' | 'mes' | 'intervalo';

export interface SalesFilters {
  periodType: PeriodType;
  dateRange: { from: Date | undefined; to: Date | undefined };
  filial: string;
  vendedor: string;
  lancamento: string;
  tabela: string;
  operacao: string;
  alertaStatus: string;
  descontoMinimo: number;
}

export interface SalesMetrics {
  totalVendas: number;
  vendasComAlerta: number;
  percentualDescontoMedio: number;
  margemMedia: number;
}
