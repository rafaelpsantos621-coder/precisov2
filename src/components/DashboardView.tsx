'use client';

import { useState, useEffect } from 'react';
import { fetchSpecimens } from '@/lib/data';
import { Specimen } from '@/types';
import { TrendingUp, Database, CheckCircle2, AlertCircle, Activity, LayoutGrid, Loader2, BadgeAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { isSpecialClient, isRetainedClient, cn } from '@/lib/utils';

export default function DashboardView() {
  const [data, setData] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Garante a montagem correta no client-side para evitar erros de hidratação de data
  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSpecimens();
      setData(res || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: data.length,
    success: data.filter(s => s.status === 'Sucesso').length,
    divergent: data.filter(s => s.status === 'Divergência').length,
    auditing: data.filter(s => s.status === 'Auditoria').length,
    special: data.filter(isSpecialClient).length,
    retained: data.filter(isRetainedClient).length
  };

  const chartData = [
    { name: 'Sucesso', value: stats.success, color: '#10b981' },
    { name: 'Divergente', value: stats.divergent, color: '#f59e0b' },
    { name: 'Auditoria', value: stats.auditing, color: '#3b82f6' }
  ];

  const categoryData = [
    { name: 'Geral', value: Math.max(0, stats.total - stats.special - stats.retained) },
    { name: 'Especial', value: stats.special },
    { name: 'Retidas', value: stats.retained }
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981'];

  if (loading || !isMounted) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium animate-pulse">Carregando indicadores...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-3xl border border-red-100 animated animate-in">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <BadgeAlert size={32} />
      </div>
      <h3 className="text-xl font-bold text-red-900 mb-2 font-montserrat">Erro ao Carregar</h3>
      <p className="text-red-700 max-w-md mx-auto mb-6 text-sm">{error}</p>
      <button onClick={loadData} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/10">
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animated animate-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 font-montserrat tracking-tight">Painel de Controle</h1>
        <p className="text-sm text-slate-500 mt-1">Visão analítica do processamento e auditoria de faturas.</p>
      </div>

      {/* Grid de Cards de Estatística */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Processado" value={stats.total} icon={Database} color="blue" trend="+12% este mês" />
        <StatCard title="Verificados" value={stats.success} icon={CheckCircle2} color="emerald" trend={`${stats.total > 0 ? Math.round(stats.success / stats.total * 100) : 0}% Precisão`} />
        <StatCard title="Divergências" value={stats.divergent} icon={AlertCircle} color="amber" trend="Atuação imediata" />
        <StatCard title="Contas Retidas" value={stats.retained} icon={Activity} color="indigo" trend="Status pendente" />
      </div>

      {/* Seção Gráfica */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 card-glass p-4 sm:p-6 lg:p-8 space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 font-montserrat text-base">
            <TrendingUp size={20} className="text-blue-500" /> Desempenho de Auditoria
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'rgba(241,245,249,0.4)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px' }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass p-4 sm:p-6 lg:p-8 space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 font-montserrat text-base">
            <LayoutGrid size={20} className="text-blue-500" /> Categorias
          </h3>
          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={80} paddingAngle={6} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registros</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-slate-600">{c.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Extrações Recentes */}
      <div className="card-glass p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 font-montserrat text-base">Extrações Recentes</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Matrícula</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Cliente</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">OC</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Status</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {data.slice(0, 5).map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-4 font-black text-slate-900 text-xs">#{s.matricula}</td>
                  <td className="py-4 font-bold text-slate-600 text-xs truncate max-w-[180px] lg:max-w-[240px]">{s.name}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-colors">
                      OC {s.oc_code || '00'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-bold",
                      s.status === 'Sucesso' ? 'text-emerald-600' :
                      s.status === 'Divergência' ? 'text-orange-600' : 'text-blue-600')}>
                      <span className={cn("w-1.5 h-1.5 rounded-full",
                        s.status === 'Sucesso' ? 'bg-emerald-500' :
                        s.status === 'Divergência' ? 'bg-orange-500' : 'bg-blue-500')} />
                      {s.status}
                    </div>
                  </td>
                  <td className="py-4 text-right text-[10px] font-bold text-slate-400">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400 font-medium">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Interface tipada para evitar erros no modo estrito do tsconfig
interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'indigo';
  trend: string;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  // Configuração isolada de cores para evitar conflito com a classe card-glass
  const colorMap = {
    blue: { bg: 'bg-blue-50/60', iconBg: 'bg-blue-100 text-blue-600', border: 'hover:border-blue-200' },
    emerald: { bg: 'bg-emerald-50/60', iconBg: 'bg-emerald-100 text-emerald-600', border: 'hover:border-emerald-200' },
    amber: { bg: 'bg-amber-50/60', iconBg: 'bg-amber-100 text-amber-600', border: 'hover:border-amber-200' },
    indigo: { bg: 'bg-indigo-50/60', iconBg: 'bg-indigo-100 text-indigo-600', border: 'hover:border-indigo-200' }
  };

  return (
    <div className={cn(
      "card-glass p-6 border border-slate-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between",
      colorMap[color].bg,
      colorMap[color].border
    )}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl shadow-sm", colorMap[color].iconBg)}>
            <Icon size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/80">Métrica</span>
        </div>
        <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</h4>
        <p className="text-xs font-bold text-slate-500">{title}</p>
      </div>
      
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-200/40 mt-4">
        <TrendingUp size={12} className="text-slate-400" />
        {trend}
      </div>
    </div>
  );
}