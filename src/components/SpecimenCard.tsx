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

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 cursor-pointer",
        isRetained && "ring-2 ring-emerald-500/20",
        isSpecial && "ring-2 ring-blue-500/20"
      )}
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {isRetained && (
          <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-600/30 animate-pulse">
            Retida
          </span>
        )}
        {isSpecial && (
          <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/30">
            Especial
          </span>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border", getStatusStyle(specimen.status))}>
          {getStatusIcon(specimen.status)}
          {specimen.status}
        </div>
      </div>

      <div className="aspect-[2/1] bg-white overflow-hidden relative border-b border-slate-50">
        {specimen.image_url ? (
          <img
            src={getProxiedUrl(specimen.image_url)}
            alt={specimen.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain object-top transition-transform duration-700 group-hover:scale-110 bg-slate-50"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
            <Info size={32} strokeWidth={1.5} className="opacity-50 mb-2" />
            <span className="text-[10px] uppercase tracking-tighter font-black text-slate-400">Sem foto</span>
          </div>
        )}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-slate-900 shadow-2xl">
            <ExternalLink size={20} />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            Matrícula {specimen.matricula}
          </p>
          <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {specimen.oc_code ? `OC ${specimen.oc_code}` : 'Normal'}
          </p>
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {specimen.name || 'Cliente Indisponível'}
        </h3>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Doc</span>
            <span className="text-xs font-black text-slate-700">{specimen.leitura_documento || '---'}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Visual</span>
            <span className={cn("text-xs font-black",
              specimen.leitura_documento !== specimen.leitura_hidrometro ? "text-orange-600" : "text-emerald-600"
            )}>
              {specimen.leitura_hidrometro || '---'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
