'use client';

import { useState } from 'react';
import { FileText, Download, TrendingUp, Calendar, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function ReportsView() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30');

  // Métricas para auditoria e volumetria do OCR
  const reportStats = {
    totalProcessed: 1420,
    ocrSuccessRate: '98.4%',
    pendingReview: 12,
    totalVolumeFaturado: 'R$ 642.500,00'
  };

  // Lista de fechamentos simulados prontos para download
  const reportRows = [
    { id: '1', date: '11/06/2026', type: 'Fechamento Mensal', status: 'Concluído', size: '2.4 MB' },
    { id: '2', date: '01/06/2026', type: 'Estatísticas de Assertividade OCR', status: 'Concluído', size: '1.1 MB' },
    { id: '3', date: '25/05/2026', type: 'Auditoria de Faturas Pendentes', status: 'Concluído', size: '940 KB' },
    { id: '4', date: '15/05/2026', type: 'Relatório Consolidado de Faturamento', status: 'Concluído', size: '3.8 MB' },
  ];

  const handleExport = (type: string) => {
    setLoading(true);
    // Simula a geração e o download de um arquivo
    setTimeout(() => {
      setLoading(false);
      alert(`Relatório "${type}" exportado com sucesso para a sua pasta de Downloads!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter text-left">
      {/* Topo da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Relatórios e Auditoria</h1>
          <p className="text-slate-500 text-sm mt-0.5">Exporte e filtre métricas de volumetria, faturamento e acertos de leitura.</p>
        </div>

        {/* Filtro de Período */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          <Calendar size={15} className="text-slate-400 ml-2" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs font-bold text-slate-700 pr-8 pl-1 py-1 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Grid de Blocos Estatísticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Faturas Lidas</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{reportStats.totalProcessed}</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Precisão OCR</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{reportStats.ocrSuccessRate}</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Aguardando Revisão</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{reportStats.pendingReview}</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Volume Faturado</p>
            <p className="text-lg font-black text-slate-800 mt-0.5 whitespace-nowrap">{reportStats.totalVolumeFaturado}</p>
          </div>
        </div>
      </div>

      {/* Painel de Arquivos Consolidados */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Documentos Prontos para Exportação</h3>
          <p className="text-slate-400 text-xs mt-0.5">Selecione um fechamento operacional para baixar em formato CSV ou Excel.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {reportRows.map((row) => (
            <div key={row.id} className="p-4 lg:p-5 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{row.type}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                    <span>{row.date}</span>
                    <span>•</span>
                    <span>{row.size}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExport(row.type)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                <span>Exportar</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}