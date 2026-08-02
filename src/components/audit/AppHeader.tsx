import { RefreshCw, LayoutList, PieChart, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  onRefresh: () => void;
  isFetching: boolean;
}

const abas = [
  { to: '/', label: 'Auditoria', icon: LayoutList },
  { to: '/margem-subgrupo', label: 'Margem por Subgrupo', icon: PieChart },
];

export function AppHeader({ title, subtitle, lastUpdated, onRefresh, isFetching }: AppHeaderProps) {
  const { user, sair } = useAuth();

  return (
    <header className="border-b border-border/50 glass-effect sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden md:inline">Última atualização:</span>
              <span className="font-medium text-foreground">{lastUpdated}</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Atualizar
            </button>
            <button
              onClick={sair}
              title={user?.email ? `Sair (${user.email})` : 'Sair'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>

        <nav className="flex gap-1 mt-4 -mb-6 overflow-x-auto scrollbar-thin">
          {abas.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="!border-primary !text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
