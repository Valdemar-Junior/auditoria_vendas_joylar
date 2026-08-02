import { useState, FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const { session, carregando, entrar } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Já logado: volta para onde tentou ir antes de cair aqui
  if (session) {
    const destino = (location.state as { de?: string } | null)?.de ?? '/';
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { erro: falha } = await entrar(email.trim(), senha);
    if (falha) setErro(falha);
    setEnviando(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-2xl bg-primary/10 p-3 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Auditoria de Vendas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Entre para acessar o painel</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card shadow-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-status-critical-bg border border-status-critical/40 p-3 text-sm text-status-critical-foreground"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Acesso restrito. Fale com o administrador para liberar um usuário.
        </p>
      </div>
    </div>
  );
};

export default Login;
