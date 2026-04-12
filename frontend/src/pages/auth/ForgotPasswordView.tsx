import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const ForgotPasswordView = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch { alert("Error al enviar el correo"); } 
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border-8 border-white">
                {!sent ? (
                    <>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 text-left">
                            ¿Olvidaste tu <span className="text-teal-600">clave?</span>
                        </h2>
                        <p className="text-slate-500 text-sm mb-8 text-left font-medium">
                            Escribe tu correo y te enviaremos un enlace para recuperarla.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" required
                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button 
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar enlace'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6 animate-in zoom-in">
                        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={56} />
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-2">¡Correo enviado!</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Revisa tu bandeja de entrada (y la de spam) para continuar.</p>
                    </div>
                )}
                <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors">
                    <ArrowLeft size={14} /> Volver al login
                </Link>
            </div>
        </div>
    );
};