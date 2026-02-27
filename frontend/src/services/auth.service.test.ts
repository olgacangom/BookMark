import { describe, it, expect, vi, Mocked } from 'vitest';
import axios from 'axios';
import { authService } from './auth.service';

// Simulamos axios para no hacer peticiones reales al backend
vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

describe('authService', () => {
  it('should call register API with correct data', async () => {
    const mockData = { fullName: 'Test', email: 't@t.com', password: 'password123' };
    mockedAxios.post.mockResolvedValue({ data: { id: '1', email: 't@t.com' } });

    const result = await authService.register(mockData);
    
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/register'), mockData);
    expect(result.email).toBe('t@t.com');
  });

  it('should call login API and return a token', async () => {
    const mockData = { email: 't@t.com', password: 'password123' };
    mockedAxios.post.mockResolvedValue({ data: { access_token: 'fake-token' } });

    const result = await authService.login(mockData);
    
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/login'), mockData);
    expect(result.access_token).toBe('fake-token');
  });
});