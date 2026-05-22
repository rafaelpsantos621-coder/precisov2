export type ValidationStatus = 'Sucesso' | 'Divergência' | 'Erro' | 'Auditoria';

export interface Specimen {
  id: string;
  matricula: string;
  name: string;
  leitura_documento: string;
  leitura_hidrometro: string;
  status: ValidationStatus;
  categoria?: 'Retida' | 'Especial' | 'Geral';
  oc_code?: string;
  oc_description?: string;
  image_url: string;
  meter_image_url?: string;
  observations?: string;
  tipo_cliente?: 'empresa' | 'governo' | 'individual';
  is_retida?: boolean;
  leitura_correta?: boolean;
  captured_at?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  confidence?: number;
}