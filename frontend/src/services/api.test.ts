import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe añadir el token de Authorization si existe en localStorage', async () => {
    const mockToken = 'token-secreto';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);

    // @ts-ignore
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} } as any; 
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('no debe añadir el header Authorization si el token no existe', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    // @ts-ignore
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const config = { headers: {} } as any; 
    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});