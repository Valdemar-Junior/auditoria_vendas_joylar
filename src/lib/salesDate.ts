import { Sale } from '@/types/sales';

/**
 * Compara apenas a parte YYYY-MM-DD da venda, ignorando timezone.
 * A data vem do ERP em UTC; converter para Date completo deslocaria o dia.
 */
export function isSaleInDateRange(
  sale: Pick<Sale, 'data_emissao'>,
  from: Date | undefined,
  to: Date | undefined
): boolean {
  if (!from && !to) return true;

  const [year, month, day] = sale.data_emissao.slice(0, 10).split('-').map(Number);
  const saleDate = new Date(year, month - 1, day);

  if (from) {
    const filterFrom = new Date(from);
    filterFrom.setHours(0, 0, 0, 0);
    if (saleDate < filterFrom) return false;
  }

  if (to) {
    const filterTo = new Date(to);
    filterTo.setHours(23, 59, 59, 999);
    if (saleDate > filterTo) return false;
  }

  return true;
}
