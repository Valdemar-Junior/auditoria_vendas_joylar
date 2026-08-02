import { Check, ChevronDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface OpcaoSubgrupo {
  subgrupo: string;
  faturamento: number;
}

interface SubgrupoMultiSelectProps {
  opcoes: OpcaoSubgrupo[];
  /** Lista vazia = todos os subgrupos */
  selecionados: string[];
  onChange: (selecionados: string[]) => void;
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SubgrupoMultiSelect({ opcoes, selecionados, onChange }: SubgrupoMultiSelectProps) {
  const todos = selecionados.length === 0;

  const alternar = (subgrupo: string) => {
    // Lista vazia significa "todos", então o primeiro clique parte de todos
    // marcados e desmarca só o que foi clicado.
    const base = todos ? opcoes.map((o) => o.subgrupo) : selecionados;
    const novo = base.includes(subgrupo)
      ? base.filter((s) => s !== subgrupo)
      : [...base, subgrupo];

    // Voltou a ter tudo marcado: normaliza para "todos"
    onChange(novo.length === opcoes.length ? [] : novo);
  };

  const rotulo = () => {
    if (todos) return 'Todos os subgrupos';
    if (selecionados.length === 0) return 'Nenhum subgrupo';
    if (selecionados.length === 1) return selecionados[0];
    return `${selecionados.length} subgrupos`;
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

      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Analisar quais subgrupos</span>
          <button
            onClick={() => onChange([])}
            disabled={todos}
            className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Todos
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
          {opcoes.map((opcao) => {
            const marcado = todos || selecionados.includes(opcao.subgrupo);
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
                    R$ {formatCurrency(opcao.faturamento)}
                  </span>
                </span>
                {marcado && <Check className={cn('h-3.5 w-3.5 text-primary shrink-0')} />}
              </label>
            );
          })}
        </div>

        {!todos && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {selecionados.length} de {opcoes.length} selecionados
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
