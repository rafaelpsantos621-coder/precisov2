'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Certifique-se de que o caminho do seu cliente supabase está correto
import { User, Shield, Image, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsView() {
  // Estados do Perfil
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Estados de Controle da Interface
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega os dados do perfil do usuário logado ao abrir a tela
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
          // Extrai os dados salvos dentro do metadado do usuário
          const metadata = user.user_metadata || {};
          setName(metadata.name || user.email?.split('@')[0] || '');
          setRole(metadata.role || 'Analista de Faturamento');
          setImageUrl(metadata.image_url || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err);
        setErrorMessage('Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  // Função para salvar as alterações no Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // Atualiza os metadados do usuário autenticado no Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name,
          role: role,
          image_url: imageUrl,
        }
      });

      if (error) throw error;

      setSaveSuccess(true);
      
      // Remove a mensagem de sucesso após 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMessage(err.message || 'Falha ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animated animate-in font-inter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-montserrat">Configurações</h2>
          <p className="text-sm text-slate-500">Gerencie suas preferências de perfil e do sistema Preciso.OCR.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Preview Visual do Card */}
        <div className="card-glass p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center text-center justify-center space-y-4 shadow-sm h-fit">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 overflow-hidden relative flex items-center justify-center text-slate-400">
            {imageUrl ? (
              <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = ''} />
            ) : (
              <User size={40} className="opacity-40" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base truncate max-w-[180px]">
              {name || 'Usuário'}
            </h4>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5">
              {role}
            </p>
          </div>
        </div>

        {/* Lado Direito: Formulário de Edição */}
        <div className="md:col-span-2 card-glass p-6 lg:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Shield size={14} /> Dados do Perfil
            </h3>

            {/* Input: Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Rafael Pereira dos Santos"
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all placeholder-slate-400 focus:ring-4 focus:ring-blue-500/5"
                required
              />
            </div>

            {/* Input: Função Desatada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Função / Cargo</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Supervisor de Faturamento"
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all placeholder-slate-400 focus:ring-4 focus:ring-blue-500/5"
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
                className="w-full p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all placeholder-slate-400 focus:ring-4 focus:ring-blue-500/5"
              />
              <p className="text-[10px] text-slate-400 font-medium">Insira o link de uma imagem pública para usar como foto de avatar.</p>
            </div>

            {/* Feedbacks Visuais */}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold animated fadeIn">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Configurações salvas com sucesso no banco de dados!</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-xs font-bold animated fadeIn">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botão Salvar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "w-full btn-primary flex items-center justify-center gap-2 transition-all py-3.5 rounded-2xl font-bold text-sm",
                  saveSuccess && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-600/10"
                )}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : saveSuccess ? (
                  <><CheckCircle2 size={18} /> Alterações Salvas!</>
                ) : (
                  <><Save size={18} /> Salvar Perfil</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}