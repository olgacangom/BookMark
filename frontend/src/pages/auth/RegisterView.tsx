import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { RegisterFormData, registerSchema } from '../../schemas/auth.schema';
import { authService } from '../../auth/auth.service';

export const RegisterView = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      console.log("¡Registro exitoso! Ya puedes iniciar sesión.");
    } catch (error: any) {
      console.log(error.response?.data?.message || "Error al registrarse");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
        
        {/* Campo Nombre Completo */}
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-sm font-medium mb-1">
            Nombre Completo
          </label>
          <input 
            id="fullName" 
            {...register('fullName')} 
            className={`w-full p-2 border rounded ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        {/* Campo Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input 
            id="email" 
            {...register('email')} 
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Campo Contraseña */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <input 
            id="password" 
            type="password" 
            {...register('password')} 
            className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`} 
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
           ¿Ya tienes cuenta?{' '}
           <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
};