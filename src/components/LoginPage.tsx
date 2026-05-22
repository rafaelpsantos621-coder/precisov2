'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { ClipboardCheck, ArrowRight, ShieldCheck, Zap, BarChart3, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) setError(error.message || 'Verifique suas credenciais.');
    } catch {
      setError('Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 animate-in fade-in slide-in-from-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
              <ClipboardCheck size={28} />
            </div>
            <h1 className="text-3xl font-black text-white font-montserrat tracking-tight">
              Preciso<span className="text-blue-500">OCR</span>
            </h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Análise Inteligente de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Leitura
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Otimize sua verificação documental com processador OCR de alta fidelidade.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <ShieldCheck className="text-blue-400 mb-2" />
              <h3 className="text-white font-bold text-sm">Segurança</h3>
              <p className="text-slate-500 text-xs">Dados criptografados.</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <Zap className="text-yellow-400 mb-2" />
              <h3 className="text-white font-bold text-sm">Velocidade</h3>
              <p className="text-slate-500 text-xs">Processamento Real-time.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-right w-full">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 mb-6 border border-slate-100">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo de volta!</h3>
          <p className="text-slate-500 mb-8 text-sm">Acesse sua conta para gerenciar as extrações.</p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" />
              </div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-xl group disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Entrar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mt-6">
            Ao entrar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
