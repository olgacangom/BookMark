import { Test, TestingModule } from '@nestjs/testing';
import { BookstoreController } from './bookstore.controller';
import { BookstoreService } from './bookstore.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('BookstoreController', () => {
  let controller: BookstoreController;

  const mockService = {
    findNearby: jest.fn() as jest.MockedFunction<(
      lat: number,
      lon: number,
    ) => Promise<any[]>>,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookstoreController],
      providers: [
        {
          provide: BookstoreService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BookstoreController>(BookstoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getNearby should call service with numeric lat/lon and return value', async () => {
    mockService.findNearby.mockResolvedValue([{ id: 1 }]);

    const res = await controller.getNearby('10.5', '20.25');

    expect(mockService.findNearby).toHaveBeenCalledWith(10.5, 20.25);
    expect(res).toEqual([{ id: 1 }]);
  });
});
