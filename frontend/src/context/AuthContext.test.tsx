import { render, screen, renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

describe('AuthContext & ProtectedRoute Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe iniciar sesión con y sin datos de usuario', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('token-1', { name: 'Olga' });
    });
    expect(result.current.user).toEqual({ name: 'Olga' });

    act(() => {
      result.current.login('token-2');
    });
    expect(result.current.token).toBe('token-2');
  });

  it('debe ejecutar el logout correctamente', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { result.current.login('token'); });
    act(() => { result.current.logout(); });

    expect(result.current.token).toBe(null);
  });

  it('debe lanzar un error si useAuth se usa fuera del Provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de un AuthProvider');

    consoleSpy.mockRestore();
  });

  it('debe permitir acceso a rutas protegidas si hay token', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'token') return 'token-valido';
      if (key === 'user') return JSON.stringify({ id: '1', fullName: 'Olga' });
      return null;
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/privado']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/privado" element={<div>Zona Segura</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Zona Segura/i)).toBeInTheDocument();
  });

  it('debe actualizar los datos del usuario correctamente', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    const updatedData = { id: '1', fullName: 'Olga Editado' };

    act(() => {
      result.current.updateUser(updatedData);
    });

    expect(result.current.user).toEqual(updatedData);
    expect(localStorage.getItem('user')).toContain('Olga Editado');
  });

  it('debe detectar un token inválido', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    const invalidToken = 'test@test.com'; 

    act(() => {
      result.current.login(invalidToken);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("TOKEN INVÁLIDO"),
      invalidToken
    );

    consoleSpy.mockRestore();
  });

  it('debe extraer el token correctamente cuando se pasa un objeto', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ access_token: 'token-formato-a' });
    });
    expect(result.current.token).toBe('token-formato-a');

    act(() => {
      result.current.login({ token: 'token-formato-b' });
    });
    expect(result.current.token).toBe('token-formato-b');
  });
});