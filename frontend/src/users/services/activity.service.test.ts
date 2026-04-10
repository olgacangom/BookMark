import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../../services/api';
import { activityService, ActivityType, Activity } from './activity.service';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('activityService', () => {
  
  const mockFeedResponse: Activity[] = [
    {
      id: 'activity-1',
      type: ActivityType.BOOK_ADDED,
      createdAt: '2026-04-06T10:00:00Z',
      user: {
        fullName: 'Olga Test',
        email: 'olga@test.com',
        avatarUrl: 'https://avatar.com/1.jpg'
      },
      targetBook: {
        id: 1,
        title: 'Libro de Prueba',
        authors: ['Autor A'],
        thumbnail: 'https://book.com/1.jpg'
      }
    },
    {
      id: 'activity-2',
      type: ActivityType.FOLLOW,
      createdAt: '2026-04-06T11:00:00Z',
      user: {
        fullName: 'Juan Pérez',
        email: 'juan@test.com'
      },
      targetUser: {
        fullName: 'Maria Garcia'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFeed: debe llamar a la URL correcta y devolver los datos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockFeedResponse });

    const result = await activityService.getFeed();

    expect(api.get).toHaveBeenCalledWith('/activities/feed');
    
    expect(result).toEqual(mockFeedResponse);
    expect(result.length).toBe(2);
    expect(result[0].type).toBe(ActivityType.BOOK_ADDED);
  });

  it('getFeed: debe propagar el error si la petición falla', async () => {
    const mockError = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(mockError);

    await expect(activityService.getFeed()).rejects.toThrow('Network Error');
  });

  it('ActivityType: debe tener los valores correctos definidos en el enum', () => {
    expect(ActivityType.FOLLOW).toBe('FOLLOW');
    expect(ActivityType.BOOK_ADDED).toBe('BOOK_ADDED');
    expect(ActivityType.BOOK_FINISHED).toBe('BOOK_FINISHED');
  });
});