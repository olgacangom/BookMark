import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, Mail, Lock, Sparkles, Loader2, ChevronRight } from "lucide-react";
import api from "../../services/api";

export const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      login(access_token, user);
      navigate("/explore");
    } catch { // <--- ELIMINA EL (_err) AQUÍ
      setError("Las credenciales no coinciden con nuestros registros.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* TARJETA PRINCIPAL (Efecto Glassmorphism Figma) */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(13,148,136,0.1)] border border-white p-10 md:p-12 relative overflow-hidden">

          {/* LOGO (Estilo Header Figma) */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-[1.8rem] shadow-xl shadow-teal-600/20 mb-6 relative transform transition-transform hover:scale-105 duration-500">
              <BookOpen className="w-10 h-10 text-white" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">
              Book<span className="text-teal-600 font-serif italic font-normal">Mark</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Tu espacio literario
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 text-sm font-semibold placeholder:text-slate-300"
                  placeholder="ejemplo@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 text-sm font-semibold placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* BOTÓN CON GRADIENTE FIGMA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white py-4 rounded-2xl hover:shadow-lg hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-md"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-slate-50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-teal-600 hover:text-emerald-600 font-bold transition-colors underline underline-offset-4"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
          BookMark © 2026
        </p>
      </div>
    </div>
  );
};