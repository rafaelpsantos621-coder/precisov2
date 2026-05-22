import { supabase } from './supabase';
import { Specimen, ValidationStatus } from '@/types';

export async function fetchSpecimens() {
  const { data, error } = await supabase
    .from('specimens')
    .select('*')
    .order('captured_at', { ascending: false });

  if (error) {
    if (error.message?.includes('JWT') || error.message?.includes('refresh_token')) {
      supabase.auth.signOut();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(`Erro ao buscar registros: ${error.message}`);
  }
  return data as Specimen[];
}

export async function updateSpecimen(id: string, updates: Partial<Specimen>) {
  const { data, error } = await supabase
    .from('specimens')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function saveSpecimen(specimen: Partial<Specimen>) {
  const sanitized: any = {
    ...specimen,
    matricula: String(specimen.matricula || 'NÃO IDENTIFICADO').trim(),
    name: String(specimen.name || 'CLIENTE NÃO IDENTIFICADO').trim(),
    status: specimen.status || 'Auditoria',
    confidence: specimen.confidence ?? 0,
    is_retida: typeof specimen.is_retida === 'boolean' ? specimen.is_retida : false,
    captured_at: new Date().toISOString(),
  };

  // Remove campos que não existem na tabela antiga
  delete sanitized.created_at;
  delete sanitized.categoria;

  const { data, error } = await supabase.from('specimens').insert([sanitized]).select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('Nenhum dado retornado após inserção.');
  return data[0];
}

export async function deleteSpecimen(id: string) {
  const { error } = await supabase.from('specimens').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllSpecimens() {
  const { error } = await supabase.from('specimens').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);
}

export async function uploadBase64Image(base64: string, userId: string, fileName: string) {
  const base64Data = base64.split(',')[1];
  const u8arr = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const contentType = base64.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
  const ext = contentType === 'image/jpeg' ? 'jpg' : 'png';
  const file = new File([u8arr], `${fileName}.${ext}`, { type: contentType });
  const path = `${userId}/${Date.now()}-${fileName}.${ext}`;

  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.storage.from('specimens').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('specimens').getPublicUrl(path);
      return { publicUrl, storagePath: path };
    }
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
  throw new Error('Erro no upload após tentativas.');
}