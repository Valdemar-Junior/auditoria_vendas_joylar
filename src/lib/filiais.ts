/** A filial atacadista fica fora da análise, a menos que seja marcada manualmente */
export const isFilialAtacadista = (filial: string) => filial.toUpperCase().includes('ATACADISTA');

/** Resolve a seleção de filiais: null = padrão (todas menos a atacadista) */
export const resolverFiliais = (selecionadas: string[] | null, opcoes: string[]) =>
  selecionadas ?? opcoes.filter((f) => !isFilialAtacadista(f));
