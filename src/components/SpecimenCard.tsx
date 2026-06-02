'use client';

import { Specimen } from '@/types';
import { cn, getProxiedUrl, isRetainedClient, isSpecialClient } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Info } from 'lucide-react';

interface SpecimenCardProps {
  specimen: Specimen;
  onClick: () => void;
}

export default function SpecimenCard({ specimen, onClick }: SpecimenCardProps) {
  const isRetained = isRetainedClient(specimen);
  const isSpecial = isSpecialClient(specimen);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Sucesso': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Divergência': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Erro': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sucesso': return <CheckCircle2 size={12} />;
      case 'Divergência': return <AlertCircle size={12} />;
      case 'Erro': return <AlertCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const isDivergent = specimen.leitura_documento &&
    specimen.leitura_hidrometro &&
    specimen.leitura_documento !== specimen.leitura_hidrometro;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 cursor-pointer",
        isRetained && "ring-2 ring-emerald-500/20",
        isSpecial && "ring-2 ring-blue-500/20"
      )}
    >
      {/* Badges top left */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-full">
          Documento PDF
        </span>
        {isRetained && (
          <span className="px-2.5 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-600/30">
            Retida
          </span>
        )}
        {isSpecial && (
          <span className="px-2.5 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/30">
            Especial
          </span>
        )}
      </div>

      {/* Status badge top right */}
      <div className="absolute top-3 right-3 z-10">
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border", getStatusStyle(specimen.status))}>
          {getStatusIcon(specimen.status)}
          {specimen.status}
        </div>
      </div>

      {/* Dual image area - documento + hidrômetro lado a lado */}
      <div className="flex h-48 bg-slate-900 border-b border-slate-100 relative overflow-hidden">
        {/* Documento OCR - lado esquerdo */}
        <div className="flex-1 relative border-r border-slate-700/50">
          {specimen.image_url ? (
            <img
              src={getProxiedUrl(specimen.image_url)}
              alt="Documento"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <Info size={24} strokeWidth={1.5} className="opacity-50 mb-1" />
              <span className="text-[9px] uppercase font-black text-slate-500">Sem doc</span>
            </div>
          )}
          {/* Label */}
          <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[8px] font-bold text-white uppercase tracking-wider">DOC</span>
          </div>
        </div>

        {/* Hidrômetro - lado direito */}
        <div className="flex-1 relative">
          {specimen.meter_image_url ? (
            <img
              src={getProxiedUrl(specimen.meter_image_url)}
              alt="Hidrômetro"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <Info size={24} strokeWidth={1.5} className="opacity-50 mb-1" />
              <span className="text-[9px] uppercase font-black text-slate-500">Sem foto</span>
            </div>
          )}
          {/* Label */}
          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[8px] font-bold text-white uppercase tracking-wider">VISUAL</span>
          </div>
          {/* Divergence indicator */}
          {isDivergent && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-slate-900 shadow-2xl">
            <ExternalLink size={20} />
          </div>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            Matrícula {specimen.matricula}
          </p>
          <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
            {specimen.oc_code ? `OC ${specimen.oc_code}` : 'Normal'}
          </p>
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
          {specimen.name || 'Cliente Indisponível'}
        </h3>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Leitura Doc</span>
            <span className="text-sm font-black text-slate-700">{specimen.leitura_documento || '---'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Leitura Visual</span>
            <span className={cn("text-sm font-black",
              isDivergent ? "text-orange-600" : "text-emerald-600"
            )}>
              {specimen.leitura_hidrometro || '---'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
