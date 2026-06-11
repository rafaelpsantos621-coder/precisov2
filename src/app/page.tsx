'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart3, UploadCloud, LayoutGrid, ClipboardCheck, Settings, LogOut, ChevronRight, User as UserIcon, Search, Menu, X } from "lucide-react";
import DashboardView from "@/components/DashboardView";
import ImportView from "@/components/ImportView";
import GalleryView from "@/components/GalleryView";
import SettingsView from "@/components/SettingsView";
import LoginPage from "@/components/LoginPage";
import NotificationDropdown from "@/components/NotificationDropdown";

type ViewType = 'dashboard' | 'import' | 'gallery' | 'settings';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sincroniza o tamanho da tela para fechar a sidebar em telas menores de forma segura
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
        setIsMobileMenuOpen(false); // Fecha o menu mobile se a tela crescer
      }
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
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter relative antialiased text-slate-800">
      
      {/* Backdrop Mobile com animação fluida */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar - Z-index elevado para z-50 para sobrepor qualquer tabela ou card */}
      <aside className={cn(
        "bg-slate-900 text-slate-400 transition-all duration-300 flex flex-col z-50 fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
        (isSidebarOpen || isMobileMenuOpen) ? "w-72" : "w-20",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Header da Sidebar */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
              <ClipboardCheck size={20} />
            </div>
            {/* Opacidade de transição evita quebra visual de texto espremido */}
            <span className={cn(
              "font-montserrat font-black text-white tracking-tight truncate text-lg transition-all duration-200",
              (isSidebarOpen || isMobileMenuOpen) ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"
            )}>
              PRECISO<span className="text-blue-500">.</span>
            </span>
          </div>
          
          <button
            onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors hidden lg:block"
            aria-label="Toggle Sidebar"
          >
            <ChevronRight className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")} size={18} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const isSelected = activeView === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => { 
                  setActiveView(item.id as ViewType); 
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(false); 
                }}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all group relative font-medium text-left",
                  isSelected
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                    : "hover:bg-slate-800/50 hover:text-white text-slate-400"
                )}
              >
                <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110",
                  isSelected ? "text-white" : "text-slate-500 group-hover:text-white")} />
                
                <span className={cn(
                  "text-sm tracking-wide transition-opacity duration-200 truncate",
                  (isSidebarOpen || isMobileMenuOpen) ? "opacity-100 w-auto" : "opacity-0 w-0 invisible"
                )}>
                  {item.label}
                </span>

                {/* Tooltip elegante quando recolhido */}
                {!isSidebarOpen && !isMobileMenuOpen && (
                  <div className="absolute left-16 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-slate-800 font-medium">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé do Perfil e Botão Sair */}
        <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-950/20">
          <button 
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 group transition-all duration-200 text-slate-500 mb-4 font-semibold text-sm",
              !isSidebarOpen && !isMobileMenuOpen && "justify-center px-0"
            )}
          >
            <LogOut size={20} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            {(isSidebarOpen || isMobileMenuOpen) && <span>Sair do Sistema</span>}
          </button>

          <div className={cn(
            "flex items-center gap-3 p-2 rounded-2xl bg-slate-800/30 border border-slate-800/50 transition-all",
            !isSidebarOpen && !isMobileMenuOpen && "justify-center p-1"
          )}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-lg">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              ) : <UserIcon size={18} />}
            </div>
            
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-white truncate tracking-tight">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Analista'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operador</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-30">
        
        {/* Header principal corrigido para evitar quebras em mobile */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0 gap-4">
          
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              aria-label="Abrir Menu"
            >
              <Menu size={22} />
            </button>
            
            {/* Campo de pesquisa responsivo */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar..."
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 font-medium placeholder-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          {/* Área de Notificação e Status - Esconde os textos longos em telas muito pequenas */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <NotificationDropdown />
            <div className="hidden xs:block h-6 w-[1px] bg-slate-200 mx-1 lg:mx-2" />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest font-black text-blue-600">Ambiente de Análise</span>
              <span className="text-xs font-bold text-slate-400">v2.0.0-stable</span>
            </div>
          </div>
        </header>

        {/* Seção Renderizadora das Views */}
        <section className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 custom-scrollbar">
          <div className="max-w-7xl mx-auto animated animate-in">
            {/* Opcional: Se desejar que o Dashboard também reaja ao filtro, passe a query para ele */}
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'import' && <ImportView onComplete={() => setActiveView('gallery')} />}
            {activeView === 'gallery' && <GalleryView query={searchQuery} />}
            {activeView === 'settings' && <SettingsView />}
          </div>
        </section>
      </main>
    </div>
  );
}