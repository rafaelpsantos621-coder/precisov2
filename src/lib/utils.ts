import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProxiedUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('data:') || url.includes('localhost')) return url;
  return `/api/download?url=${encodeURIComponent(url)}`;
}

export function isSpecialClient(specimen: { name?: string; tipo_cliente?: string }) {
  if (specimen.tipo_cliente === 'empresa' || specimen.tipo_cliente === 'governo') return true;
  const name = (specimen.name || '').toUpperCase();
  const keywords = ['LTDA', 'S.A.', 'S/A', 'PREFEITURA', 'ESTADO', 'MUNICIPIO', 'HOSPITAL', 'UBS', 'ESCOLA', 'CRECHE', 'CONDOMINIO', 'INSTITUTO', 'SECRETARIA'];
  return keywords.some(kw => name.includes(kw));
}

export function isRetainedClient(specimen: { oc_code?: string; observations?: string }) {
  const code = String(specimen.oc_code || '').trim();
  const retainedCodes = ['17', '51', '53', '50', '54', '04', '017', '051', '053', '050', '054', '004'];
  const isCodeRetained = retainedCodes.includes(code);
  const obs = (specimen.observations || '').toLowerCase();
  const isTextRetained = obs.includes('acréscimo') || obs.includes('acrescimo') || obs.includes('decréscimo') || obs.includes('decrescimo') || obs.includes('retida');
  return isCodeRetained || isTextRetained;
}

export function getOccurrenceLabel(code: string | undefined): string {
  if (!code) return 'Normal';
  const codes: Record<string, string> = {
    '03': 'Hidrômetro Submerso',
    '04': 'Hidrômetro Parado',
    '05': 'Enterrado/Submerso',
    '06': 'Cúpula Embaçada',
    '07': 'Fachada (Interno)',
    '14': 'Difícil Acesso',
    '16': 'Desabitado',
    '20': 'Não Localizado',
    '21': 'Cúpula Depredada',
    '45': 'Tampa Fechada',
    '009': 'Mostrador Ilegível',
    'OCI 40': 'OCI 40',
    'OCI 48': 'OCI 48',
    '17': 'Consumo Total',
    '40': 'Sem Caixa de Correio',
    '48': 'Baixo Consumo',
    '51': 'Baixo Consumo',
    '53': 'Imóvel em Obra',
    '50': 'Fonte Alternativa',
    '54': 'Vazamento no Imóvel',
  };
  return codes[code] || `Ocorrência ${code}`;
}

export function getOccurrenceDescription(code: string | undefined): string {
  if (!code) return 'Nenhuma ocorrência identificada.';
  const descriptions: Record<string, string> = {
    '03': 'Hidrômetro submerso. Verificação via cavalete/suprime.',
    '04': 'Hidrômetro parado, imóvel habitado. Verificar necessidade de troca do equipamento.',
    '06': 'Cúpula embaçada, leitura comprometida.',
    '07': 'Hidrômetro interno. Foto deve ser da fachada.',
    '16': 'Imóvel desabitado. Foto da fachada obrigatória.',
    '20': 'Endereço pesquisado mas ponto não encontrado.',
    '21': 'Proteção do mostrador danificada.',
    '40': 'Imóvel sem caixa de correio.',
    'OCI 40': 'Imóvel sem caixa de correio.',
    '48': 'Baixo consumo, imóvel habitado.',
    'OCI 48': 'Baixo consumo, imóvel habitado.',
    '51': 'Consumo abaixo da média histórica.',
    '54': 'Evidências de vazamento no imóvel.',
  };
  return descriptions[code] || 'Ocorrência técnica identificada para análise.';
}
