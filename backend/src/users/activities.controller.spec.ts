import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: MockType<ActivitiesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: {
            getFeed: jest.fn().mockImplementation(() => Promise.resolve([])),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get(ActivitiesService);
  });

  it('getFeed debe llamar al servicio con el id de la request', async () => {
    const mockReq = {
      user: {
        id: 'user-1',
        email: 'olgui@test.com',
      },
    } as unknown as RequestWithUser;

    const result = await controller.getFeed(mockReq);

    expect(result).toEqual([]);
    expect(service.getFeed).toHaveBeenCalledWith('user-1');
    expect(service.getFeed).toHaveBeenCalledTimes(1);
  });
});
