'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, CheckCircle2, AlertCircle, Shield, Image, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsView() {
  // Estados para os campos do formulário
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Estados de controlo da interface (Loading e Feedbacks)
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega os dados do perfil assim que a página abre
  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        
        // Captura o utilizador autenticado atual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          // 1. Tenta carregar primeiro da tabela pública 'profiles'
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, role, avatar_url')
            .eq('id', user.id)
            .single();

          // 2. Se encontrar na tabela pública, popula os estados. Caso contrário, usa o user_metadata ou fallbacks
          const metadata = user.user_metadata || {};
          
          setName(profileData?.display_name || metadata.name || user.email?.split('@')[0] || '');
          setRole(profileData?.role || metadata.role || 'Analista de Faturamento');
          setImageUrl(profileData?.avatar_url || metadata.image_url || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados de configuração:', err);
        setErrorMessage('Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  // Função unificada para salvar as alterações em ambos os locais
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado.');

      // 1. ATUALIZAÇÃO NO AUTH: Atualiza o user_metadata (Para atualizar o UserView do topo instantaneamente)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: name,
          role: role,
          image_url: imageUrl,
        }
      });
      if (authError) throw authError;

      // 2. ATUALIZAÇÃO NO BANCO: Atualiza a tabela pública 'profiles' (Para sincronizar o UsersView administrativo)
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          role: role,
          avatar_url: imageUrl // Nota: Garanta que na sua tabela do banco a coluna chama-se 'avatar_url'
        })
        .eq('id', user.id);
      if (dbError) throw dbError;

      // Feedback visual de sucesso
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err: any) {
      console.error('Erro ao salvar perfil unificado:', err);
      setErrorMessage(err.message || 'Falha ao salvar as alterações de perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-medium">A carregar configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 font-inter">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Configurações do Perfil</h2>
        <p className="text-sm text-slate-500">Atualize as suas informações de exibição no ecossistema Preciso.OCR.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Preview em Tempo Real */}
        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center text-center justify-center space-y-4 shadow-sm h-fit">
          <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-slate-200 overflow-hidden relative flex items-center justify-center text-slate-400 shadow-inner">
            {imageUrl ? (
              <img src={imageUrl} alt="Avatar Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = ''} />
            ) : (
              <User size={40} className="opacity-40" />
            )}
          </div>
          <div className="w-full">
            <h4 className="font-bold text-slate-800 text-base truncate px-2">
              {name || 'Nome do Usuário'}
            </h4>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5 truncate px-2">
              {role || 'Cargo não definido'}
            </p>
          </div>
        </div>

        {/* Painel Direito: Formulário de Input */}
        <div className="md:col-span-2 p-6 lg:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Shield size={14} /> Dados Cadastrais
            </h3>

            {/* Input: Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Rafael Pereira dos Santos"
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all focus:ring-4 focus:ring-blue-500/5"
                required
              />
            </div>

            {/* Input: Cargo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Função / Cargo</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Supervisor de Faturamento"
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all focus:ring-4 focus:ring-blue-500/5"
                required
              />
            </div>

            {/* Input: URL da Imagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block flex items-center gap-1.5">
                <Image size={12} /> URL da Imagem de Perfil
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all focus:ring-4 focus:ring-blue-500/5"
              />
              <p className="text-[10px] text-slate-400 font-medium">Insira o link de uma imagem pública da internet para usar como foto.</p>
            </div>

            {/* Mensagens de Feedback */}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold animate-in fade-in duration-300">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Perfil atualizado com sucesso em todo o sistema!</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-xs font-bold animate-in fade-in duration-300">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botão de Submissão */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "w-full flex items-center justify-center gap-2 transition-all py-3.5 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10 active:scale-[0.99]",
                  saveSuccess && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-600/10"
                )}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : saveSuccess ? (
                  <><CheckCircle2 size={18} /> Alterações Guardadas!</>
                ) : (
                  <><Save size={18} /> Salvar Alterações</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}