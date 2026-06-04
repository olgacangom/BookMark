import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authService } from './auth.service';

vi.mock('axios');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un usuario correctamente', async () => {
      const mockData = {
        fullName: 'Juan Test',
        email: 'test@test.com',
        password: 'password123'
      };

      const mockResponse = { data: { id: '1', email: 'test@test.com' } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.register(mockData);

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), mockData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('login', () => {
    it('debe iniciar sesión y devolver un token', async () => {
      const mockData = { email: 'test@test.com', password: 'password123' };
      const mockResponse = { data: { access_token: 'fake-jwt-token' } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.login(mockData);

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('debe lanzar un error si las credenciales son incorrectas', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.login({ email: 'x', password: 'y' }))
        .rejects.toThrow('Unauthorized');
    });
  });
});