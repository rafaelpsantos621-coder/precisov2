'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  msg: string;
  type: 'success' | 'info';
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, title: 'Sistema Ativo', msg: 'Preciso.OCR está funcionando normalmente.', type: 'success', time: 'agora', read: false },
  { id: 2, title: 'OCR Disponível', msg: 'Gemini AI conectado e pronto para extração.', type: 'info', time: '1m atrás', read: false },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all relative">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Notificações</h4>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] uppercase font-black text-blue-600 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                  <Bell size={32} className="opacity-20 mb-2" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn("p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer",
                      !n.read && "bg-blue-50/30")}
                  >
                    <div className="flex gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')}>
                        {n.type === 'success' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{n.msg}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                        className="p-1 text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => { setNotifications([]); }}
                className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100">
                Limpar tudo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
