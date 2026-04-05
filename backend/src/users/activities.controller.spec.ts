/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: { getFeed: jest.fn().mockResolvedValue([]) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Quitamos _context para evitar unused
      .compile();

    controller = module.get(ActivitiesController);
    service = module.get(ActivitiesService);
  });

  it('getFeed debe llamar al servicio con el id de la request', async () => {
    const mockReq = { user: { id: 'user-1' } };
    await controller.getFeed(mockReq as unknown as any);

    const spy = service.getFeed;
    expect(spy).toHaveBeenCalledWith('user-1');
  });
});
