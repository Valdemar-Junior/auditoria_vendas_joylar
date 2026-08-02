import { Sale, SaleItem } from '@/types/sales';

export interface SubgrupoResumo {
  subgrupo: string;
  /** Quantidade de linhas de produto */
  itens: number;
  /** Soma das quantidades vendidas */
  qtdVendida: number;
  /** Quantidade de vendas distintas que contêm este subgrupo */
  vendas: number;
  faturamento: number;
  descontoReais: number;
  lucro: number;
  /** Margem REAL: lucro ÷ faturamento. Um item de R$ 3.000 pesa mais que um de R$ 9,90. */
  margemPerc: number;
  /** Desconto real: desconto ÷ (faturamento + desconto) */
  descontoPerc: number;
  /** Fatia deste subgrupo no faturamento total */
  participacaoPerc: number;
}

export interface AnaliseSubgrupos {
  linhas: SubgrupoResumo[];
  totalFaturamento: number;
  totalDesconto: number;
  totalLucro: number;
  totalItens: number;
  /** Margem geral ponderada de todos os subgrupos somados */
  margemGeral: number;
  descontoGeral: number;
}

/** Totais de um recorte de subgrupos — o que os cards mostram */
export interface TotaisSubgrupos {
  faturamento: number;
  desconto: number;
  lucro: number;
  itens: number;
  vendas: number;
  /** Margem ponderada do recorte: lucro somado ÷ faturamento somado */
  margemPerc: number;
  descontoPerc: number;
}

const SEM_SUBGRUPO = 'SEM SUBGRUPO';

/**
 * Agrupa os itens (que vivem dentro do JSONB `items`) por subgrupo.
 *
 * Toda porcentagem aqui é PONDERADA pelo valor — média simples de percentuais
 * distorce muito quando o subgrupo mistura ticket alto e ticket baixo.
 */
export function analisarSubgrupos(sales: Sale[]): AnaliseSubgrupos {
  const mapa = new Map<string, SubgrupoResumo & { vendasIds: Set<string> }>();

  let totalFaturamento = 0;
  let totalDesconto = 0;
  let totalLucro = 0;
  let totalItens = 0;

  sales.forEach((sale) => {
    const items = (sale.items as unknown as SaleItem[]) || [];

    items.forEach((item) => {
      const chave = item.subgrupo || SEM_SUBGRUPO;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          subgrupo: chave,
          itens: 0,
          qtdVendida: 0,
          vendas: 0,
          faturamento: 0,
          descontoReais: 0,
          lucro: 0,
          margemPerc: 0,
          descontoPerc: 0,
          participacaoPerc: 0,
          vendasIds: new Set<string>(),
        });
      }

      const linha = mapa.get(chave)!;
      const liquido = Number(item.vlr_liquido) || 0;
      const desconto = Number(item.vlr_desconto) || 0;
      const lucro = Number(item.lucro_reais) || 0;

      linha.itens += 1;
      linha.qtdVendida += Number(item.qtd) || 0;
      linha.faturamento += liquido;
      linha.descontoReais += desconto;
      linha.lucro += lucro;
      linha.vendasIds.add(sale.id);

      totalFaturamento += liquido;
      totalDesconto += desconto;
      totalLucro += lucro;
      totalItens += 1;
    });
  });

  const linhas = [...mapa.values()]
    .map(({ vendasIds, ...linha }) => ({
      ...linha,
      vendas: vendasIds.size,
      margemPerc: linha.faturamento > 0 ? (linha.lucro / linha.faturamento) * 100 : 0,
      descontoPerc:
        linha.faturamento + linha.descontoReais > 0
          ? (linha.descontoReais / (linha.faturamento + linha.descontoReais)) * 100
          : 0,
      participacaoPerc: totalFaturamento > 0 ? (linha.faturamento / totalFaturamento) * 100 : 0,
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  return {
    linhas,
    totalFaturamento,
    totalDesconto,
    totalLucro,
    totalItens,
    margemGeral: totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0,
    descontoGeral:
      totalFaturamento + totalDesconto > 0
        ? (totalDesconto / (totalFaturamento + totalDesconto)) * 100
        : 0,
  };
}

/**
 * Soma um recorte de subgrupos. Como cada linha já traz os valores em reais,
 * dá para recalcular a margem do recorte sem varrer as vendas de novo — e ela
 * sai ponderada de graça, porque somamos lucro e faturamento antes de dividir.
 *
 * `vendas` é uma soma simples: uma venda que tenha colchão e móvel conta nos
 * dois subgrupos, então o total pode passar do número real de vendas.
 */
export function somarSubgrupos(linhas: SubgrupoResumo[]): TotaisSubgrupos {
  const faturamento = linhas.reduce((acc, l) => acc + l.faturamento, 0);
  const desconto = linhas.reduce((acc, l) => acc + l.descontoReais, 0);
  const lucro = linhas.reduce((acc, l) => acc + l.lucro, 0);
  const bruto = faturamento + desconto;

  return {
    faturamento,
    desconto,
    lucro,
    itens: linhas.reduce((acc, l) => acc + l.itens, 0),
    vendas: linhas.reduce((acc, l) => acc + l.vendas, 0),
    margemPerc: faturamento > 0 ? (lucro / faturamento) * 100 : 0,
    descontoPerc: bruto > 0 ? (desconto / bruto) * 100 : 0,
  };
}
