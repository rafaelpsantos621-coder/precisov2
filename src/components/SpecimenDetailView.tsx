'use client';

import { useState } from 'react';
import { Specimen, ValidationStatus } from '@/types';
import { X, CheckCircle2, AlertTriangle, Trash2, Save, Maximize2, ChevronLeft, ChevronRight, MessageSquare, BadgeAlert, Loader2, Info, Edit2, AlertCircle } from 'lucide-react';
import { cn, getProxiedUrl, getOccurrenceLabel, getOccurrenceDescription } from '@/lib/utils';
import { updateSpecimen, deleteSpecimen } from '@/lib/data';

interface Props {
  specimen: Specimen;
  onClose: () => void;
  onUpdate: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function SpecimenDetailView({ specimen, onClose, onUpdate, onNext, onPrev }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    leitura_documento: specimen.leitura_documento || '',
    leitura_hidrometro: specimen.leitura_hidrometro || '',
    oc_code: specimen.oc_code || '',
    observations: specimen.observations || '',
    status: specimen.status as ValidationStatus,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'images' | 'data'>('images');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedOk(false);
    try {
      // Only send fields that exist in the DB — no `categoria`
      await updateSpecimen(specimen.id, {
        status: formData.status,
        observations: formData.observations || undefined,
leitura_documento: formData.leitura_documento || undefined,
leitura_hidrometro: formData.leitura_hidrometro || undefined,
oc_code: formData.oc_code || undefined,
      });
      onUpdate();
      setSavedOk(true);
      setTimeout(() => {
        if (onNext) onNext(); else onClose();
      }, 600);
    } catch (error: any) {
      setSaveError(error.message || 'Falha ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      await deleteSpecimen(specimen.id);
      onUpdate();
      onClose();
    } catch (e: any) {
      setSaveError('Erro ao excluir: ' + e.message);
    }
  };

  const isDivergent = formData.leitura_documento !== '' &&
    formData.leitura_hidrometro !== '' &&
    formData.leitura_documento !== formData.leitura_hidrometro;

  const hasOcObservation = formData.oc_code && getOccurrenceLabel(formData.oc_code) !== `Ocorrência ${formData.oc_code}` && getOccurrenceLabel(formData.oc_code) !== 'Normal';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 lg:p-10 font-inter">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

      {/* Image zoom */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <img src={getProxiedUrl(zoomedImage)} alt="Zoom" referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" />
          <button onClick={e => { e.stopPropagation(); setZoomedImage(null); }}
            className="absolute top-4 right-4 p-3 bg-black/40 text-white rounded-full border border-white/10">
            <X size={24} />
          </button>
        </div>
      )}

      {/* Modal */}
      <div className="bg-white w-full max-w-6xl h-[95vh] sm:max-h-[95vh] sm:rounded-[3rem] rounded-t-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="p-4 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
              <Info size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base lg:text-xl font-bold text-slate-900 truncate">{specimen.name || 'Cliente Sem Nome'}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Matrícula {specimen.matricula}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                  formData.status === 'Sucesso' ? 'bg-emerald-100 text-emerald-700' :
                  formData.status === 'Divergência' ? 'bg-orange-100 text-orange-700' :
                  formData.status === 'Erro' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                )}>{formData.status}</span>
                {isDivergent && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-600">
                    ⚠ Leituras divergem
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-200 rounded-2xl p-1">
              <button onClick={onPrev} disabled={!onPrev} className="p-1.5 text-slate-600 disabled:opacity-30 transition-opacity"><ChevronLeft size={18} /></button>
              <button onClick={onNext} disabled={!onNext} className="p-1.5 text-slate-600 disabled:opacity-30 transition-opacity"><ChevronRight size={18} /></button>
            </div>
            <button onClick={handleDelete} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
            <button onClick={onClose} className="p-2.5 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-2xl transition-all"><X size={18} /></button>
          </div>
        </header>

        {/* Mobile panel switcher */}
        <div className="flex lg:hidden border-b border-slate-100 shrink-0">
          <button onClick={() => setActivePanel('images')}
            className={cn("flex-1 py-3 text-xs font-bold transition-colors",
              activePanel === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400')}>
            Imagens
          </button>
          <button onClick={() => setActivePanel('data')}
            className={cn("flex-1 py-3 text-xs font-bold transition-colors",
              activePanel === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400')}>
            Análise & Conclusão
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Left: Images */}
          <div className={cn("flex-1 bg-slate-100 overflow-y-auto p-4 lg:p-8 space-y-6",
            activePanel !== 'images' && "hidden lg:block")}>
            <section>
              <div className="text-center mb-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento OCR</h3>
                {formData.leitura_documento && (
                  <span className="text-[10px] font-bold text-slate-400">Leitura Doc: {formData.leitura_documento}</span>
                )}
              </div>
              <div onClick={() => specimen.image_url && setZoomedImage(specimen.image_url)}
                className="group relative rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-200 cursor-zoom-in">
                {specimen.image_url ? (
                  <img src={getProxiedUrl(specimen.image_url)} alt="Documento" referrerPolicy="no-referrer" className="w-full h-auto object-contain" />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-slate-400">
                    <Info size={32} className="opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                  <div className="bg-white/90 p-3 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center gap-2">
                    <Maximize2 size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Ampliar</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="text-center mb-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto do Hidrômetro</h3>
                {formData.leitura_hidrometro && (
                  <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full",
                    isDivergent ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700")}>
                    Leitura Visual: {formData.leitura_hidrometro}
                  </span>
                )}
              </div>
              <div onClick={() => specimen.meter_image_url && setZoomedImage(specimen.meter_image_url)}
                className="group relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-200 min-h-[140px] cursor-zoom-in">
                {specimen.meter_image_url ? (
                  <img src={getProxiedUrl(specimen.meter_image_url)} alt="Hidrômetro" referrerPolicy="no-referrer" className="w-full h-auto object-contain" />
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center text-slate-400 p-6">
                    <BadgeAlert className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sem foto do hidrômetro</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Data & Review */}
          <div className={cn("w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col",
            activePanel !== 'data' && "hidden lg:flex")}>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-5">

              {/* Leituras */}
              <div className="p-5 bg-slate-50 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise Técnica</h4>
                  <button onClick={() => setIsEditing(!isEditing)}
                    className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all",
                      isEditing ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200")}>
                    <Edit2 size={10} /> {isEditing ? 'Visualizar' : 'Editar'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Leitura Doc</label>
                    {isEditing ? (
                      <input type="text" value={formData.leitura_documento}
                        onChange={e => setFormData({ ...formData, leitura_documento: e.target.value })}
                        className="w-full text-2xl font-black text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent" />
                    ) : (
                      <div className="text-2xl font-black text-slate-900">{formData.leitura_documento || '—'}</div>
                    )}
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Leitura Real</label>
                    {isEditing ? (
                      <input type="text" value={formData.leitura_hidrometro}
                        onChange={e => setFormData({ ...formData, leitura_hidrometro: e.target.value })}
                        className="w-full text-2xl font-black border-b-2 border-blue-500 focus:outline-none bg-transparent"
                        style={{ color: isDivergent ? '#ea580c' : '#059669' }} />
                    ) : (
                      <div className={cn("text-2xl font-black", isDivergent ? "text-orange-600" : "text-emerald-600")}>
                        {formData.leitura_hidrometro || '—'}
                      </div>
                    )}
                  </div>
                </div>

                {isDivergent && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                    <AlertCircle size={16} className="text-orange-600 shrink-0" />
                    <span className="text-xs font-bold text-orange-700">Divergência detectada entre leitura do documento e foto do hidrômetro.</span>
                  </div>
                )}

                {/* OC */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocorrência</label>
                  <div className="flex items-start gap-3 mt-2 p-3 bg-white border border-slate-200 rounded-2xl">
                    {isEditing ? (
                      <input type="text" value={formData.oc_code}
                        onChange={e => setFormData({ ...formData, oc_code: e.target.value })}
                        className="w-12 text-center font-black text-blue-700 border-b-2 border-blue-500 focus:outline-none bg-transparent shrink-0" placeholder="OC" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-black text-blue-700 shrink-0">
                        {formData.oc_code || '—'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900">{getOccurrenceLabel(formData.oc_code)}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{getOccurrenceDescription(formData.oc_code)}</p>
                      {hasOcObservation && (
                        <span className="inline-block mt-1 text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          Ocorrência registrada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-2">
                  <MessageSquare size={14} /> Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={e => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Anotações sobre a divergência ou ocorrência..."
                  className="w-full h-24 p-4 bg-slate-50 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 resize-none border-none outline-none"
                />
              </div>

              {/* Conclusion */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Conclusão</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Sucesso', 'Divergência'] as ValidationStatus[]).map(s => (
                    <button key={s} onClick={() => setFormData({ ...formData, status: s })}
                      className={cn("flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all",
                        formData.status === s
                          ? s === 'Sucesso' ? "bg-emerald-500 border-emerald-500 text-white" : "bg-orange-500 border-orange-500 text-white"
                          : "border-slate-100 text-slate-400 hover:border-slate-200")}>
                      {s === 'Sucesso' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {s === 'Sucesso' ? 'Correto' : 'Divergente'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setFormData({ ...formData, status: 'Erro' })}
                  className={cn("w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all",
                    formData.status === 'Erro' ? "bg-red-500 border-red-500 text-white" : "border-slate-100 text-slate-400 hover:border-red-200")}>
                  Imagem Inválida / Erro
                </button>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span className="text-xs font-bold text-red-700">{saveError}</span>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="p-4 lg:p-8 border-t border-slate-100 shrink-0">
              <button onClick={handleSave} disabled={isSaving || savedOk}
                className={cn("w-full btn-primary flex items-center justify-center gap-2 transition-all",
                  savedOk && "bg-emerald-600 hover:bg-emerald-600")}>
                {isSaving ? <Loader2 className="animate-spin" size={18} /> :
                 savedOk ? <><CheckCircle2 size={18} /> Salvo!</> :
                 <><Save size={18} /> Finalizar Verificação</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
