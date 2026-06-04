import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile: debería obtener el perfil de un usuario por ID', async () => {
    const mockProfile = { id: 'u1', fullName: 'Juan Pérez', isPublic: true };
    vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

    const result = await userService.getProfile('u1');
    expect(api.get).toHaveBeenCalledWith('/users/profile/u1');
    expect(result).toEqual(mockProfile);
  });

  it('follow: debería realizar una petición POST para seguir', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await userService.follow('u2');
    expect(api.post).toHaveBeenCalledWith('/users/follow/u2');
  });

  it('unfollow: debería realizar una petición POST para dejar de seguir', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await userService.unfollow('u2');
    expect(api.post).toHaveBeenCalledWith('/users/unfollow/u2');
  });

  it('searchUsers: debería realizar una búsqueda con la query adecuada', async () => {
    const mockUsers = [{ id: 'u1', fullName: 'Juan', isPublic: true }];
    vi.mocked(api.get).mockResolvedValue({ data: mockUsers });

    const result = await userService.searchUsers('Juan');
    expect(api.get).toHaveBeenCalledWith('/users/search?q=Juan');
    expect(result).toEqual(mockUsers);
  });
});