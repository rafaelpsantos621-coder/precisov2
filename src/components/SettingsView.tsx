'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, CheckCircle2, AlertCircle, Shield, Image, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do formulário
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Estados de controlo
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega os dados iniciais do utilizador
  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          // Busca primeiro da tabela pública profiles que agora está corrigida
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, role, image_url')
            .eq('id', user.id)
            .single()
            .catch(() => ({ data: null }));

          const metadata = user.user_metadata || {};
          
          setName(profileData?.display_name || metadata.name || user.email?.split('@')[0] || '');
          setRole(profileData?.role || metadata.role || 'Analista de Faturamento');
          setImageUrl(profileData?.image_url || metadata.image_url || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setErrorMessage('Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  // Upload para o bucket specimens
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('specimens') 
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('specimens')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setErrorMessage('Falha ao subir imagem. Verifique se o bucket "specimens" é público.');
    } finally {
      setIsUploading(false);
    }
  };

  // Salva as alterações de forma sincronizada
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // 1. Força a atualização na tabela pública profiles primeiro
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          display_name: name, 
          role: role, 
          image_url: imageUrl 
        })
        .eq('id', user.id);
      
      if (dbError) {
        console.warn('Nota de RLS: Tentando salvar via metadados secundários...');
      }

      // 2. Atualiza os metadados do Auth (Para atualizar o topo da página instantaneamente)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: name, 
          role: role, 
          image_url: imageUrl 
        }
      });
      if (authError) throw authError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMessage(err.message || 'Falha ao processar a atualização do perfil.');
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 font-inter">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Configurações do Perfil</h2>
        <p className="text-sm text-slate-500">Atualize as suas informações de exibição no ecossistema Preciso.OCR.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Preview */}
        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center text-center justify-center space-y-4 shadow-sm h-fit">
          <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-slate-200 overflow-hidden relative flex items-center justify-center text-slate-400 shadow-inner">
            {imageUrl ? (
              <img src={imageUrl} alt="Avatar Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = ''} />
            ) : (
              <User size={40} className="opacity-40" />
            )}
          </div>
          <div className="w-full">
            <h4 className="font-bold text-slate-800 text-base truncate px-2">{name || 'Nome do Usuário'}</h4>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5 truncate px-2">{role}</p>
          </div>
        </div>

        {/* Painel Direito: Formulário */}
        <div className="md:col-span-2 p-6 lg:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Shield size={14} /> Dados Cadastrais
            </h3>

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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block flex items-center gap-1.5">
                <Image size={12} /> Foto de Perfil
              </label>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Cole o link da foto ou importe um arquivo..."
                  className="flex-1 p-3.5 bg-slate-50 rounded-2xl text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none font-medium text-slate-800 transition-all focus:ring-4 focus:ring-blue-500/5"
                />
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 size={15} className="animate-spin text-blue-600" />
                  ) : (
                    <><Upload size={15} /><span>Importar</span></>
                  )}
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Perfil atualizado com sucesso!</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-xs font-bold animate-in fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="w-full flex items-center justify-center gap-2 transition-all py-3.5 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}