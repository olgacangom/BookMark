import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../auth/auth.service';
import api from '../../services/api'; // Tu instancia de axios

export const RegisterView = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validación básica antes de llamar al backend
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato de email inválido');
      return;
    }

    try {
      await api.post('/auth/register', formData);
      const res = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      login(res.access_token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al crear la cuenta. El email podría estar en uso.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2ff] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center">
        <h2 className="text-4xl font-black text-indigo-900/80 mb-2">Crea tu cuenta</h2>
        <p className="text-gray-400 mb-8">Únete a tu nueva biblioteca virtual</p>

        {error && <p className="text-red-500 bg-red-50 p-3 rounded-xl mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Campo Nombre */}
          <div>
            <label className="text-xs font-black text-indigo-900/40 uppercase ml-4 mb-2 block">Nombre Completo</label>
            <div className="relative">
              <span className="absolute left-5 top-4 opacity-40">👤</span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  setError('');
                }}
                placeholder="Tu nombre completo"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Campo Email */}
          <div>
            <label className="text-xs font-black text-indigo-900/40 uppercase ml-4 mb-2 block">Email</label>
            <div className="relative">
              <span className="absolute left-5 top-4 opacity-40">✉️</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setError('');
                }}
                placeholder="tu@email.com"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Campo Password */}
          <div>
            <label className="text-xs font-black text-indigo-900/40 uppercase ml-4 mb-2 block">Contraseña</label>
            <div className="relative">
              <span className="absolute left-5 top-4 opacity-40">🔒</span>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError('');
                }}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-600"
                required
              />
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all">
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-purple-500 font-bold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};