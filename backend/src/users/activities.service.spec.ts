/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ActivitiesService } from './activities.service';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { FollowStatus } from './entities/follow.entity';
import { NotFoundException } from '@nestjs/common';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityRepo: jest.Mocked<Repository<Activity>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUser = { id: 'me' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn(), findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ActivitiesService);
    activityRepo = module.get(getRepositoryToken(Activity));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('debe asignar targetUser si es FOLLOW', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      activityRepo.create.mockReturnValue({} as Activity);
      activityRepo.save.mockImplementation((a) =>
        Promise.resolve({ ...a, id: '1' } as unknown as Activity),
      );
      const res = await service.create('me', ActivityType.FOLLOW, 'target-u');
      expect(res.targetUser).toEqual({ id: 'target-u' });
    });

    it('debe asignar targetBook si es BOOK_ADDED', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      activityRepo.create.mockReturnValue({} as Activity);
      activityRepo.save.mockImplementation((a) =>
        Promise.resolve({ ...a, id: '1' } as unknown as Activity),
      );
      const res = await service.create('me', ActivityType.BOOK_ADDED, '50');
      expect(res.targetBook).toEqual({ id: 50 });
    });

    it('error si usuario no existe', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create('1', ActivityType.FOLLOW)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFeed', () => {
    it('debe filtrar seguidos y añadir id propio', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'me',
        followingRelations: [
          { status: FollowStatus.ACCEPTED, following: { id: 'f1' } },
        ],
      } as User);
      await service.getFeed('me');
      const spy = activityRepo.find;
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { id: In(['f1', 'me']) } },
        }),
      );
    });
  });
});
