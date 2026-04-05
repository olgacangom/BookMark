import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { userService } from './user.service';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('userService', () => {
  const mockUserId = '123-uuid';
  const mockUserProfile = {
    id: mockUserId,
    fullName: 'Olga Cantalejo',
    isPublic: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile: debe llamar a la URL correcta y devolver los datos', async () => {
    (api.get as any).mockResolvedValue({ data: mockUserProfile });

    const result = await userService.getProfile(mockUserId);

    expect(api.get).toHaveBeenCalledWith(`/users/profile/${mockUserId}`);
    expect(result).toEqual(mockUserProfile);
  });

  it('follow: debe realizar una petición POST a la URL de seguimiento', async () => {
    (api.post as any).mockResolvedValue({});

    await userService.follow(mockUserId);

    expect(api.post).toHaveBeenCalledWith(`/users/follow/${mockUserId}`);
  });

  it('unfollow: debe realizar una petición POST a la URL de dejar de seguir', async () => {
    (api.post as any).mockResolvedValue({});

    await userService.unfollow(mockUserId);

    expect(api.post).toHaveBeenCalledWith(`/users/unfollow/${mockUserId}`);
  });

  it('searchUsers: debe llamar a la URL con el query param y devolver un array', async () => {
    const query = 'olga';
    const mockUsersList = [mockUserProfile];
    (api.get as any).mockResolvedValue({ data: mockUsersList });

    const result = await userService.searchUsers(query);

    expect(api.get).toHaveBeenCalledWith(`/users/search?q=${query}`);
    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual(mockUsersList);
  });
});