import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityService } from './activity.service';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('activityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFeed: debería retornar la lista de actividades', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1', type: 'POST' }] });
    const result = await activityService.getFeed();
    expect(api.get).toHaveBeenCalledWith('/activities/feed');
    expect(result).toHaveLength(1);
  });

  it('createActivity: debería enviar el payload y retornar la actividad', async () => {
    const payload = { content: 'Hola mundo' };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'a1', ...payload } });
    const result = await activityService.createActivity(payload);
    expect(api.post).toHaveBeenCalledWith('/activities', payload);
    expect(result.id).toBe('a1');
  });

  it('updateActivity: debería realizar un patch con los datos actualizados', async () => {
    const payload = { content: 'Contenido actualizado' };
    vi.mocked(api.patch).mockResolvedValue({ data: { id: 'a1', ...payload } });
    await activityService.updateActivity('a1', payload);
    expect(api.patch).toHaveBeenCalledWith('/activities/a1', payload);
  });

  it('toggleLike: debería alternar el like y retornar estado', async () => {
    const mockRes = { liked: true, count: 10 };
    vi.mocked(api.post).mockResolvedValue({ data: mockRes });
    const result = await activityService.toggleLike('a1');
    expect(api.post).toHaveBeenCalledWith('/activities/a1/like');
    expect(result).toEqual(mockRes);
  });

  it('addComment: debería enviar el texto del comentario', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
    await activityService.addComment('a1', 'Buen post');
    expect(api.post).toHaveBeenCalledWith('/activities/a1/comments', { text: 'Buen post' });
  });

  it('votePoll: debería enviar el índice de la opción votada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'a1' } });
    await activityService.votePoll('a1', 2);
    expect(api.post).toHaveBeenCalledWith('/activities/a1/vote', { optionIndex: 2 });
  });

  it('deleteActivity: debería eliminar la actividad', async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await activityService.deleteActivity('a1');
    expect(api.delete).toHaveBeenCalledWith('/activities/a1');
  });

  it('ignoreActivity: debería llamar al endpoint de ignorar', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await activityService.ignoreActivity('a1');
    expect(api.post).toHaveBeenCalledWith('/activities/a1/ignore');
  });
});