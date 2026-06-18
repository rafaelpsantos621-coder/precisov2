'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>; // Ajustado o retorno no tipo
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  signInWithEmail: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserSession = async (currentUser: User | null) => {
    setUser(currentUser);
    
    if (currentUser) {
      let userRole = 'OPERADOR';

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (profile?.role) {
          userRole = profile.role;
        } else if (currentUser.user_metadata?.role) {
          userRole = currentUser.user_metadata.role;
        }
      } catch (err) {
        console.warn('Erro ao buscar profile, usando metadados do auth:', err);
        if (currentUser.user_metadata?.role) {
          userRole = currentUser.user_metadata.role;
        }
      }

      setRole(userRole);
    } else {
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Modificado aqui: Retorna diretamente o objeto de erro para a LoginPage ler corretamente
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setLoading(false);
  };

  const isAdmin = role === 'ADMINISTRADOR';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, signOut, signInWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);