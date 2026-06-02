import { render, screen, act, fireEvent, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  default: { post: vi.fn() }
}));

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{JSON.stringify(auth.user)}</span>
      <span data-testid="token">{auth.token}</span>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <button onClick={() => auth.login('fake-token', { name: 'Test User' })}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.updateUser({ name: 'Updated' })}>Update</button>
      <button onClick={() => auth.register('Name', 'email@test.com', 'pass', 'user')}>Register</button>
      <button onClick={() => auth.register('Name', 'email@test.com', 'pass', 'user', {
        libraryName: 'Biblioteca',
        libraryAddress: 'Calle 123',
        document: new Blob(['test'])
      })}>
        Trigger Register
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('debe inicializar el estado correctamente', async () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Saved User' }));

    render(<AuthProvider><TestComponent /></AuthProvider>);

    expect(screen.getByTestId('token').textContent).toBe('saved-token');
    expect(screen.getByTestId('user').textContent).toContain('Saved User');
  });

  it('debe manejar el login correctamente', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);

    act(() => { fireEvent.click(screen.getByText('Login')); });

    expect(screen.getByTestId('token').textContent).toBe('fake-token');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('debe manejar el logout correctamente', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);

    act(() => { fireEvent.click(screen.getByText('Login')); });
    act(() => { fireEvent.click(screen.getByText('Logout')); });

    expect(screen.getByTestId('token').textContent).toBe('');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('debe actualizar el usuario', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);

    act(() => { fireEvent.click(screen.getByText('Update')); });
    expect(screen.getByTestId('user').textContent).toContain('Updated');
  });

  it('debe llamar a la API al registrarse', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await act(async () => { fireEvent.click(screen.getByText('Register')); });
    expect(api.post).toHaveBeenCalledWith('/auth/register', expect.any(FormData), expect.anything());
  });

  it('debe lanzar error si se usa useAuth fuera de AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    expect(() => render(<TestComponent />)).toThrow('useAuth debe usarse dentro de un AuthProvider');
    consoleSpy.mockRestore();
  });

  it('debe añadir los campos extra al FormData en el registro si se proporcionan', async () => {
    const appendSpy = vi.spyOn(FormData.prototype, 'append');

    // Renderizamos el componente dentro del Provider
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Disparamos el registro haciendo click en el botón, 
    // esto asegura que estemos DENTRO del contexto de React
    const registerBtn = screen.getByText('Trigger Register');
    await act(async () => {
      fireEvent.click(registerBtn);
    });

    expect(appendSpy).toHaveBeenCalledWith('libraryName', 'Biblioteca');
    expect(appendSpy).toHaveBeenCalledWith('libraryAddress', 'Calle 123');

    appendSpy.mockRestore();
  });

  it('debe registrar un error en consola y relanzar el error al fallar el registro', async () => {
    const apiError = new Error('Network Error');
    vi.mocked(api.post).mockRejectedValueOnce(apiError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await expect(
      result.current.register('Name', 'email@test.com', 'pass', 'user')
    ).rejects.toThrow('Network Error');

    expect(consoleSpy).toHaveBeenCalledWith("Error en registro:", apiError);
    consoleSpy.mockRestore();
  });

  it('debe registrar un error en consola y no guardar el token si es inválido (contiene @)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const invalidToken = "user@example.com";
    act(() => {
      result.current.login(invalidToken);
    });

    expect(consoleSpy).toHaveBeenCalledWith("❌ TOKEN INVÁLIDO detectado:", invalidToken);

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();

    consoleSpy.mockRestore();
  });
});