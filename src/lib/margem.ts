import { Award, CheckCircle2, AlertTriangle, TrendingDown, LucideIcon } from 'lucide-react';

export type FaixaMargem = 'excelente' | 'boa' | 'atencao' | 'critica';

/** Piso de cada faixa, em % de margem. Mexa aqui para mudar a régua no app inteiro. */
export const LIMITES_MARGEM = {
  excelente: 25,
  boa: 20,
  atencao: 15,
} as const;

export function faixaMargem(margemPerc: number): FaixaMargem {
  if (margemPerc >= LIMITES_MARGEM.excelente) return 'excelente';
  if (margemPerc >= LIMITES_MARGEM.boa) return 'boa';
  if (margemPerc >= LIMITES_MARGEM.atencao) return 'atencao';
  return 'critica';
}

interface FaixaConfig {
  label: string;
  icon: LucideIcon;
  /** Cor do número/texto */
  text: string;
  /** Preenchimento da barra */
  bar: string;
  /** Pílula de status */
  badge: string;
}

/**
 * Crítica usa VERMELHO, não o laranja de alerta de auditoria: são conceitos
 * diferentes (margem baixa x preço de tabela errado) e, além disso, amarelo e
 * laranja ficam indistinguíveis lado a lado mesmo para quem enxerga cores normalmente.
 * Toda faixa carrega ícone + texto — a cor nunca é o único sinal.
 */
export const FAIXA_MARGEM_CONFIG: Record<FaixaMargem, FaixaConfig> = {
  excelente: {
    label: 'Excelente',
    icon: Award,
    text: 'text-primary',
    bar: 'bg-primary',
    badge: 'bg-primary/10 text-primary border-primary/40',
  },
  boa: {
    label: 'Boa',
    icon: CheckCircle2,
    text: 'text-status-ok',
    bar: 'bg-status-ok',
    badge: 'bg-status-ok-bg text-status-ok-foreground border-status-ok/40',
  },
  atencao: {
    label: 'Atenção',
    icon: AlertTriangle,
    text: 'text-status-warning',
    bar: 'bg-status-warning',
    badge: 'bg-status-warning-bg text-status-warning-foreground border-status-warning/40',
  },
  critica: {
    label: 'Crítica',
    icon: TrendingDown,
    text: 'text-status-critical',
    bar: 'bg-status-critical',
    badge: 'bg-status-critical-bg text-status-critical-foreground border-status-critical/40',
  },
};

/** Atalho para colorir só um número de margem */
export function corMargem(margemPerc: number): string {
  return FAIXA_MARGEM_CONFIG[faixaMargem(margemPerc)].text;
}

/** Ex.: "Excelente ≥ 25% · Boa ≥ 20% · Atenção ≥ 15% · Crítica < 15%" */
export const LEGENDA_MARGEM = `Excelente ≥ ${LIMITES_MARGEM.excelente}% · Boa ≥ ${LIMITES_MARGEM.boa}% · Atenção ≥ ${LIMITES_MARGEM.atencao}% · Crítica < ${LIMITES_MARGEM.atencao}%`;
