'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Sistema Ativo', msg: 'Preciso OCR está funcionando normalmente.', type: 'success', time: 'agora' },
    { id: 2, title: 'OCR Disponível', msg: 'Gemini AI conectado e pronto para extração.', type: 'info', time: '1m atrás' },
  ];

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all relative">
        <Bell size={20} />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Notificações</h4>
              <button className="text-[10px] uppercase font-black text-blue-600 hover:underline">Limpar tudo</button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')}>
                      {n.type === 'success' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.msg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Ver todas as notificações
            </button>
          </div>
        </>
      )}
    </div>
  );
}
