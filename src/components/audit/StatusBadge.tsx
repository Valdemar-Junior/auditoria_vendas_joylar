import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'OK') {
    return (
      <span className={cn('status-badge-ok', className)}>
        <Check className="h-3.5 w-3.5" />
        OK
      </span>
    );
  }

  // Detecta alertas: tanto "ALERTA" quanto "ALERTA: mensagem..."
  const isAlerta = status === 'ALERTA' || (status && status.toLowerCase().startsWith('alerta'));

  if (isAlerta) {
    return (
      <span className={cn('status-badge-alert whitespace-nowrap', className)}>
        <AlertTriangle className="h-3.5 w-3.5" />
        ALERTA
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap', className)}>
      {status || 'N/A'}
    </span>
  );
}
