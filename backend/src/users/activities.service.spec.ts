/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ActivitiesService } from './activities.service';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { FollowStatus } from './entities/follow.entity';
import { ActivityLike } from './entities/activity-like.entity';
import { ActivityComment } from './entities/activity-comment';
import { ActivityIgnore } from './entities/activity-ignore.entity';
import { PollVote } from './entities/poll-vote.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityRepo: any;
  let userRepo: any;
  let likesRepo: any;
  let commentsRepo: any;
  let ignoresRepo: any;
  let pollVoteRepo: any;

  const mockUser = { id: 'me' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            create: (jest.fn() as any),
            save: (jest.fn() as any),
            findOne: (jest.fn() as any),
            findOneBy: (jest.fn() as any),
            find: (jest.fn() as any),
            remove: (jest.fn() as any),
            manager: { transaction: (jest.fn() as any) },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: (jest.fn() as any),
            findOne: (jest.fn() as any),
          },
        },
        {
          provide: getRepositoryToken(ActivityLike),
          useValue: {
            findOne: (jest.fn() as any),
            create: (jest.fn() as any),
            save: (jest.fn() as any),
            remove: (jest.fn() as any),
            find: (jest.fn() as any),
          },
        },
        {
          provide: getRepositoryToken(ActivityComment),
          useValue: {
            create: (jest.fn() as any),
            save: (jest.fn() as any),
            findOne: (jest.fn() as any),
          },
        },
        {
          provide: getRepositoryToken(ActivityIgnore),
          useValue: {
            findOne: (jest.fn() as any),
            create: (jest.fn() as any),
            save: (jest.fn() as any),
            find: (jest.fn() as any),
          },
        },
        {
          provide: getRepositoryToken(PollVote),
          useValue: {
            findOne: (jest.fn() as any),
            create: (jest.fn() as any),
            save: (jest.fn() as any),
            find: (jest.fn() as any),
          },
        },
      ],
    }).compile();

    service = module.get(ActivitiesService);
    activityRepo = module.get(getRepositoryToken(Activity));
    userRepo = module.get(getRepositoryToken(User));
    likesRepo = module.get(getRepositoryToken(ActivityLike));
    commentsRepo = module.get(getRepositoryToken(ActivityComment));
    ignoresRepo = module.get(getRepositoryToken(ActivityIgnore));
    pollVoteRepo = module.get(getRepositoryToken(PollVote));
  });

  describe('createPost', () => {
    it('should create a post with poll and book relation', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      activityRepo.save.mockResolvedValue({ id: 'a1' });
      activityRepo.findOne.mockResolvedValue({ id: 'a1', user: mockUser, targetBook: { id: 12 } });

      const result = await service.createPost('me', {
        content: 'hi',
        pollOptions: ['yes', 'no'],
        bookId: 12,
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'a1',
          isLiked: false,
          comments: [],
        }),
      );
      expect(activityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ type: ActivityType.POST }));
    });

    it('should throw if user does not exist', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.createPost('me', { content: 'hi' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update content, image and book relation', async () => {
      const activity = {
        id: 'act-1',
        user: { id: 'me' },
        poll: { options: [{ text: 'yes', votes: 0 }] },
        targetBook: null,
      } as any;
      activityRepo.findOne.mockResolvedValueOnce(activity).mockResolvedValueOnce({
        id: 'act-1',
        content: 'updated',
        imageUrl: 'url',
        poll: null,
        targetBook: { id: 55 },
      });
      activityRepo.save.mockResolvedValue({});

      const result = await service.update('me', 'act-1', {
        content: 'updated',
        imageUrl: 'url',
        bookId: 55,
      } as any);

      expect(result).toEqual(expect.objectContaining({ id: 'act-1', targetBook: { id: 55 } }));
    });

    it('should throw when activity not found or not owned', async () => {
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.update('me', 'act-1', {} as any)).rejects.toThrow(NotFoundException);

      activityRepo.findOne.mockResolvedValue({ user: { id: 'other' } });
      await expect(service.update('me', 'act-1', {} as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove own activity', async () => {
      activityRepo.findOne.mockResolvedValue({ user: { id: 'me' } });
      activityRepo.remove.mockResolvedValue(undefined);
      const result = await service.remove('me', 'act-1');
      expect(result).toEqual({ success: true });
    });

    it('should throw when activity does not exist or is owned by another user', async () => {
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('me', 'act-1')).rejects.toThrow(NotFoundException);

      activityRepo.findOne.mockResolvedValue({ user: { id: 'other' } });
      await expect(service.remove('me', 'act-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getFeed', () => {
    it('should exclude ignored activities and mark liked/voted state', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'me',
        followingRelations: [{ status: FollowStatus.ACCEPTED, following: { id: 'f1' } }],
      });
      ignoresRepo.find.mockResolvedValue([{ activity: { id: 'ignored' } }]);
      activityRepo.find.mockResolvedValue([
        {
          id: 'a1',
          user: { id: 'f1' },
          likesCount: 2,
          commentsCount: 1,
          comments: [{ id: 'c1', createdAt: new Date(1) }, { id: 'c2', createdAt: new Date(2) }],
        },
      ]);
      likesRepo.find.mockResolvedValue([{ activity: { id: 'a1' } }]);
      pollVoteRepo.find.mockResolvedValue([{ activity: { id: 'a1' } }]);

      const result = await service.getFeed('me');

      expect(activityRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { id: In(['f1', 'me']) }, id: Not(In(['ignored'])) },
        }),
      );
      expect(result[0]).toMatchObject({ isLiked: true, hasVoted: true, commentsCount: 1 });
    });
  });

  describe('toggleLike', () => {
    it('should add like when none exists', async () => {
      activityRepo.findOne.mockResolvedValue({ id: 'a1', likesCount: 0 });
      likesRepo.findOne.mockResolvedValue(null);
      likesRepo.create.mockReturnValue({});
      likesRepo.save.mockResolvedValue({});
      activityRepo.save.mockResolvedValue({});

      const result = await service.toggleLike('me', 'a1');
      expect(result).toEqual({ liked: true, count: 1 });
    });

    it('should remove existing like', async () => {
      activityRepo.findOne.mockResolvedValue({ id: 'a1', likesCount: 1 });
      likesRepo.findOne.mockResolvedValue({ id: 'like-1' });
      likesRepo.remove.mockResolvedValue({});
      activityRepo.save.mockResolvedValue({});

      const result = await service.toggleLike('me', 'a1');
      expect(result).toEqual({ liked: false, count: 0 });
    });

    it('should throw when activity does not exist', async () => {
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleLike('me', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should save a comment and return with user relation', async () => {
      commentsRepo.create.mockReturnValue({ text: 'hi' });
      commentsRepo.save.mockResolvedValue({ id: 'c1' });
      activityRepo.findOneBy.mockResolvedValue({ id: 'a1', commentsCount: 0 });
      activityRepo.save.mockResolvedValue({});
      commentsRepo.findOne.mockResolvedValue({ id: 'c1', text: 'hi', user: { id: 'me' } });

      const result = await service.addComment('me', 'a1', 'hi');
      expect(result).toEqual({ id: 'c1', text: 'hi', user: { id: 'me' } });
    });

    it('should throw when activity not found', async () => {
      activityRepo.findOneBy.mockResolvedValue(null);
      await expect(service.addComment('me', 'a1', 'hi')).rejects.toThrow(NotFoundException);
    });
  });

  describe('ignoreActivity', () => {
    it('should return immediately if already ignored', async () => {
      ignoresRepo.findOne.mockResolvedValue({ id: 'ignore-1' });
      const result = await service.ignoreActivity('me', 'a1');
      expect(result).toBeUndefined();
      expect(ignoresRepo.save).not.toHaveBeenCalled();
    });

    it('should create ignore when missing', async () => {
      ignoresRepo.findOne.mockResolvedValue(null);
      ignoresRepo.create.mockReturnValue({});
      ignoresRepo.save.mockResolvedValue({});
      await service.ignoreActivity('me', 'a1');
      expect(ignoresRepo.save).toHaveBeenCalled();
    });
  });

  describe('votePoll', () => {
    it('should return activity when vote already exists', async () => {
      pollVoteRepo.findOne.mockResolvedValue({ id: 'vote-1' });
      activityRepo.findOne.mockResolvedValue({ id: 'a1' });

      const result = await service.votePoll('a1', 'me', 0);
      expect(result).toEqual({ id: 'a1' });
    });

    it('should throw when activity is missing', async () => {
      pollVoteRepo.findOne.mockResolvedValue(null);
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.votePoll('a1', 'me', 0)).rejects.toThrow(NotFoundException);
    });

    it('should throw when poll is invalid', async () => {
      pollVoteRepo.findOne.mockResolvedValue(null);
      activityRepo.findOne.mockResolvedValue({ id: 'a1', poll: null } as any);
      await expect(service.votePoll('a1', 'me', 0)).rejects.toThrow(NotFoundException);
    });

    it('should cast a vote and update the poll transactionally', async () => {
      pollVoteRepo.findOne.mockResolvedValue(null);
      const activity = {
        id: 'a1',
        poll: { options: [{ text: 'yes', votes: 0 }, { text: 'no', votes: 0 }] },
      } as any;
      activityRepo.findOne.mockResolvedValue(activity);
      const manager = { save: (jest.fn() as any).mockResolvedValue({}) };
      activityRepo.manager.transaction.mockImplementation(async (fn) => fn(manager));
      pollVoteRepo.create.mockReturnValue({});

      const result = await service.votePoll('a1', 'me', 1);

      expect(manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('create (system activities)', () => {
    it('should create a system activity (e.g., BOOK_ADDED)', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      activityRepo.save.mockResolvedValue({ id: 'sys-1', type: 'BOOK_ADDED' });

      const result = await service.create('me', ActivityType.BOOK_ADDED, '101');

      expect(activityRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ActivityType.BOOK_ADDED,
          targetBook: { id: 101 },
        }),
      );
      expect(result.id).toBe('sys-1');
    });

    it('should create a FOLLOW activity', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      activityRepo.save.mockResolvedValue({ id: 'sys-2', type: 'FOLLOW' });

      await service.create('me', ActivityType.FOLLOW, 'other-user');

      expect(activityRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ActivityType.FOLLOW,
          targetUser: { id: 'other-user' },
        }),
      );
    });

    it('should throw NotFound if user does not exist in create', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create('me', ActivityType.BOOK_ADDED)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update (poll update)', () => {
    it('should update poll options correctly', async () => {
      const activity = {
        id: 'act-1',
        user: { id: 'me' },
        poll: { options: [{ text: 'old', votes: 5 }] },
      } as any;

      activityRepo.findOne.mockResolvedValue(activity);
      activityRepo.save.mockResolvedValue({});
      activityRepo.findOne.mockResolvedValueOnce(activity).mockResolvedValueOnce({ ...activity });

      await service.update('me', 'act-1', {
        pollOptions: ['new1', 'new2'],
      } as any);

      // Verificamos que se haya mapeado correctamente manteniendo votos si existían, o reseteando
      expect(activityRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          poll: {
            options: [
              { text: 'new1', votes: 5 }, // El índice 0 existía, mantiene votos (5)
              { text: 'new2', votes: 0 }, // El índice 1 no existía, inicia en 0
            ],
          },
        }),
      );
    });
  });
});
