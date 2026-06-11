'use client';

import { useState } from 'react';
import { Specimen } from '@/types';
import { cn } from '@/lib/utils';
import { Eye, FileText, Calendar, User, X } from 'lucide-react';

interface SpecimenCardProps {
  specimen: Specimen & { onHide?: (id: string) => void };
  onClick: () => void;
}

export default function SpecimenCard({ specimen, onClick }: SpecimenCardProps) {
  // Estado para controlar o esqueleto de carregamento da imagem
  const [imageLoading, setImageLoading] = useState(true);

  // Mapeamento de estilos de status
  const statusStyles: Record<string, string> = {
    'Sucesso': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    'Divergência': 'bg-orange-50 text-orange-700 border-orange-200/60',
    'Auditoria': 'bg-blue-50 text-blue-700 border-blue-200/60',
    'Erro': 'bg-red-50 text-red-700 border-red-200/60'
  };

  const statusDots: Record<string, string> = {
    'Sucesso': 'bg-emerald-500',
    'Divergência': 'bg-orange-500',
    'Auditoria': 'bg-blue-500',
    'Erro': 'bg-red-500'
  };

  const currentStatusStyle = statusStyles[specimen.status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const currentStatusDot = statusDots[specimen.status] || 'bg-slate-400';

  const imageUrl = specimen.image_url;

  return (
    <div 
      onClick={onClick}
      className="card-glass overflow-hidden flex flex-col cursor-pointer group hover:scale-[1.03] hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 border border-slate-100 bg-white relative z-10 hover:z-20"
    >
      {/* Container da Imagem / Preview */}
      <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">
        
        {/* BOTÃO DE OCULTAR INDIVIDUAL (Apenas visual na sessão do usuário) */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Impede que o clique abra o modal de detalhes
            if (specimen.onHide) {
              specimen.onHide(specimen.id);
            }
          }}
          className="absolute top-3 left-3 z-40 p-1.5 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl border border-slate-200/60 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm flex items-center justify-center"
          title="Ocultar da lista"
        >
          <X size={13} />
        </button>

        {/* SKELETON SCREEN: Pisca enquanto a imagem não carrega */}
        {imageUrl && imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse z-20" />
        )}

        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`Documento de ${specimen.name}`}
            className={cn(
              "w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-500 ease-out",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              setImageLoading(false);
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Fallback visual caso não exista imagem */}
        <div className={cn(
          "image-fallback absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-b from-slate-50 to-slate-100/50",
          imageUrl ? "hidden" : ""
        )}>
          <FileText size={36} className="text-slate-300 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80">Visualização Indisponível</span>
        </div>

        {/* Overlay no Hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] z-30">
          <div className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye size={14} />
            <span>Ver Detalhes</span>
          </div>
        </div>

        {/* Badge de Status */}
        <div className="absolute top-3 right-3 z-30">
          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 shadow-sm bg-white/90 backdrop-blur-sm", currentStatusStyle)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", currentStatusDot)} />
            {specimen.status}
          </span>
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-600 tracking-wider">#{specimen.matricula || 'SEM REF'}</span>
            {specimen.oc_code && (
              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">OC {specimen.oc_code}</span>
            )}
          </div>
          <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors" title={specimen.name}>
            {specimen.name || 'Cliente Não Identificado'}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100/70 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1 truncate">
            <User size={12} className="text-slate-300 shrink-0" />
            <span className="truncate">{specimen.categoria || 'Geral'}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Calendar size={12} className="text-slate-300 shrink-0" />
            <span>{specimen.created_at ? new Date(specimen.created_at).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}