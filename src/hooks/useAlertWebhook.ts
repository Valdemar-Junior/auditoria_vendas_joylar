import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem } from '@/types/sales';

const SENT_ALERTS_KEY = 'sent_alert_webhooks';

const getAlertReasons = (sale: Sale): string[] => {
  if (!sale.items || !Array.isArray(sale.items)) return [];
  
  return (sale.items as unknown as SaleItem[])
    .filter(item => 
      item.alerta_auditoria && 
      item.alerta_auditoria.toLowerCase() !== 'ok' &&
      item.alerta_auditoria.toLowerCase().includes('alerta')
    )
    .map(item => `${item.produto}: ${item.alerta_auditoria}`);
};

const getSentAlerts = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SENT_ALERTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markAlertAsSent = (saleId: string) => {
  const sentAlerts = getSentAlerts();
  sentAlerts.add(saleId);
  localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify([...sentAlerts]));
};

export function useAlertWebhook() {
  const sendingRef = useRef<Set<string>>(new Set());

  const sendAlertWebhook = useCallback(async (sale: Sale) => {
    // Prevent duplicate sends
    if (sendingRef.current.has(sale.id)) return;
    
    const sentAlerts = getSentAlerts();
    if (sentAlerts.has(sale.id)) return;

    const alertReasons = getAlertReasons(sale);
    if (alertReasons.length === 0) return;

    sendingRef.current.add(sale.id);

    try {
      console.log(`Sending alert webhook for sale #${sale.numero_lancamento}`);
      
      const { error } = await supabase.functions.invoke('send-alert-webhook', {
        body: { sale, alertReasons },
      });

      if (error) {
        console.error('Failed to send alert webhook:', error);
      } else {
        console.log(`Alert webhook sent for sale #${sale.numero_lancamento}`);
        markAlertAsSent(sale.id);
      }
    } catch (err) {
      console.error('Error sending alert webhook:', err);
    } finally {
      sendingRef.current.delete(sale.id);
    }
  }, []);

  const processAlertsForSales = useCallback((sales: Sale[]) => {
    const sentAlerts = getSentAlerts();
    
    sales.forEach(sale => {
      if (sentAlerts.has(sale.id)) return;
      
      const alertReasons = getAlertReasons(sale);
      if (alertReasons.length > 0) {
        sendAlertWebhook(sale);
      }
    });
  }, [sendAlertWebhook]);

  return { sendAlertWebhook, processAlertsForSales };
}
