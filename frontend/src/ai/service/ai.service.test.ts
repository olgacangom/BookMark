import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './ai.service';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería enviar el mensaje y devolver los datos de la API', async () => {
    const prompt = 'Hola, ¿cómo estás?';
    const history = [{ role: 'user', content: 'Hola' }];
    const mockApiResponse = { data: { reply: '¡Hola! Estoy muy bien.' } };

    vi.mocked(api.post).mockResolvedValue(mockApiResponse);

    const result = await aiService.sendMessage(prompt, history);

    expect(api.post).toHaveBeenCalledWith('/ai/chat', { prompt, history });
    expect(result).toEqual(mockApiResponse.data);
  });

  it('debería propagar el error si la API falla', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('API Error'));

    await expect(aiService.sendMessage('test', [])).rejects.toThrow('API Error');
  });
});