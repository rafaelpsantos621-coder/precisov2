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
      let userRole = 'OPERADOR';

      try {
        // Busca o cargo direto da tabela pública de forma segura
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
    // Verifica a sessão atual ao carregar o componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user ?? null);
    });

    // Escuta mudanças de estado de autenticação (Login/Logout/Update)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setLoading(false);
  };

  const isAdmin = role === 'ADMINISTRADOR';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);