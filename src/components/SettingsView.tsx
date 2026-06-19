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
    } finally {
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
      console.error(