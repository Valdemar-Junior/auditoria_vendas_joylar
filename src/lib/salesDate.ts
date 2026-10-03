import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Sale } from '@/types/sales';

export const SALES_TIMEZONE = 'America/Sao_Paulo';

/**
 * Instante da venda. Data e hora vêm do ERP em UTC e sem timezone
 * (uma venda das 21h em Brasília chega como 00h do dia seguinte).
 */
export function getSaleDateTimeUtc(
  sale: Pick<Sale, 'data_emissao' | 'sale_date' | 'hora_emissao'>
): Date {
  const datePart = sale.sale_date || sale.data_emissao;
  const baseDate = typeof datePart === 'string' ? datePart.slice(0, 10) : '';
  const timePart = sale.hora_emissao?.slice(0, 8) || '00:00:00';

  // Ex: 2025-12-24T15:28:54Z
  return new Date(`${baseDate}T${timePart}Z`);
}

/** Dia da venda (YYYY-MM-DD) no horário de Brasília */
export function getSaleLocalDay(
  sale: Pick<Sale, 'data_emissao' | 'sale_date' | 'hora_emissao'>
): string {
  const instant = getSaleDateTimeUtc(sale);
  if (isNaN(instant.getTime())) return (sale.sale_date || sale.data_emissao).slice(0, 10);
  return formatInTimeZone(instant, SALES_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Compara o dia da venda em horário de Brasília com os dias do filtro.
 * O filtro é um intervalo de dias do calendário, então compara só YYYY-MM-DD.
 */
export function isSaleInDateRange(
  sale: Pick<Sale, 'data_emissao' | 'sale_date' | 'hora_emissao'>,
  from: Date | undefined,
  to: Date | undefined
): boolean {
  if (!from && !to) return true;

  const saleDay = getSaleLocalDay(sale);

  if (from && saleDay < format(from, 'yyyy-MM-dd')) return false;
  if (to && saleDay > format(to, 'yyyy-MM-dd')) return false;

  return true;
}
