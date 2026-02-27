import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormData, loginSchema } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';
import { Link } from 'react-router-dom';

export const LoginView = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await authService.login(data);
      localStorage.setItem('token', result.access_token); // Guardamos el token para futuras peticiones
      alert("Login exitoso");
    } catch (error: any) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} className="w-full p-2 border border-gray-300 rounded" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input type="password" {...register('password')} className="w-full p-2 border border-gray-300 rounded" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Entrar
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Regístrate aquí</Link>
        </p>
      </form>
    </div>
  );
};