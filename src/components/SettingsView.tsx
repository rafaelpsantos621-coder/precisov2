'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SettingsView() {
  const { user } = useAuth();
  
  // Estados do Perfil
  const [name, setName] = useState('');
  const [role, setRole] = useState('OPERADOR');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados da Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      let profileData = null;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, role, image_url')
          .eq('id', user.id)
          .single();

        if (!error) {
          profileData = data;
        }
      } catch (err) {
        console.warn('Erro ao buscar perfil na tabela pública:', err);
      }

      const metadata = user.user_metadata || {};
      
      setName(profileData?.display_name || metadata.name || metadata.full_name || '');
      setRole(profileData?.role || metadata.role || 'OPERADOR');
      setImageUrl(profileData?.image_url || metadata.image_url || metadata.avatar_url || '');
    }

    loadProfile();
  }, [user]);

  // Função para fazer upload da imagem do perfil
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para importar.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error: any) {
      alert(error.message || 'Erro ao importar imagem.');
    } military {
      setUploading(false);
    }
  };

  // Salvar dados do Perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (!user) return;

      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: name,
          role: role,
          image_url: imageUrl
        }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: name,
          role: role,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      setSaveSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Alterar a senha de acesso
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(false);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      {/* SEÇÃO 1: DADOS DO PERFIL */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Perfil</h2>
        <p className="text-sm text-gray-500">Gerencie suas informações de exibição e imagem de avatar.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="shrink-0">
            {imageUrl ? (
              <img className="h-16 w-16 object-cover rounded-full ring-2 ring-indigo-500" src={imageUrl} alt="Avatar" />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold">
                {name ? name.substring(0, 2).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <label className="block">
            <span className="sr-only">Escolher foto de perfil</span>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-400 mt-1">
              {uploading ? 'Importando arquivo...' : 'Importe um arquivo PNG ou JPG do seu computador.'}
            </p>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome de Exibição</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Função / Nível de Acesso</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
          >
            <option value="OPERADOR">Operador</option>
            <option value="GERENTE">Gerente</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isSaving || uploading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">Configurações salvas com sucesso!</span>
          )}
        </div>
      </form>

      {/* SEÇÃO 2: SEGURANÇA / ALTERAR SENHA */}
      <hr className="my-8 border-gray-200" />

      <div>
        <h3 className="text-xl font-bold text-gray-900">Segurança da Conta</h3>
        <p className="text-sm text-gray-500">Atualize sua senha de acesso ao sistema.</p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Mínimo de 6 caracteres"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirme a Nova Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
          </button>

          {passwordSuccess && (
            <span className="text-sm text-green-600 font-medium">Sua senha foi alterada com sucesso!</span>
          )}
        </div>
      </form>
    </div>
  );
}