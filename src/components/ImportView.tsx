'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveSpecimen, uploadBase64Image } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface FileJob {
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'error';
  statusText?: string;
  progress: number;
  type: 'pdf' | 'image';
  results?: any[];
}

interface ImportViewProps { onComplete?: () => void; }

export default function ImportView({ onComplete }: ImportViewProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newJobs: FileJob[] = files.map(file => ({
      file, status: 'queued', progress: 0,
      type: file.type.includes('pdf') ? 'pdf' : 'image'
    }));
    setJobs(prev => [...prev, ...newJobs]);
    // reset input so same file can be re-added
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newJobs: FileJob[] = files.map(file => ({
      file, status: 'queued', progress: 0,
      type: file.type.includes('pdf') ? 'pdf' : 'image'
    }));
    setJobs(prev => [...prev, ...newJobs]);
  };

  const removeJob = (index: number) => setJobs(jobs.filter((_, i) => i !== index));

  const processAll = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profile) {
        await supabase.from('profiles').insert([{ id: user.id, display_name: user.email?.split('@')[0], role: 'analista' }]);
      }
    } catch {}

    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].status !== 'queued') continue;
      setJobs(prev => { const j = [...prev]; j[i].status = 'processing'; return j; });
      try { await processJob(i); } catch {
        setJobs(prev => { const j = [...prev]; j[i].status = 'error'; return j; });
      }
    }

    setIsProcessing(false);
    if (onComplete) setTimeout(onComplete, 1500);
  };

  const updateJobStatus = (jobIndex: number, status: FileJob['status'], text: string, progress?: number) => {
    setJobs(prev => {
      const nj = [...prev];
      if (nj[jobIndex]) {
        nj[jobIndex].status = status;
        nj[jobIndex].statusText = text;
        if (progress !== undefined) nj[jobIndex].progress = progress;
      }
      return nj;
    });
  };

  const processJob = async (jobIndex: number) => {
    const job = jobs[jobIndex];
    const file = job.file;
    const allResults: any[] = [];

    try {
      updateJobStatus(jobIndex, 'processing', 'Carregando módulos...', 5);

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

      const { extractDataFromImage } = await import('@/lib/ocr');
      const { cropImage, processImageForOCR } = await import('@/lib/image-utils');

      if (job.type === 'pdf') {
        updateJobStatus(jobIndex, 'processing', 'Lendo PDF...', 10);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        for (let p = 1; p <= pdf.numPages; p++) {
          try {
            const pageProgress = Math.round((p / pdf.numPages) * 100);
            updateJobStatus(jobIndex, 'processing', `Página ${p} de ${pdf.numPages}...`, pageProgress);

            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 2.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: false })!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport }).promise;

            const pageImage = canvas.toDataURL('image/jpeg', 0.9);
            canvas.width = 0; canvas.height = 0;

            updateJobStatus(jobIndex, 'processing', `Página ${p}: OCR...`, pageProgress);
            const extraction = await extractDataFromImage(pageImage);
            await new Promise(r => setTimeout(r, 1000));

            if (extraction?.extractions) {
              for (const ext of extraction.extractions) {
                try {
                  if (!ext.matricula) continue;
                  updateJobStatus(jobIndex, 'processing', `Salvando ${ext.matricula}...`, pageProgress);

                  const docSnippet = await cropImage(pageImage, ext.dataBoundingBox);
                  const meterSnippet = ext.meterBoundingBox ? await cropImage(pageImage, ext.meterBoundingBox) : null;

                  const docUpload = await uploadBase64Image(docSnippet, user!.id, `doc-${ext.matricula}`);
                  const meterUpload = meterSnippet ? await uploadBase64Image(meterSnippet, user!.id, `meter-${ext.matricula}`) : null;

                  const isRetida = Boolean(
                    (ext.oc_code && ['17','51','53','50','54'].includes(ext.oc_code)) ||
                    (ext.observations && /acréscimo|decréscimo|acrescimo|decrescimo/i.test(ext.observations))
                  );

                  await saveSpecimen({
                    user_id: user!.id,
                    matricula: String(ext.matricula),
                    name: ext.nome_cliente || 'Desconhecido',
                    leitura_documento: ext.leitura_documento,
                    leitura_hidrometro: ext.leitura_hidrometro,
                    tipo_cliente: ext.tipo_cliente,
                    oc_code: ext.oc_code,
                    oc_description: ext.observations,
                    image_url: docUpload.publicUrl,
                    meter_image_url: meterUpload?.publicUrl || undefined,
                    observations: ext.observations,
                    is_retida: isRetida,
                    status: 'Auditoria'
                  });

                  allResults.push(ext);
                  await new Promise(r => setTimeout(r, 300));
                } catch (e) { console.error('Erro ao salvar extração:', e); }
              }
            }
          } catch (pageError) { console.error(`Erro na página ${p}:`, pageError); }
        }
      } else {
        updateJobStatus(jobIndex, 'processing', 'Lendo imagem...', 10);
        const reader = new FileReader();
        const rawImage = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        updateJobStatus(jobIndex, 'processing', 'Otimizando...', 30);
        const pageImage = await processImageForOCR(rawImage);

        updateJobStatus(jobIndex, 'processing', 'OCR em andamento...', 50);
        const extraction = await extractDataFromImage(pageImage);

        if (extraction?.extractions) {
          for (const ext of extraction.extractions) {
            try {
              if (!ext.matricula) continue;
              const docSnippet = await cropImage(pageImage, ext.dataBoundingBox);
              const meterSnippet = ext.meterBoundingBox ? await cropImage(pageImage, ext.meterBoundingBox) : null;
              const docUpload = await uploadBase64Image(docSnippet, user!.id, `doc-${ext.matricula}`);
              const meterUpload = meterSnippet ? await uploadBase64Image(meterSnippet, user!.id, `meter-${ext.matricula}`) : null;

              await saveSpecimen({
                user_id: user!.id,
                matricula: String(ext.matricula),
                name: ext.nome_cliente || 'Desconhecido',
                leitura_documento: ext.leitura_documento,
                leitura_hidrometro: ext.leitura_hidrometro,
                tipo_cliente: ext.tipo_cliente,
                oc_code: ext.oc_code,
                image_url: docUpload.publicUrl,
                meter_image_url: meterUpload?.publicUrl,
                observations: ext.observations,
                status: 'Auditoria'
              });

              allResults.push(ext);
              await new Promise(r => setTimeout(r, 300));
            } catch (e) { console.error('Erro na extração:', e); }
          }
        }
      }

      setJobs(prev => {
        const nj = [...prev];
        if (nj[jobIndex]) { nj[jobIndex].status = 'completed'; nj[jobIndex].progress = 100; nj[jobIndex].results = allResults; }
        return nj;
      });
    } catch (jobError: any) {
      updateJobStatus(jobIndex, 'error', 'Falha no processamento', 0);
      throw jobError;
    }
  };

  const pendingCount = jobs.filter(j => j.status === 'queued').length;
  const allDone = jobs.length > 0 && jobs.every(j => j.status === 'completed');

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header - responsive stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 font-montserrat tracking-tight">Importação de Documentos</h1>
          <p className="text-slate-500 mt-1 text-sm">Carregue PDFs para extração automática via Gemini AI.</p>
        </div>
        <button
          onClick={processAll}
          disabled={isProcessing || pendingCount === 0 || allDone}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          Iniciar Processamento
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Upload area */}
        <div className="lg:col-span-1 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="card-glass border-2 border-dashed border-slate-200 p-10 lg:p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Arraste ou clique</h3>
            <p className="text-sm text-slate-400 mt-2">Suporta PDF, JPG e PNG.</p>
            <input type="file" multiple onChange={onFileChange} ref={fileInputRef} className="hidden" accept=".pdf,image/*" />
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1 text-[10px] uppercase tracking-wider">Lembrete de Auditoria</p>
                Certifique-se de que as imagens do documento e do hidrômetro estejam na mesma página.
              </div>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Fila de Processamento ({jobs.length})</h3>
            {jobs.length > 0 && (
              <button onClick={() => setJobs([])} className="text-xs font-bold text-red-500 hover:underline">
                Limpar lista
              </button>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="h-48 lg:h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">
              <FileText size={40} className="opacity-20 mb-3" />
              <p className="text-sm">Nenhum arquivo na fila.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, idx) => (
                <div key={idx} className="card-glass p-4 lg:p-5 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0",
                      job.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500')}>
                      {job.type === 'pdf' ? <FileText size={18} /> : <ImageIcon size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{job.file.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                          {job.statusText || (job.status === 'queued' ? 'Aguardando' : job.status === 'processing' ? `${job.progress}%` : job.status === 'completed' ? 'Concluído' : 'Erro')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-300",
                            job.status === 'completed' ? 'bg-emerald-500' : job.status === 'error' ? 'bg-red-500' : 'bg-blue-600')}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      {job.status === 'completed' ? <CheckCircle2 className="text-emerald-500" size={20} /> :
                       job.status === 'error' ? <AlertCircle className="text-red-500" size={20} /> :
                       job.status === 'processing' ? <Loader2 className="text-blue-600 animate-spin" size={20} /> : (
                        <button onClick={() => removeJob(idx)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {job.status === 'completed' && job.results && job.results.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">Extraídos:</span>
                      {job.results.map((r, i) => (
                        <span key={i} className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          {r.matricula}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
