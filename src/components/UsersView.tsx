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

      // 2. Tenta buscar os dados da sessão do usuário logado atual para garantir o matching em tempo real
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // 3. Busca a lista oficial de usuários do Auth (se tiver permissão admin)
      let authUsers: any[] = [];
      try {
        const { data } = await supabase.auth.admin.listUsers();
        if (data && data.users) authUsers = data.users;
      } catch (e) {
        console.warn('Usando dados de metadados da sessão local para sincronização.');
      }

      // 4. Mescla os dados priorizando SEMPRE o user_metadata do Auth que foi salvo com sucesso
      const merged = (profiles || []).map(p => {
        // Verifica se o usuário do card é o usuário logado atual
        const isMe = currentUser && currentUser.id === p.id;
        
        // Pega o metadado (ou da lista admin, ou da sessão atual se for você mesmo)
        const authUser = authUsers?.find((u: any) => u.id === p.id);
        const metadata = isMe ? (currentUser?.user_metadata || {}) : (authUser?.user_metadata || {});

        return {
          ...p,
          // Se houver dado salvo no Auth (user_metadata), usa ele. Senão, cai no banco.
          display_name: metadata.name || metadata.display_name || p.display_name || authUser?.email?.split('@')[0] || 'Usuário',
          role: metadata.role || p.role || 'Analista',
          // ⚡ SOLUÇÃO DO CARD: Lê prioritariamente do metadado gerado pelo upload do bucket
          image_url: metadata.image_url || metadata.image || p.image_url || '', 
          email: isMe ? currentUser?.email : (authUser?.email || '—'),
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
          : `${user.display_name || 'Usuário'} foi desbloqueado.`
      );
      await loadUsers();
    } catch (err) {
      showToast('Erro ao alterar status do perfil.');
    } finally {
      setSavingId(null);
    }
  };

  const handlePasswordChange = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      showToast('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    setSavingId(userId);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      
      showToast('Senha alterada com sucesso!');
      setChangingPassword(null);
      setNewPassword('');
    } catch (err) {
      showToast('Erro de permissão ao redefinir senha.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-60 flex flex-col items-center justify-center text-slate-400 font-inter gap-2">
        <Shield size={32} className="opacity-20 text-red-500" />
        <p className="text-sm font-bold text-slate-500">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gerenciamento de Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie acesso, cargos e senhas das contas do Preciso.OCR.</p>
        </div>
        <button 
          onClick={() => loadUsers()} 
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} /> Sincronizar
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div 
              key={u.id} 
              className={cn(
                'bg-white rounded-2xl border p-4 lg:p-5 transition-all shadow-sm flex flex-col justify-center',
                u.blocked ? 'border-red-200 bg-red-50/20' : 'border-slate-100'
              )}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border shadow-inner shrink-0 relative bg-slate-50',
                    u.role === 'admin' ? 'border-violet-200 text-violet-700' : 'border-slate-200 text-slate-600'
                  )}>
                    {u.image_url ? (
                      <img src={u.image_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-sm">{(u.display_name || u.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">
                      {u.display_name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                    u.role === 'admin' 
                      ? 'bg-violet-50 text-violet-700 border-violet-200/60' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  )}>
                    {u.role}
                  </span>

                  {u.blocked && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200/60">
                      Bloqueado
                    </span>
                  )}

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleBlock(u)}
                      disabled={savingId === u.id}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer',
                        u.blocked
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                      )}
                    >
                      {savingId === u.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : u.blocked ? (
                        <span>Desbloquear</span>
                      ) : (
                        <span>Bloquear</span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => { 
                      setChangingPassword(changingPassword === u.id ? null : u.id); 
                      setNewPassword(''); 
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 shadow-sm transition-all cursor-pointer"
                  >
                    <KeyRound size={13} />
                    <span>Senha</span>
                  </button>
                </div>
              </div>

              {/* Input de Nova Senha */}
              {changingPassword === u.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 items-center">
                  <input
                    type="password"
                    placeholder="Nova senha de acesso (mín. 6 dígitos)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-300 focus:outline-none transition-all text-slate-800"
                  />
                  <button
                    onClick={() => handlePasswordChange(u.id)}
                    disabled={savingId === u.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                  >
                    {savingId === u.id ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setChangingPassword(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold border border-slate-800">
          {toast}
        </div>
      )}
    </div>
  );
}