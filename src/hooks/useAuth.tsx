import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** true enquanto a sessão do localStorage ainda não foi checada */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<{ erro: string | null }>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Traduz os erros do Supabase Auth, que vêm em inglês */
function traduzErro(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(mensagem)) return 'E-mail ainda não confirmado.';
  if (/too many requests|rate limit/i.test(mensagem))
    return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  if (/failed to fetch|network/i.test(mensagem)) return 'Sem conexão com o servidor.';
  return mensagem;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // onAuthStateChange dispara com a sessão restaurada do localStorage no
    // primeiro registro, então ele já cobre a checagem inicial.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setCarregando(false);
    });

    // Rede de segurança: se o evento inicial não vier, não trava a tela.
    supabase.auth.getSession().then(({ data: { session: atual } }) => {
      setSession(atual);
      setCarregando(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const entrar = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return { erro: error ? traduzErro(error.message) : null };
  };

  const sair = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
