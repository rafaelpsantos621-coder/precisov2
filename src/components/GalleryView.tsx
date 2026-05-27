'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSpecimens, updateSpecimen, deleteAllSpecimens } from '@/lib/data';
import { Specimen } from '@/types';
import { Loader2, Inbox, LayoutGrid, Users, Building2, Clock, BadgeAlert, Trash2, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn, isSpecialClient, isRetainedClient } from '@/lib/utils';
import SpecimenCard from './SpecimenCard';
import SpecimenDetailView from './SpecimenDetailView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GalleryViewProps { query: string; }
type TabType = 'all' | 'retained' | 'special' | 'general';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

export default function GalleryView({ query }: GalleryViewProps) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [isConfirmingExclusion, setIsConfirmingExclusion] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchSpecimens();
      setSpecimens(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    const pendings = specimens.filter(s => s.status === 'Auditoria');
    if (pendings.length === 0) {
      showToast('Nenhum registro pendente de análise.', 'info');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    let completed = 0;
    for (const specimen of pendings) {
      try {
        const isRetained = isRetainedClient(specimen);
        const isSpecial = isSpecialClient(specimen);
        // Only send fields that exist in the DB table
        const updates: Partial<Specimen> = {
          status: 'Sucesso',
          is_retida: isRetained,
          tipo_cliente: isSpecial ? 'empresa' : undefined
        };
        await updateSpecimen(specimen.id, updates);
      } catch (err) { console.error(err); }
      completed++;
      setAnalysisProgress(Math.round((completed / pendings.length) * 100));
    }
    await loadData(true);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    showToast(`${pendings.length} registro${pendings.length > 1 ? 's' : ''} analisado${pendings.length > 1 ? 's' : ''}!`, 'success');
  };

  const filteredSpecimens = specimens.filter(s => {
    const matchesSearch =
      (s.matricula || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.status || '').toLowerCase().includes(query.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'retained') return isRetainedClient(s);
    if (activeTab === 'special') return isSpecialClient(s);
    if (activeTab === 'general') return !isRetainedClient(s) && !isSpecialClient(s);
    return true;
  });

  const counts = {
    all: specimens.length,
    retained: specimens.filter(isRetainedClient).length,
    special: specimens.filter(isSpecialClient).length,
    general: specimens.filter(s => !isRetainedClient(s) && !isSpecialClient(s)).length
  };

  const handleNext = () => {
    if (!selectedSpecimen) return;
    const idx = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
    if (idx + 1 < filteredSpecimens.length) setSelectedSpecimen(filteredSpecimens[idx + 1]);
  };

  const handlePrev = () => {
    if (!selectedSpecimen) return;
    const idx = filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id);
    if (idx > 0) setSelectedSpecimen(filteredSpecimens[idx - 1]);
  };

  const exportToPDF = () => {
    if (filteredSpecimens.length === 0) {
      showToast('Nenhum dado para exportar.', 'error');
      return;
    }
    const doc = new jsPDF();
    const rows = filteredSpecimens.map(s => [
      s.matricula || '-', s.name || '-',
      s.leitura_documento || '-', s.leitura_hidrometro || '-',
      s.status, s.oc_code || '-'
    ]);
    doc.setFontSize(18);
    doc.text('Relatorio - Preciso.OCR', 14, 20);
    autoTable(doc, {
      head: [['Matricula', 'Nome', 'Leitura Doc', 'Leitura Real', 'Status', 'OC']],
      body: rows, startY: 30,
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] }
    });
    doc.save('preciso_ocr_' + Date.now() + '.pdf');
    showToast('Relatório exportado com sucesso!', 'success');
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500">Carregando galeria...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-[3rem]">
      <BadgeAlert size={32} className="text-red-600 mb-4" />
      <h3 className="text-xl font-bold text-red-900 mb-2">Erro</h3>
      <p className="text-red-700 mb-6">{error}</p>
      <button onClick={() => loadData()} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold">
        Tentar Novamente
      </button>
    </div>
  );

  const tabs = [
    { id: 'all' as TabType, label: 'Tudo', Icon: LayoutGrid },
    { id: 'retained' as TabType, label: 'Retidas', Icon: Clock },
    { id: 'special' as TabType, label: 'Especial', Icon: Building2 },
    { id: 'general' as TabType, label: 'Geral', Icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header controls - responsive */}
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide w-full">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0",
                activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <Icon size={14} /> {label}
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{counts[id]}</span>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || specimens.filter(s => s.status === 'Auditoria').length === 0}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
              isAnalyzing ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20")}>
            {isAnalyzing
              ? <><Loader2 size={16} className="animate-spin" /><span>{analysisProgress}%</span></>
              : <><Sparkles size={16} /><span>ANALISAR</span></>}
          </button>
          <button
            onClick={exportToPDF}
            disabled={filteredSpecimens.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">
            <Download size={16} /><span>PDF</span>
          </button>
          <button
            onClick={() => setIsConfirmingExclusion(true)}
            disabled={specimens.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 text-sm font-bold transition-all">
            <Trash2 size={16} /><span>LIMPAR</span>
          </button>
        </div>
      </div>

      {filteredSpecimens.length === 0 ? (
        <div className="h-72 lg:h-96 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2.5rem] border border-slate-100">
          <Inbox size={48} className="opacity-10 mb-4" />
          <p className="text-base font-medium">Nenhum registro encontrado</p>
          <p className="text-sm">Importe arquivos PDF para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredSpecimens.map(specimen => (
            <SpecimenCard key={specimen.id} specimen={specimen} onClick={() => setSelectedSpecimen(specimen)} />
          ))}
        </div>
      )}

      {selectedSpecimen && (
        <SpecimenDetailView
          key={selectedSpecimen.id}
          specimen={selectedSpecimen}
          onClose={() => setSelectedSpecimen(null)}
          onUpdate={() => loadData(true)}
          onNext={filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id) < filteredSpecimens.length - 1 ? handleNext : undefined}
          onPrev={filteredSpecimens.findIndex(s => s.id === selectedSpecimen.id) > 0 ? handlePrev : undefined}
        />
      )}

      {/* Confirm delete modal */}
      {isConfirmingExclusion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Excluir Tudo?</h3>
            <p className="text-slate-500 text-center text-sm mb-8">Esta ação é irreversível e removerá todos os {specimens.length} registros.</p>
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                setIsConfirmingExclusion(false);
                setLoading(true);
                try {
                  await deleteAllSpecimens();
                  showToast('Galeria limpa com sucesso.', 'success');
                } catch {
                  showToast('Erro ao limpar a galeria.', 'error');
                }
                await loadData();
              }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all">
                SIM, LIMPAR GALERIA
              </button>
              <button onClick={() => setIsConfirmingExclusion(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            "toast-enter flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold max-w-xs sm:max-w-sm pointer-events-auto",
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          )}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'error' ? <BadgeAlert size={18} /> : <Sparkles size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
