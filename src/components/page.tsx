'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart3, UploadCloud, LayoutGrid, ClipboardCheck, Settings, LogOut, ChevronRight, User as UserIcon, Search, Menu, X, Users } from "lucide-react";
import DashboardView from "@/components/DashboardView";
import ImportView from "@/components/ImportView";
import GalleryView from "@/components/GalleryView";
import SettingsView from "@/components/SettingsView";
import UsersView from "@/components/UsersView";
import LoginPage from "@/components/LoginPage";
import NotificationDropdown from "@/components/NotificationDropdown";

type ViewType = 'dashboard' | 'import' | 'gallery' | 'settings' | 'users';

export default function App() {
  const { user, role, isAdmin, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;
  if (!user) return <LoginPage />;

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: BarChart3 },
    { id: 'import', label: 'Importação', icon: UploadCloud },
    { id: 'gallery', label: 'Galeria', icon: LayoutGrid },
    { id: 'settings', label: 'Configurações', icon: Settings },
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: Users }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter relative">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-400 transition-all duration-300 flex flex-col z-50 fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
        (isSidebarOpen || isMobileMenuOpen) ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
              <ClipboardCheck size={20} />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-montserrat font-black text-white tracking-tight truncate text-lg">
                PRECISO<span className="text-blue-500">.</span>
              </span>
            )}
          </div>
          <button
            onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors">
            {isMobileMenuOpen ? <X size={18} /> : (
              <ChevronRight className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")} size={18} />
            )}
          </button>
        </div>

        <nav className="flex-1 mt-8 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveView(item.id as ViewType); if (window.innerWidth < 1024) setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all group relative font-medium",
                activeView === item.id
                  ? item.id === 'users'
                    ? "bg-violet-600 text-white shadow-xl shadow-violet-600/20"
                    : "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                  : "hover:bg-slate-800/50 hover:text-white text-slate-400"
              )}>
              <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110",
                activeView === item.id ? "text-white" : "text-slate-500 group-hover:text-white")} />
              {(isSidebarOpen || isMobileMenuOpen) && (
                <span className="text-sm tracking-wide">{item.label}</span>
              )}
              {/* Badge ADMIN na aba usuários */}
              {item.id === 'users' && (isSidebarOpen || isMobileMenuOpen) && (
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              {!isSidebarOpen && !isMobileMenuOpen && (
                <div className="absolute left-16 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-slate-700 font-bold">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <button onClick={signOut}
            className={cn("w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-red-500 group transition-all duration-300 text-slate-500 hover:text-white mb-4",
              !isSidebarOpen && !isMobileMenuOpen && "justify-center px-0")}>
            <LogOut size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
            {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-bold">Sair do Sistema</span>}
          </button>

          <div className={cn("flex items-center gap-3 p-2 rounded-2xl bg-slate-800/30 border border-slate-700/30 transition-all",
            !isSidebarOpen && !isMobileMenuOpen && "justify-center p-1")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-lg">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              ) : <UserIcon size={18} />}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate tracking-tight">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Analista'}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    {isAdmin ? 'Administrador' : 'Operador'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Pesquisar matrícula, cliente ou status..."
                className="w-full pl-12 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 font-inter">
            <NotificationDropdown />
            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-black text-blue-600">Ambiente de Análise</span>
              <span className="text-xs font-bold text-slate-900">v2.0.0-stable</span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'import' && <ImportView onComplete={() => setActiveView('gallery')} />}
            {activeView === 'gallery' && <GalleryView query={searchQuery} />}
            {activeView === 'settings' && <SettingsView />}
            {activeView === 'users' && <UsersView />}
          </div>
        </section>
      </main>
    </div>
  );
}
