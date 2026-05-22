'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { User, Mail, Shield, Monitor, Bell, Key, Lock, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'app', label: 'Aplicação', icon: Monitor },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 font-montserrat tracking-tight">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie suas preferências de conta e parâmetros do sistema.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:bg-slate-100")}>
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 card-glass p-8 space-y-10">
          {activeTab === 'perfil' && (
            <div className="animate-in fade-in slide-in-from-right space-y-8">
              <section className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                    </h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Analista
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" defaultValue={user?.user_metadata?.full_name}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="email" defaultValue={user?.email} disabled
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="pt-8 border-t border-slate-50 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900">Integração Gemini AI</h4>
                  <p className="text-xs text-slate-500">API Key configurada via variável de ambiente.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Chave de API Ativa</p>
                      <p className="text-[10px] text-emerald-600">Gemini AI configurado via NEXT_PUBLIC_GEMINI_API_KEY</p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                  {saved ? <><CheckCircle2 size={18} /> Salvo!</> : <><Save size={18} /> Salvar Alterações</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="animate-in fade-in slide-in-from-right space-y-8">
              <div>
                <h4 className="font-bold text-slate-900">Autenticação e Segurança</h4>
                <p className="text-xs text-slate-500">Gerencie sua senha e métodos de acesso.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Alterar Senha</p>
                    <p className="text-[10px] text-slate-500">Recomendamos trocar sua senha a cada 90 dias.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  Redefinir Senha
                </button>
              </div>
              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100/50 flex items-center gap-4">
                <Shield className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm font-bold text-blue-900">Proteção de Conta Ativa</p>
                  <p className="text-[10px] text-blue-600 font-medium">Sua conta está protegida por criptografia via Supabase Auth.</p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'app' || activeTab === 'notificacoes') && (
            <div className="animate-in fade-in slide-in-from-right flex flex-col items-center justify-center h-48 text-slate-400">
              <Monitor size={40} className="opacity-20 mb-4" />
              <p className="font-bold">Em breve</p>
              <p className="text-sm">Esta seção está sendo desenvolvida.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
