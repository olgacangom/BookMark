import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { ActivityLike } from './entities/activity-like.entity';
import { ActivityComment } from './entities/activity-comment';
import { ActivityIgnore } from './entities/activity-ignore.entity';
import { PollVote } from './entities/poll-vote.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EntityManager } from 'typeorm';

type CreatePostDto = {
  content: string;
  pollOptions?: string[];
  bookId?: number;
};

type UpdateActivityDto = {
  content?: string;
  imageUrl?: string;
  bookId?: number;
  pollOptions?: string[];
};

type MockUser = Pick<User, 'id'>;

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  let activityRepo: any;
  let userRepo: any;
  let likesRepo: any;
  let commentsRepo: any;
  let ignoresRepo: any;
  let pollVoteRepo: any;

  const mockUser: MockUser = { id: 'me' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            manager: {
              transaction: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityLike),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityComment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityIgnore),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PollVote),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
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

  /* =========================================================
   * CREATE POST
   * ========================================================= */

  describe('createPost', () => {
    it('should create post', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);

      activityRepo.save.mockResolvedValue({ id: 'a1' });

      activityRepo.findOne.mockResolvedValue({
        id: 'a1',
        user: mockUser,
        targetBook: { id: 12 },
      });

      const dto: CreatePostDto = {
        content: 'hi',
        pollOptions: ['yes', 'no'],
        bookId: 12,
      };

      const result = await service.createPost('me', dto);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'a1',
        }),
      );
    });

    it('should throw if user does not exist', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.createPost('me', { content: 'hi' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* =========================================================
   * UPDATE
   * ========================================================= */

  describe('update', () => {
    it('should update activity', async () => {
      const activity = {
        id: 'act-1',
        user: { id: 'me' },
        poll: { options: [{ text: 'yes', votes: 0 }] },
        targetBook: null,
      };

      activityRepo.findOne.mockResolvedValueOnce(activity);

      activityRepo.save.mockResolvedValue(undefined);

      activityRepo.findOne.mockResolvedValueOnce({
        id: 'act-1',
        content: 'updated',
      });

      const dto: UpdateActivityDto = {
        content: 'updated',
      };

      const result = await service.update('me', 'act-1', dto);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('act-1');
    });

    it('should throw not found / forbidden', async () => {
      activityRepo.findOne.mockResolvedValue(null);

      await expect(service.update('me', 'act-1', {})).rejects.toThrow(
        NotFoundException,
      );

      activityRepo.findOne.mockResolvedValue({ user: { id: 'other' } });

      await expect(service.update('me', 'act-1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  /* =========================================================
   * REMOVE
   * ========================================================= */

  describe('remove', () => {
    it('should remove activity', async () => {
      activityRepo.findOne.mockResolvedValue({ user: { id: 'me' } });
      activityRepo.remove.mockResolvedValue(undefined);

      const result = await service.remove('me', 'act-1');

      expect(result).toEqual({ success: true });
    });
  });

  /* =========================================================
   * FEED
   * ========================================================= */

  describe('getFeed', () => {
    it('should return feed', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'me',
        followingRelations: [],
      });

      ignoresRepo.find.mockResolvedValue([]);
      activityRepo.find.mockResolvedValue([]);
      likesRepo.find.mockResolvedValue([]);
      pollVoteRepo.find.mockResolvedValue([]);

      const result = await service.getFeed('me');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  /* =========================================================
   * LIKE
   * ========================================================= */

  describe('toggleLike', () => {
    it('should like', async () => {
      activityRepo.findOne.mockResolvedValue({ id: 'a1', likesCount: 0 });

      likesRepo.findOne.mockResolvedValue(null);
      likesRepo.create.mockReturnValue({});
      likesRepo.save.mockResolvedValue({});
      activityRepo.save.mockResolvedValue({});

      const result = await service.toggleLike('me', 'a1');

      expect(result.liked).toBe(true);
    });
  });

  /* =========================================================
   * COMMENT
   * ========================================================= */

  describe('addComment', () => {
    it('should add comment', async () => {
      commentsRepo.create.mockReturnValue({ text: 'hi' });
      commentsRepo.save.mockResolvedValue({ id: 'c1' });

      activityRepo.findOneBy.mockResolvedValue({ id: 'a1' });
      activityRepo.save.mockResolvedValue({});

      commentsRepo.findOne.mockResolvedValue({
        id: 'c1',
        text: 'hi',
        user: { id: 'me' },
      });

      const result = await service.addComment('me', 'a1', 'hi');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('c1');
    });
  });

  /* =========================================================
   * IGNORE
   * ========================================================= */

  describe('ignoreActivity', () => {
    it('should ignore once', async () => {
      ignoresRepo.findOne.mockResolvedValue({ id: 'ignore-1' });

      const result = await service.ignoreActivity('me', 'a1');

      expect(result).toBeUndefined();
    });
  });

  /* =========================================================
   * POLL
   * ========================================================= */

  describe('votePoll', () => {
    it('should vote transactionally', async () => {
      pollVoteRepo.findOne.mockResolvedValue(null);

      activityRepo.findOne.mockResolvedValue({
        id: 'a1',
        poll: {
          options: [
            { text: 'yes', votes: 0 },
            { text: 'no', votes: 0 },
          ],
        },
      });

      const manager = {
        save: jest.fn(),
      } as unknown as EntityManager;

      activityRepo.manager.transaction.mockImplementation((fn: any) =>
        fn(manager),
      );

      pollVoteRepo.create.mockReturnValue({});

      await service.votePoll('a1', 'me', 1);

      expect(manager.save).toHaveBeenCalled();
    });
  });

  it('should enrich feed with likes and votes', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'me',
      followingRelations: [{ status: 'ACCEPTED', following: { id: 'f1' } }],
    });

    ignoresRepo.find.mockResolvedValue([{ activity: { id: 'x' } }]);

    activityRepo.find.mockResolvedValue([
      {
        id: 'a1',
        user: { id: 'f1' },
        likesCount: 1,
        commentsCount: 2,
        comments: [],
      },
    ]);

    likesRepo.find.mockResolvedValue([{ activity: { id: 'a1' } }]);
    pollVoteRepo.find.mockResolvedValue([{ activity: { id: 'a1' } }]);

    const result = await service.getFeed('me');

    expect(result[0]).toEqual(
      expect.objectContaining({
        isLiked: true,
        hasVoted: true,
      }),
    );
  });

  it('should throw when remove not found', async () => {
    activityRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('me', 'x')).rejects.toThrow(NotFoundException);
  });

  it('should unlike when already liked', async () => {
    activityRepo.findOne.mockResolvedValue({ id: 'a1', likesCount: 1 });

    likesRepo.findOne.mockResolvedValue({ id: 'like1' });

    likesRepo.remove.mockResolvedValue({});

    activityRepo.save.mockResolvedValue({});

    const result = await service.toggleLike('me', 'a1');

    expect(result).toEqual({
      liked: false,
      count: 0,
    });
  });

  it('should throw when adding comment to missing activity', async () => {
    activityRepo.findOneBy.mockResolvedValue(null);

    await expect(service.addComment('me', 'a1', 'hi')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create ignore when missing', async () => {
    ignoresRepo.findOne.mockResolvedValue(null);
    ignoresRepo.create.mockReturnValue({});
    ignoresRepo.save.mockResolvedValue({});

    await service.ignoreActivity('me', 'a1');

    expect(ignoresRepo.save).toHaveBeenCalled();
  });

  it('should return early if vote exists', async () => {
    pollVoteRepo.findOne.mockResolvedValue({ id: 'v1' });

    activityRepo.findOne.mockResolvedValue({ id: 'a1' });

    const result = await service.votePoll('a1', 'me', 1);

    expect(result).toEqual({ id: 'a1' });
  });

  it('should remove activity successfully', async () => {
    activityRepo.findOne.mockResolvedValue({ user: { id: 'me' } });
    activityRepo.remove.mockResolvedValue(undefined);

    const result = await service.remove('me', 'act-1');

    expect(result).toEqual({ success: true });
    expect(activityRepo.remove).toHaveBeenCalled();
  });

  it('should throw ForbiddenException when deleting foreign post', async () => {
    activityRepo.findOne.mockResolvedValue({
      id: 'a1',
      user: { id: 'other-user' },
    });

    await expect(service.remove('me', 'a1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw NotFoundException when user does not exist in create()', async () => {
    userRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.create('me', ActivityType.POST, '123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when poll is invalid', async () => {
    pollVoteRepo.findOne.mockResolvedValue(null);

    activityRepo.findOne.mockResolvedValue({
      id: 'a1',
      poll: null,
    });

    await expect(service.votePoll('a1', 'me', 1)).rejects.toThrow(
      'Encuesta no válida',
    );
  });
});
