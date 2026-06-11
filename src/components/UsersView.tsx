'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Shield, ShieldOff, KeyRound, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  display_name: string | null;
  role: string;
  blocked: boolean;
  email?: string;
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
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, role, blocked')
        .order('role', { ascending: false });

      // Buscar emails via auth admin (apenas se disponível)
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers().catch(() => ({ data: { users: [] } }));

      const merged = (profiles || []).map(p => ({
        ...p,
        email: authUsers?.find((u: any) => u.id === p.id)?.email || '—',
      }));

      setUsers(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleBlock = async (user: UserProfile) => {
    setSavingId(user.id);
    try {
      await supabase.from('profiles').update({ blocked: !user.blocked }).eq('id', user.id);
      showToast(user.blocked ? `${user.display_name || user.email} desbloqueado!` : `${user.display_name || user.email} bloqueado!`);
      loadUsers();
    } catch {
      showToast('Erro ao alterar status.');
    } finally {
      setSavingId(null);
    }
  };

  const changePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSavingId(userId);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      showToast('Senha alterada com sucesso!');
      setChangingPassword(null);
      setNewPassword('');
    } catch {
      showToast('Erro ao alterar senha. Verifique as permissões do Supabase.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) return (
    <div className="h-60 flex items-center justify-center text-slate-400">
      <Shield size={32} className="opacity-20 mr-3" />
      Acesso restrito a administradores.
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gerenciamento de Usuários</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie acesso e senhas das contas.</p>
        </div>
        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className={cn(
              'bg-white rounded-2xl border p-4 lg:p-5 transition-all',
              u.blocked ? 'border-red-100 bg-red-50/30' : 'border-slate-100'
            )}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm',
                    u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {(u.display_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{u.display_name || '—'}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                    u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {u.role}
                  </span>

                  {u.blocked && (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600">
                      Bloqueado
                    </span>
                  )}

                  {/* Não permitir bloquear o próprio admin */}
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleBlock(u)}
                      disabled={savingId === u.id}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        u.blocked
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      )}>
                      {savingId === u.id ? <Loader2 size={13} className="animate-spin" /> :
                        u.blocked ? <><UserCheck size={13} /> Desbloquear</> : <><UserX size={13} /> Bloquear</>}
                    </button>
                  )}

                  <button
                    onClick={() => { setChangingPassword(changingPassword === u.id ? null : u.id); setNewPassword(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                    <KeyRound size={13} /> Senha
                  </button>
                </div>
              </div>

              {/* Campo de nova senha */}
              {changingPassword === u.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 items-center">
                  <input
                    type="password"
                    placeholder="Nova senha (mín. 6 caracteres)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => changePassword(u.id)}
                    disabled={savingId === u.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                    {savingId === u.id ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setChangingPassword(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-bottom duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}
