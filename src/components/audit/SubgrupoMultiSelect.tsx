import { Check, ChevronDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface OpcaoSubgrupo {
  subgrupo: string;
  faturamento: number;
  participacaoPerc: number;
}

interface SubgrupoMultiSelectProps {
  opcoes: OpcaoSubgrupo[];
  /** null = todos no estado inicial; lista vazia = nenhum */
  selecionados: string[] | null;
  onChange: (selecionados: string[]) => void;
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SubgrupoMultiSelect({ opcoes, selecionados, onChange }: SubgrupoMultiSelectProps) {
  const nomes = opcoes.map((o) => o.subgrupo);
  const selecaoAtual = (selecionados ?? nomes).filter((subgrupo) => nomes.includes(subgrupo));
  const todos = opcoes.length > 0 && selecaoAtual.length === opcoes.length;

  const alternar = (subgrupo: string) => {
    onChange(
      selecaoAtual.includes(subgrupo)
        ? selecaoAtual.filter((s) => s !== subgrupo)
        : [...selecaoAtual, subgrupo]
    );
  };

  const rotulo = () => {
    if (todos) return 'Todos os subgrupos';
    if (selecaoAtual.length === 0) return 'Nenhum subgrupo';
    if (selecaoAtual.length === 1) return selecaoAtual[0];
    return `${selecaoAtual.length} subgrupos`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          aria-label="Selecionar subgrupos para analisar"
        >
          <span className="flex items-center gap-2 truncate">
            <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{rotulo()}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[26rem] max-w-[calc(100vw-2rem)] p-0" align="start">
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b">
          <span className="text-sm font-medium">Analisar quais subgrupos</span>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onChange(nomes)}
              disabled={todos || opcoes.length === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Marcar todos
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selecaoAtual.length === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Desmarcar todos
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
          {opcoes.map((opcao) => {
            const marcado = selecaoAtual.includes(opcao.subgrupo);
            return (
              <label
                key={opcao.subgrupo}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/60 transition-colors"
              >
                <Checkbox
                  checked={marcado}
                  onCheckedChange={() => alternar(opcao.subgrupo)}
                  aria-label={opcao.subgrupo}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{opcao.subgrupo}</span>
                  <span className="block text-xs text-muted-foreground font-mono">
                    R$ {formatCurrency(opcao.faturamento)} • {opcao.participacaoPerc.toFixed(1)}% do total
                  </span>
                </span>
                {marcado && <Check className={cn('h-3.5 w-3.5 text-primary shrink-0')} />}
              </label>
            );
          })}
        </div>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {selecaoAtual.length} de {opcoes.length} selecionados
        </div>
      </PopoverContent>
    </Popover>
  );
}
