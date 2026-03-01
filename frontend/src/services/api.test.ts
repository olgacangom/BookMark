import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';

describe('API Service', () => {
  beforeEach(() => {
    // Limpiamos los espías entre tests
    vi.restoreAllMocks();
  });

  it('debe añadir el token de Authorization si existe en localStorage', async () => {
    const mockToken = 'token-secreto-123';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);

    /**
     * Accedemos al interceptor de solicitud.
     * Cambiamos @ts-ignore por @ts-expect-error para cumplir con las reglas del linter.
     */
    // @ts-expect-error - Accediendo a handlers internos de axios para testing
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} } as any;
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('no debe añadir el header Authorization si el token no existe', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    /**
     * Cambiamos @ts-ignore por @ts-expect-error aquí también.
     */
    // @ts-expect-error - Accediendo a handlers internos de axios para testing
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} } as any;
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('debe tener configurada la baseURL correctamente', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.baseURL).toContain('http://localhost:3000');
  });
});