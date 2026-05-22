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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSpecimens();
      setData(res);
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
    { name: 'Geral', value: stats.total - stats.special - stats.retained },
    { name: 'Especial', value: stats.special },
    { name: 'Retidas', value: stats.retained }
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981'];

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500 animate-pulse">Carregando indicadores...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-[3rem] border border-red-100">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
        <BadgeAlert size={32} />
      </div>
      <h3 className="text-xl font-bold text-red-900 mb-2">Erro ao Carregar</h3>
      <p className="text-red-700 max-w-md mx-auto mb-6">{error}</p>
      <button onClick={loadData} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 font-montserrat tracking-tight">Painel de Controle</h1>
        <p className="text-sm text-slate-500 mt-1">Visão analítica do processamento e auditoria de faturas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Processado" value={stats.total} icon={Database} color="blue" trend="+12% este mês" />
        <StatCard title="Verificados" value={stats.success} icon={CheckCircle2} color="emerald" trend={`${stats.total > 0 ? Math.round(stats.success/stats.total*100) : 0}% Precisão`} />
        <StatCard title="Divergências" value={stats.divergent} icon={AlertCircle} color="amber" trend="Atuação imediata" />
        <StatCard title="Contas Retidas" value={stats.retained} icon={Activity} color="indigo" trend="Status pendente" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 card-glass p-4 sm:p-8 space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Desempenho de Auditoria
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass p-4 sm:p-8 space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid size={20} className="text-blue-500" /> Categorias
          </h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registros</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-slate-600">{c.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent table */}
      <div className="card-glass p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-800">Extrações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Matrícula</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Cliente</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">OC</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Status</th>
                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.slice(0, 5).map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-black text-slate-900 text-xs">#{s.matricula}</td>
                  <td className="py-4 font-bold text-slate-600 text-xs truncate max-w-[200px]">{s.name}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                      OC {s.oc_code || '00'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-bold",
                      s.status === 'Sucesso' ? 'text-emerald-600' :
                      s.status === 'Divergência' ? 'text-orange-600' : 'text-blue-600')}>
                      <div className={cn("w-1.5 h-1.5 rounded-full",
                        s.status === 'Sucesso' ? 'bg-emerald-500' :
                        s.status === 'Divergência' ? 'bg-orange-500' : 'bg-blue-500')} />
                      {s.status}
                    </div>
                  </td>
                  <td className="py-4 text-right text-[10px] font-bold text-slate-400">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <div className={cn("card-glass p-6 border group hover:scale-[1.03] transition-all duration-300", colorMap[color])}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl",
          color === 'blue' ? 'bg-blue-100' : color === 'emerald' ? 'bg-emerald-100' :
          color === 'amber' ? 'bg-amber-100' : 'bg-indigo-100')}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">Insight</span>
      </div>
      <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
      <p className="text-xs font-bold text-slate-500 mb-4">{title}</p>
      <div className="flex items-center gap-1.5 text-[10px] font-black py-2 border-t border-slate-100 mt-2">
        <TrendingUp size={12} />
        {trend}
      </div>
    </div>
  );
}
