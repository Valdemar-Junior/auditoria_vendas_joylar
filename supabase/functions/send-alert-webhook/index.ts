import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = 'https://n8n.joylar.shop/webhook/alerta';

interface SaleItem {
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

interface Sale {
  id: string;
  numero_lancamento: number;
  data_emissao: string;
  hora_emissao: string | null;
  nome_vendedor: string | null;
  nome_filial: string | null;
  nome_cliente: string | null;
  operacao: string | null;
  vlr_bruto: number | null;
  vlr_liquido: number | null;
  vlr_desconto: number | null;
  perc_desconto: number | null;
  margem_perc: number | null;
  lucro_reais: number | null;
  formas_pagamento: string | null;
  teve_liberacao: string | null;
  quem_autorizou: string | null;
  items: SaleItem[] | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sale, alertReasons } = await req.json() as { sale: Sale; alertReasons: string[] };

    console.log(`Sending webhook for sale #${sale.numero_lancamento} with ${alertReasons.length} alert(s)`);

    const payload = {
      venda: {
        id: sale.id,
        numero_lancamento: sale.numero_lancamento,
        data_emissao: sale.data_emissao,
        hora_emissao: sale.hora_emissao,
        filial: sale.nome_filial,
        vendedor: sale.nome_vendedor,
        cliente: sale.nome_cliente,
        operacao: sale.operacao,
        vlr_bruto: sale.vlr_bruto,
        vlr_liquido: sale.vlr_liquido,
        vlr_desconto: sale.vlr_desconto,
        perc_desconto: sale.perc_desconto,
        margem_perc: sale.margem_perc,
        lucro_reais: sale.lucro_reais,
        formas_pagamento: sale.formas_pagamento,
        teve_liberacao: sale.teve_liberacao,
        quem_autorizou: sale.quem_autorizou,
      },
      alertas: alertReasons,
      itens_com_alerta: sale.items?.filter(item =>
        item.alerta_auditoria &&
        item.alerta_auditoria.toLowerCase() !== 'ok' &&
        item.alerta_auditoria.toLowerCase().includes('alerta')
      ) || [],
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook failed with status ${response.status}: ${errorText}`);
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`Webhook sent successfully for sale #${sale.numero_lancamento}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
