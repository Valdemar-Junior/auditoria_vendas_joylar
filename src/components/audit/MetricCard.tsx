import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant: 'primary' | 'alert' | 'success' | 'neutral' | 'purple' | 'orange';
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon: Icon, variant, className }: MetricCardProps) {
  const iconColors = {
    primary: 'text-primary',
    alert: 'text-status-alert',
    success: 'text-status-ok',
    neutral: 'text-muted-foreground',
    purple: 'text-accent',
    orange: 'text-status-alert',
  };

  const iconBgColors = {
    primary: 'bg-primary/15',
    alert: 'bg-status-alert/15',
    success: 'bg-status-ok/15',
    neutral: 'bg-muted',
    purple: 'bg-accent/15',
    orange: 'bg-status-alert/15',
  };

  return (
    <div className={cn(
      'metric-card opacity-0 animate-fade-in',
      `metric-card-${variant}`,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-3',
          iconBgColors[variant],
          iconColors[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}