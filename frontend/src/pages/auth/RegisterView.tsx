import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// 1. Añadimos Eye y EyeOff a las importaciones
import { BookOpen, User, Mail, Lock, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

export const RegisterView = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 2. Creamos el estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth(); 
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/login'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8e6e2] via-[#f5f3f0] to-[#e3e0da] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* ... decoraciones de fondo iguales ... */}
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-[2rem] shadow-2xl shadow-neutral-400/30 mb-6 relative">
            <BookOpen className="w-12 h-12 text-white" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-5xl mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight font-bold">
            Únete
          </h1>
          <p className="text-muted-foreground text-lg italic">Crea tu espacio de lectura</p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-neutral-300/20 p-9 border border-neutral-200/40">
          
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Nombre ... igual */}
            <div>
              <label htmlFor="name" className="block text-sm mb-2.5 text-slate-700 font-medium ml-2">
                Nombre Completo
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-input-background border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            </div>

            {/* Input Email ... igual */}
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
                />
              </div>
            </div>

            {/* Input Password con OJO */}
            <div>
              <label htmlFor="password" className="block text-sm mb-2.5 text-slate-700 font-medium ml-2">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-input-background border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                {/* 5. Botón del Ojo */}
                <button
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
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
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-bold transition-colors underline-offset-4 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}