import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext"; 
import { BookOpen, Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import api from "../../services/api";

export const LoginView = () => {
  // ✅ 1. Definimos los estados correctamente (esto es lo que faltaba)
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
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });

      const { access_token, user } = response.data;

      login(access_token, user);
      
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error en login:", err);
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8e6e2] via-[#f5f3f0] to-[#e3e0da] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-neutral-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-stone-300/20 rounded-full blur-3xl" />

      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-neutral-300/20 p-9 border border-neutral-200/40 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-[2rem] shadow-2xl shadow-neutral-400/30 mb-6 relative">
            <BookOpen className="w-12 h-12 text-white" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-5xl mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight font-bold">
            Bienvenido/a
          </h1>
          <p className="text-muted-foreground text-lg italic">
            Entra a tu espacio de lectura
          </p>
        </div>

        {/* ✅ Mensaje de error (corregido caso sensible Error/error) */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm mb-2.5 text-slate-700 font-medium ml-2">
              Correo Electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-input-background border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                placeholder="tu@email.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2.5 text-slate-700 font-medium ml-2">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-input-background border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-secondary font-bold transition-colors underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}