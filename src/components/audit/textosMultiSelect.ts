/** Textos já flexionados no gênero certo ("Todas as filiais" / "Todos os subgrupos") */
export interface TextosMultiSelect {
  titulo: string;
  todos: string;
  nenhum: string;
  /** Recebe a quantidade: "3 filiais" */
  varios: (quantidade: number) => string;
  marcarTodos: string;
  desmarcarTodos: string;
  selecionados: string;
}

export const TEXTOS_FILIAIS: TextosMultiSelect = {
  titulo: 'Filiais',
  todos: 'Todas as filiais',
  nenhum: 'Nenhuma filial',
  varios: (n) => `${n} filiais`,
  marcarTodos: 'Marcar todas',
  desmarcarTodos: 'Desmarcar todas',
  selecionados: 'selecionadas',
};

export const TEXTOS_SUBGRUPOS: TextosMultiSelect = {
  titulo: 'Subgrupos',
  todos: 'Todos os subgrupos',
  nenhum: 'Nenhum subgrupo',
  varios: (n) => `${n} subgrupos`,
  marcarTodos: 'Marcar todos',
  desmarcarTodos: 'Desmarcar todos',
  selecionados: 'selecionados',
};
