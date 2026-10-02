import { Building2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FilialMultiSelectProps {
  opcoes: string[];
  /** Filiais marcadas; lista vazia = nenhuma */
  selecionadas: string[];
  onChange: (selecionadas: string[]) => void;
}

export function FilialMultiSelect({ opcoes, selecionadas, onChange }: FilialMultiSelectProps) {
  const selecaoAtual = selecionadas.filter((f) => opcoes.includes(f));
  const todas = opcoes.length > 0 && selecaoAtual.length === opcoes.length;

  const alternar = (filial: string) => {
    onChange(
      selecaoAtual.includes(filial)
        ? selecaoAtual.filter((f) => f !== filial)
        : [...selecaoAtual, filial]
    );
  };

  const rotulo = () => {
    if (todas) return 'Todas as filiais';
    if (selecaoAtual.length === 0) return 'Nenhuma filial';
    if (selecaoAtual.length === 1) return selecaoAtual[0];
    return `${selecaoAtual.length} filiais`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          aria-label="Selecionar filiais para analisar"
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{rotulo()}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[22rem] max-w-[calc(100vw-2rem)] p-0" align="start">
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b">
          <span className="text-sm font-medium">Filiais</span>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onChange(opcoes)}
              disabled={todas || opcoes.length === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Marcar todas
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selecaoAtual.length === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Desmarcar todas
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
          {opcoes.map((filial) => {
            const marcada = selecaoAtual.includes(filial);
            return (
              <label
                key={filial}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/60 transition-colors"
              >
                <Checkbox
                  checked={marcada}
                  onCheckedChange={() => alternar(filial)}
                  aria-label={filial}
                />
                <span className="flex-1 min-w-0 text-sm truncate">{filial}</span>
                {marcada && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </label>
            );
          })}
        </div>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {selecaoAtual.length} de {opcoes.length} selecionadas
        </div>
      </PopoverContent>
    </Popover>
  );
}
