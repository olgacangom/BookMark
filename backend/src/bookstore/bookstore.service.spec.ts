import { Test, TestingModule } from '@nestjs/testing';
import { BookstoreService } from './bookstore.service';
import axios from 'axios';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BookstoreService', () => {
  let service: BookstoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookstoreService],
    }).compile();

    service = module.get<BookstoreService>(BookstoreService);
    jest.clearAllMocks();
  });

  it('maps elements with lat/lon to NearbyBookstore', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        elements: [
          {
            id: 1,
            lat: 1.1,
            lon: 2.2,
            tags: {
              name: 'Libreria 1',
              'addr:street': 'Calle Falsa',
              'addr:housenumber': '123',
            },
          },
        ],
      },
    });

    const res = await service.findNearby(0, 0);

    expect(mockedAxios.get).toHaveBeenCalled();
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Libreria 1');
    expect(res[0].address).toBe('Calle Falsa 123');
    expect(res[0].latitude).toBe(1.1);
  });

  it('maps elements with center and missing tags to defaults', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        elements: [
          {
            id: 2,
            center: { lat: 3.3, lon: 4.4 },
            tags: {},
          },
        ],
      },
    });

    const res = await service.findNearby(0, 0);

    expect(res[0].name).toBe('Librería especializada');
    expect(res[0].address).toBe('Dirección disponible en local');
    expect(res[0].latitude).toBe(3.3);
  });

  it('returns empty array on axios error and logs error', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockedAxios.get.mockRejectedValue(new Error('Network fail'));

    const res = await service.findNearby(0, 0);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res).toEqual([]);
    consoleSpy.mockRestore();
  });
});
