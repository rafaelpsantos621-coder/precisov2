'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSpecimens, updateSpecimen, deleteAllSpecimens } from '@/lib/data';
import { Specimen } from '@/types';
import { Loader2, Inbox, LayoutGrid, Users, Building2, Clock, BadgeAlert, Trash2, Download, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, isSpecialClient, isRetainedClient, getOccurrenceLabel } from '@/lib/utils';
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

// OC codes where the photo is of the facade — reading divergence should NOT be flagged
const FACADE_OC_CODES = ['07', '16', '20', '007', '016', '020'];

// OC codes that auto-generate observations
const OC_OBSERVATIONS: Record<string, string> = {
  '48': 'Baixo consumo, imóvel habitado.',
  'OCI 48': 'Baixo consumo, imóvel habitado.',
  '40': 'Imóvel sem caixa de correio.',
  'OCI 40': 'Imóvel sem caixa de correio.',
  '51': 'Baixo consumo, verificar histórico.',
  '54': 'Evidências de vazamento no imóvel.',
  '53': 'Imóvel em obra.',
  '50': 'Fonte alternativa de abastecimento.',
  '17': 'Consumo total — conta retida.',
  '03': 'Hidrômetro submerso, leitura via cavalete.',
  '06': 'Cúpula embaçada, leitura comprometida.',
  '21': 'Cúpula do mostrador depredada.',
  '14': 'Difícil acesso ao hidrômetro.',
  '45': 'Tampa fechada, acesso impedido.',
};

function analyzeSpecimen(specimen: Specimen): Partial<Specimen> {
  const ocCode = String(specimen.oc_code || '').trim();
  const isFacade = FACADE_OC_CODES.includes(ocCode);
  const leitDoc = String(specimen.leitura_documento || '').trim();
  const leitHid = String(specimen.leitura_hidrometro || '').trim();

  // Determine if there's a real reading divergence
  const hasDivergence =
    !isFacade &&
    leitDoc !== '' &&
    leitHid !== '' &&
    leitDoc !== leitHid;

  // Build observations from OC code
  const ocObservation = OC_OBSERVATIONS[ocCode] || '';
  const existingObs = specimen.observations || '';
  let finalObs = existingObs;
  if (ocObservation && !existingObs.includes(ocObservation)) {
    finalObs = ocObservation + (existingObs ? ' ' + existingObs : '');
  }

  // Determine if retained
  const retained = isRetainedClient(specimen);
  // Determine if special
  const special = isSpecialClient(specimen);

  const status = hasDivergence ? 'Divergência' : 'Sucesso';

  const update: Partial<Specimen> = {
    status,
    observations: finalObs || undefined,
    is_retida: retained,
    tipo_cliente: special ? 'empresa' : specimen.tipo_cliente,
  };

  return update;
}

export default function GalleryView({ query }: GalleryViewProps) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [isConfirmingExclusion, setIsConfirmingExclusion] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLog, setAnalysisLog] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
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
    setAnalysisLog('');

    let successCount = 0;
    let divergenceCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendings.length; i++) {
      const specimen = pendings[i];
      setAnalysisLog(`Analisando matrícula ${specimen.matricula}...`);

      try {
        const updates = analyzeSpecimen(specimen);
        await updateSpecimen(specimen.id, updates);

        if (updates.status === 'Divergência') divergenceCount++;
        else successCount++;
      } catch (err) {
        console.error(`Erro ao analisar ${specimen.matricula}:`, err);
        errorCount++;
      }

      setAnalysisProgress(Math.round(((i + 1) / pendings.length) * 100));
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    }

    await loadData(true);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisLog('');

    const msg = `${pendings.length} analisados — ✓ ${successCount} corretos, ⚠ ${divergenceCount} divergentes${errorCount > 0 ? `, ${errorCount} erros` : ''}.`;
    showToast(msg, divergenceCount > 0 ? 'error' : 'success');
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
      s.matricula || '-',
      s.name || '-',
      s.leitura_documento || '-',
      s.leitura_hidrometro || '-',
      s.status,
      s.oc_code ? `${s.oc_code} – ${getOccurrenceLabel(s.oc_code)}` : 'Normal',
      s.observations || '-',
    ]);
    doc.setFontSize(16);
    doc.text('Relatório – Preciso.OCR', 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 27);
    autoTable(doc, {
      head: [['Matrícula', 'Nome', 'Leit. Doc', 'Leit. Real', 'Status', 'OC', 'Observações']],
      body: rows,
      startY: 32,
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 6: { cellWidth: 40 } },
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

  const pendingCount = specimens.filter(s => s.status === 'Auditoria').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Analyzing progress bar */}
      {isAnalyzing && (
        <div className="card-glass p-5 border border-blue-100 bg-blue-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-blue-600 animate-spin" />
              <span className="text-sm font-bold text-blue-900">{analysisLog || 'Analisando...'}</span>
            </div>
            <span className="text-sm font-black text-blue-600">{analysisProgress}%</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col gap-4">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide w-full">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
                activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <Icon size={14} /> {label}
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{counts[id]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || pendingCount === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
              isAnalyzing || pendingCount === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20 hover:opacity-90"
            )}>
            {isAnalyzing
              ? <><Loader2 size={16} className="animate-spin" /><span>{analysisProgress}%</span></>
              : <><Sparkles size={16} /><span>ANALISAR {pendingCount > 0 ? `(${pendingCount})` : ''}</span></>}
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

          {pendingCount === 0 && specimens.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">Todos os registros já foram analisados.</span>
          )}
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
            <p className="text-slate-500 text-center text-sm mb-8">
              Esta ação é irreversível e removerá todos os {specimens.length} registros.
            </p>
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
            t.type === 'error' ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'
          )}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Sparkles size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
