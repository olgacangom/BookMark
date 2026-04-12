import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const ResetPasswordView = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Las contraseñas no coinciden");
        
        setError("");
        setIsSubmitting(true);
        try {
            await api.post('/auth/reset-password', { token, newPass: password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch {
            setError("El enlace ha expirado o es inválido. Solicita uno nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center p-6 text-left">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-[3rem] p-12 shadow-2xl border-8 border-white">
                {success ? (
                    <div className="text-center py-6 animate-in zoom-in">
                        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={60} />
                        <h2 className="text-2xl font-black text-slate-900 uppercase">¡Clave actualizada!</h2>
                        <p className="text-slate-500 text-sm mt-2">Redirigiendo al inicio de sesión...</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Nueva <span className="text-teal-600">Clave.</span></h2>
                        <p className="text-slate-500 text-sm mb-8 font-medium">Define tu nueva contraseña de acceso.</p>
                        
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nueva Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        type="password" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 transition-all text-sm font-semibold"
                                        placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Confirmar Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        type="password" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 transition-all text-sm font-semibold"
                                        placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] transition-all"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Lock size={16} /> Guardar cambios</>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};