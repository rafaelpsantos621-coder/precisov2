'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserSession = async (currentUser: User | null) => {
    setUser(currentUser);
    
    if (currentUser) {
      // Busca a função/cargo direto do perfil para garantir consistência global
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()
        .catch(() => ({ data: null }));

      const userRole = profile?.role || currentUser.user_metadata?.role || 'OPERADOR';
      setRole(userRole);
    } else {
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Carrega a sessão inicial
    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      handleUserSession(initialUser);
    });

    // ⚡ A CHAVE DA SOLUÇÃO: Escuta alterações na sessão (USER_UPDATED) em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setLoading(false);
      } else if (session?.user) {
        // Se o usuário atualizou o perfil (USER_UPDATED) ou mudou o estado, renova o Context global
        await handleUserSession(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  const isAdmin = role?.toUpperCase() === 'ADMINISTRADOR' || role?.toUpperCase() === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);