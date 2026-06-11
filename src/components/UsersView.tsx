'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Shield, KeyRound, RefreshCw, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  display_name: string | null;
  role: string;
  blocked: boolean;
  email?: string;
  image_url?: string;
}

export default function UsersView() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // 1. Busca os perfis da tabela pública 'profiles'
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, role, blocked, image_url')
        .order('role', { ascending: false });

      if (profileError) throw profileError;

      // 2. Busca a lista oficial de usuários do Auth de forma segura
      let authUsers: any[] = [];
      try {
        const { data } = await supabase.auth.admin.listUsers();
        if (data && data.users) authUsers = data.users;
      } catch (e) {
        console.warn('Sincronizando dados complementares via sessão local.');
      }

      // 3. Mescla os dados tratando variações de nomes de chaves do metadado
      const merged = (profiles || []).map(p => {
        const authUser = authUsers?.find((u: any) => u.id === p.id);
        const metadata = authUser?.user_metadata || {};

        return {
          ...p,
          display_name: metadata.name || metadata.display_name || p.display_name || authUser?.email?.split('@')[0] || 'Usuário',
          role: metadata.role || p.role || 'Analista',
          // Captura total: Tenta ler todas as variações de chaves possíveis de imagem
          image_url: metadata.image_url || metadata.image || p.image_url || '', 
          email: authUser?.email || '—',
        };
      });

      setUsers(merged);
    } catch (e: any) {
      console.error('Erro na carga de usuários:', e);
      showToast('Falha ao sincronizar dados da tabela de perfis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const toggleBlock = async (user: UserProfile) => {
    setSavingId(user.id);
    try {
      const nextBlockState = !user.blocked;
      const { error } = await supabase
        .from('profiles')
        .update({ blocked: nextBlockState })
        .eq('id', user.id);

      if (error) throw error;

      showToast(
        nextBlockState 
          ? `${user.display_name || 'Usuário'} foi bloqueado.` 
          : `${user.display_name || 'Usuário'} foi desblo