'use client';

import { useState, useEffect } from 'react';
import { fetchSpecimens, updateSpecimen, deleteAllSpecimens } from '@/lib/data';
import { Specimen } from '@/types';
import { Loader2, Inbox, LayoutGrid, Users, Building2, Clock, BadgeAlert, Trash2, Download, Sparkles } from 'lucide-react';
import { cn, isSpecialClient, isRetainedClient } from '@/lib/utils';
import SpecimenCard from './SpecimenCard';
import SpecimenDetailView from './SpecimenDetailView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GalleryViewProps { query: string; }
type TabType = 'all' | 'retained' | 'special' | 'general';

export default function GalleryView({ query }: GalleryViewProps) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [isConfirmingExclusion, setIsConfirmingExclusion] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Estado para gerenciar faturas ocultadas temporariamente pelo usuário (X)
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchSpecimens();
      setSpecimens(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    const pendings = specimens.filter(s => s.status === 'Auditoria');
    if (pendings.length === 0) { alert('Não há registros pendentes.'); return; }
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    let completed = 0;
    for (const specimen of pendings) {
      try {
        const isRetained = isRetainedClient(specimen);
        const isSpecial = isSpecialClient(specimen);
        const categoria: 'Retida' | 'Especial' | 'Geral' = isRetained ? 'Retida' : isSpecial ? 'Especial' : 'Geral';
        await updateSpecimen(specimen.id, { status: 'Sucesso', categoria });
      } catch (err) { console.error(err); }
      completed++;
      setAnalysisProgress(Math.round((completed / pendings.length) * 100));
    }
    await loadData(true);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    alert(pendings.length + ' registros analisados!');
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
    const currentFiltered = filteredSpecimens.filter(s => !hiddenIds.includes(s.id));
    const idx = currentFiltered.findIndex(s => s.id === selectedSpecimen.id);
    if (idx + 1 < currentFiltered.length) setSelectedSpecimen(currentFiltered[idx + 1]);
  };

  const handlePrev = () => {
    if (!selectedSpecimen) return;
    const currentFiltered = filteredSpecimens.filter(s => !hiddenIds.includes(s.id));
    const idx = currentFiltered.findIndex(s => s.id === selectedSpecimen.id);
    if (idx > 0) setSelectedSpecimen(currentFiltered[idx - 1]);
  };

  const exportToPDF = () => {
    const activeData = filteredSpecimens.filter(s => !hiddenIds.includes(s.id));
    if (activeData.length === 0) { alert('Não há dados para exportar.'); return; }
    const doc = new jsPDF();
    const rows = activeData.map(s => [
      s.matricula || '-', s.name || '-',
      s.leitura_documento || '-', s.leitura_hidrometro || '-',
      s.status, s.oc_code || '-'
    ]);
    doc.setFontSize(18);
    doc.text("Relatório - Preciso OCR", 14, 20);
    autoTable(doc, {
      head: [["Matrícula", "Nome", "Leitura Doc", "Leitura Real", "Status", "OC"]],
      body: rows, startY: 30,
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] }
    });
    doc.save('preciso_ocr_' + Date.now() + '.pdf');
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Carregando galeria...</p>
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

  // Filtra os espécimes finais removendo faturas ocultadas pelo "X" do card
  const visibleSpecimens = filteredSpecimens.filter(s => !hiddenIds.includes(s.id));

  return (
    <div className="space-y-6 animated animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto custom-scrollbar">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <Icon size={16} /> {label}
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{counts[id]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleStartAnalysis}
            disabled={isAnalyzing || specimens.filter(s => s.status === 'Auditoria').length === 0}
            className={cn("p-2.5 rounded-xl font-bold transition-all flex items-center gap-2 px-4 shadow-lg text-sm",
              isAnalyzing ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20")}>
            {isAnalyzing
              ? <><Loader2 size={18} className="animate-spin" /><span>{analysisProgress}%</span></>
              : <><Sparkles size={18} /><span>ANALISAR</span></>}
          </button>
          <button onClick={exportToPDF} disabled={visibleSpecimens.length === 0}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 px-4 shadow-lg shadow-blue-600/20 text-sm font-bold">
            <Download size={18} /><span>PDF</span>
          </button>
          <button onClick={() => setIsConfirmingExclusion(true)} disabled={specimens.length === 0}
            className="p-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 px-4 text-sm font-bold">
            <Trash2 size={18} /><span>LIMPAR</span>
          </button>
        </div>
      </div>

      {visibleSpecimens.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2.5rem] border border-slate-100">
          <Inbox size={64} className="opacity-10 mb-4" />
          <p className="text-lg font-medium">Nenhum registro ativo</p>
          <p className="text-sm">Todos os filtros aplicados ou cards ocultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleSpecimens.map(specimen => (
            <SpecimenCard 
              key={specimen.id} 
              specimen={{
                ...specimen,
                onHide: (id: string) => setHiddenIds(prev => [...prev, id])
              }} 
              onClick={() => setSelectedSpecimen(specimen)} 
            />
          ))}
        </div>
      )}

      {selectedSpecimen && (
        <SpecimenDetailView
          key={selectedSpecimen.id}
          specimen={selectedSpecimen}
          onClose={() => setSelectedSpecimen(null)}
          onUpdate={() => loadData(true)}
          onNext={visibleSpecimens.findIndex(s => s.id === selectedSpecimen.id) < visibleSpecimens.length - 1 ? handleNext : undefined}
          onPrev={visibleSpecimens.findIndex(s => s.id === selectedSpecimen.id) > 0 ? handlePrev : undefined}
        />
      )}

      {isConfirmingExclusion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Excluir Tudo?</h3>
            <p className="text-slate-500 text-center mb-8">Esta ação é irreversível.</p>
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                setIsConfirmingExclusion(false);
                setLoading(true);
                await deleteAllSpecimens();
                await loadData();
              }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700">
                SIM, LIMPAR GALERIA
              </button>
              <button onClick={() => setIsConfirmingExclusion(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}