import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterFormData, registerSchema } from '../../schemas/auth.schema';
import { authService } from '../../services/auth.service';


export const RegisterView = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      alert("¡Registro exitoso! Ya puedes iniciar sesión.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrarse");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nombre Completo</label>
          <input {...register('fullName')} className={`w-full p-2 border rounded ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input type="password" {...register('password')} className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
};