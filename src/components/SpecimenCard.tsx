'use client';

import { Specimen } from '@/types';
import { cn, getProxiedUrl, isRetainedClient, isSpecialClient, getOccurrenceLabel } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, Info, Droplets } from 'lucide-react';

interface SpecimenCardProps {
  specimen: Specimen;
  onClick: () => void;
}

export default function SpecimenCard({ specimen, onClick }: SpecimenCardProps) {
  const isRetained = isRetainedClient(specimen);
  const isSpecial = isSpecialClient(specimen);

  const isDivergent =
    specimen.leitura_documento &&
    specimen.leitura_hidrometro &&
    specimen.leitura_documento !== specimen.leitura_hidrometro;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Sucesso':     return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Divergência': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Erro':        return 'bg-red-50 text-red-700 border-red-200';
      default:            return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sucesso':     return <CheckCircle2 size={11} />;
      case 'Divergência': return <AlertCircle size={11} />;
      case 'Erro':        return <AlertCircle size={11} />;
      default:            return <Clock size={11} />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
        'border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5',
        isRetained && 'ring-2 ring-emerald-400/40',
        isSpecial  && 'ring-2 ring-blue-400/40',
      )}
    >
      {/* ── TOP BAR ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 gap-2 border-b border-slate-100 bg-white">
        <div className="flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
            Documento PDF
          </span>
          {isRetained && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
              Retida
            </span>
          )}
          {isSpecial && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
              Especial
            </span>
          )}
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0',
          getStatusStyle(specimen.status)
        )}>
          {getStatusIcon(specimen.status)}
          {specimen.status}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <div className="flex bg-white" style={{ minHeight: 160 }}>

        {/* ESQUERDA — apenas texto, sem nenhuma imagem */}
        <div
          className="flex flex-col justify-between min-w-0 px-3 py-3 gap-2 bg-white border-r border-slate-100"
          style={{ flex: '1 1 0', overflow: 'hidden' }}
        >
          {/* Matrícula + OC */}
          <div>
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matrícula</span>
              {specimen.oc_code && (
                <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                  OC {specimen.oc_code}
                </span>
              )}
            </div>
            <p className="text-sm font-black text-slate-900 leading-none truncate">
              {specimen.matricula || '—'}
            </p>
          </div>

          {/* Nome */}
          <p className="text-[10px] font-semibold text-slate-600 leading-tight line-clamp-2">
            {specimen.name || 'Cliente Indisponível'}
          </p>

          {/* Leituras */}
          <div className="border-t border-dashed border-slate-100 pt-2 flex flex-col gap-1.5">
            <div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Leitura Doc</span>
              <p className="text-xs font-black text-slate-800 leading-none mt-0.5">
                {specimen.leitura_documento || '—'}
              </p>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Leitura Visual</span>
              <p className={cn(
                'text-xs font-black leading-none mt-0.5',
                isDivergent ? 'text-orange-500' : 'text-emerald-600'
              )}>
                {specimen.leitura_hidrometro || '—'}
              </p>
            </div>
          </div>

          {/* Ocorrência */}
          {specimen.oc_code && (
            <p className="text-[8px] text-slate-400 leading-tight line-clamp-1">
              {getOccurrenceLabel(specimen.oc_code)}
            </p>
          )}
        </div>

        {/* DIREITA — SOMENTE meter_image_url, nunca image_url */}
        <div
          className="relative bg-slate-900 shrink-0"
          style={{ width: '44%', minHeight: 160 }}
        >
          {specimen.meter_image_url ? (
            <img
              src={getProxiedUrl(specimen.meter_image_url)}
              alt="Hidrômetro"
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{ position: 'absolute', inset: 0 }}
              className="flex flex-col items-center justify-center bg-slate-800 gap-1"
            >
              <Droplets size={22} strokeWidth={1.5} className="text-slate-500 opacity-40" />
              <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wide text-center px-2">
                Sem foto do hidrômetro
              </span>
            </div>
          )}

          {/* Label VISUAL */}
          <div className="absolute bottom-1.5 right-1.5 z-10 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            <span className="text-[7px] font-bold text-white uppercase tracking-wider">VISUAL</span>
          </div>

          {/* Divergência */}
          {isDivergent && (
            <div className="absolute top-1.5 right-1.5 z-10 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow" />
          )}
        </div>
      </div>
    </div>
  );
}
