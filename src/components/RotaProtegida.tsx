import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Barreira de navegação. Não é o que protege os dados — quem protege é o RLS
 * no Postgres (ver supabase/migrations/20260802000000_rls_sales.sql). Sem sessão
 * válida o Supabase não devolve nenhuma linha, mesmo que alguém burle esta tela.
 */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { session, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Verificando acesso...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  }

  return <>{children}</>;
}
