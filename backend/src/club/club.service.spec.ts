import { Test, TestingModule } from '@nestjs/testing';
import { ClubsService } from './club.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { Thread } from './entities/thread.entity';
import { ThreadPost } from './entities/thread-post.entity';
import { User } from '../users/entities/user.entity';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

type MockRepo = {
  findOne?: jest.Mock<any>;
  findOneBy?: jest.Mock<any>;
  find?: jest.Mock<any>;
  create?: jest.Mock<any>;
  save?: jest.Mock<any>;
  remove?: jest.Mock<any>;
};

const repoFactory = (): MockRepo => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('ClubsService', () => {
  let service: ClubsService;
  let clubRepo: MockRepo;
  let threadRepo: MockRepo;
  let postRepo: MockRepo;
  let userRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubsService,
        { provide: getRepositoryToken(Club), useValue: repoFactory() },
        { provide: getRepositoryToken(Thread), useValue: repoFactory() },
        { provide: getRepositoryToken(ThreadPost), useValue: repoFactory() },
        { provide: getRepositoryToken(User), useValue: repoFactory() },
      ],
    }).compile();

    service = module.get<ClubsService>(ClubsService);
    clubRepo = module.get(getRepositoryToken(Club));
    threadRepo = module.get(getRepositoryToken(Thread));
    postRepo = module.get(getRepositoryToken(ThreadPost));
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  describe('createClub', () => {
    it('should create and save club when creator exists', async () => {
      const creator = { id: 'user-1' };
      userRepo.findOneBy!.mockResolvedValue(creator);
      clubRepo.create!.mockReturnValue({
        name: 'Club',
        creator,
        members: [creator],
      });
      clubRepo.save!.mockResolvedValue({ id: 'club1', name: 'Club' });

      const result = await service.createClub('user-1', {
        name: 'Club',
        description: 'Desc',
      });

      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
      expect(clubRepo.create).toHaveBeenCalled();
      expect(clubRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'club1', name: 'Club' });
    });

    it('should throw if creator does not exist', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);
      await expect(
        service.createClub('user-1', { name: 'Club', description: 'Desc' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateClub', () => {
    it('should update club when user is creator', async () => {
      const club = {
        id: 'club1',
        creator: { id: 'user-1' },
        name: 'Old',
        description: 'Old',
        coverUrl: null,
      };
      clubRepo.findOne!.mockResolvedValue(club);
      clubRepo.save!.mockResolvedValue({
        ...club,
        name: 'New',
        description: 'New',
      });

      const result = await service.updateClub('user-1', 'club1', {
        name: 'New',
        description: 'New',
      });

      expect(result.name).toBe('New');
      expect(clubRepo.save).toHaveBeenCalled();
    });

    it('should throw if club not found', async () => {
      clubRepo.findOne!.mockResolvedValue(null);
      await expect(
        service.updateClub('user-1', 'club1', {
          name: 'New',
          description: 'New',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not creator', async () => {
      clubRepo.findOne!.mockResolvedValue({ creator: { id: 'user-2' } });
      await expect(
        service.updateClub('user-1', 'club1', {
          name: 'New',
          description: 'New',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOneClub', () => {
    it('returns club when found', async () => {
      clubRepo.findOne!.mockResolvedValue({ id: 'club1' });
      const result = await service.findOneClub('club1');
      expect(result).toEqual({ id: 'club1' });
    });

    it('throws if club not found', async () => {
      clubRepo.findOne!.mockResolvedValue(null);
      await expect(service.findOneClub('club1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('joinClub', () => {
    it('returns club when already member', async () => {
      const club = { members: [{ id: 'user-1' }] };
      clubRepo.findOne!.mockResolvedValue(club);
      userRepo.findOneBy!.mockResolvedValue({ id: 'user-1' });

      const result = await service.joinClub('user-1', 'club1');
      expect(result).toBe(club);
      expect(clubRepo.save).not.toHaveBeenCalled();
    });

    it('adds user to members and saves', async () => {
      const club = { members: [] };
      clubRepo.findOne!.mockResolvedValue(club);
      userRepo.findOneBy!.mockResolvedValue({ id: 'user-1' });
      clubRepo.save!.mockResolvedValue({
        id: 'club1',
        members: [{ id: 'user-1' }],
      });

      const result = await service.joinClub('user-1', 'club1');
      expect(clubRepo.save).toHaveBeenCalled();
      expect(result.members).toEqual([{ id: 'user-1' }]);
    });

    it('throws when club or user missing', async () => {
      clubRepo.findOne!.mockResolvedValue(null);
      userRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.joinClub('user-1', 'club1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createThread', () => {
    it('creates thread when club exists', async () => {
      clubRepo.findOneBy!.mockResolvedValue({ id: 'club1' });
      threadRepo.create!.mockReturnValue({
        title: 'Thread',
        club: { id: 'club1' },
      });
      threadRepo.save!.mockResolvedValue({ id: 'thread1' });

      const result = await service.createThread('club1', { title: 'Thread' });
      expect(result).toEqual({ id: 'thread1' });
    });

    it('throws if club not found', async () => {
      clubRepo.findOneBy!.mockResolvedValue(null);
      await expect(
        service.createThread('club1', { title: 'Thread' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPost', () => {
    it('creates post when thread and author exist', async () => {
      threadRepo.findOneBy!.mockResolvedValue({ id: 'thread1' });
      userRepo.findOneBy!.mockResolvedValue({ id: 'user-1' });
      postRepo.create!.mockReturnValue({ content: 'hi' });
      postRepo.save!.mockResolvedValue({ id: 'post1' });

      const result = await service.createPost('user-1', 'thread1', {
        content: 'hi',
        spoilerPage: 2,
      });
      expect(result).toEqual({ id: 'post1' });
    });

    it('throws when thread missing', async () => {
      threadRepo.findOneBy!.mockResolvedValue(null);
      userRepo.findOneBy!.mockResolvedValue({ id: 'user-1' });
      await expect(
        service.createPost('user-1', 'thread1', {
          content: 'hi',
          spoilerPage: 2,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when user missing', async () => {
      threadRepo.findOneBy!.mockResolvedValue({ id: 'thread1' });
      userRepo.findOneBy!.mockResolvedValue(null);
      await expect(
        service.createPost('user-1', 'thread1', {
          content: 'hi',
          spoilerPage: 2,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getThreadContent', () => {
    it('returns posts from repo', async () => {
      postRepo.find!.mockResolvedValue([{ id: 'post1' }]);
      const result = await service.getThreadContent('thread1');
      expect(result).toEqual([{ id: 'post1' }]);
    });
  });

  describe('deleteClub', () => {
    it('removes club when creator matches', async () => {
      const club = { creator: { id: 'user-1' } };
      clubRepo.findOne!.mockResolvedValue(club);
      clubRepo.remove!.mockResolvedValue({ id: 'club1' });
      const result = await service.deleteClub('user-1', 'club1');
      expect(clubRepo.remove).toHaveBeenCalledWith(club);
      expect(result).toEqual({ id: 'club1' });
    });

    it('throws if club not found', async () => {
      clubRepo.findOne!.mockResolvedValue(null);
      await expect(service.deleteClub('user-1', 'club1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if user is not creator', async () => {
      clubRepo.findOne!.mockResolvedValue({ creator: { id: 'user-2' } });
      await expect(service.deleteClub('user-1', 'club1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAllClubs', () => {
    it('returns all clubs with relations', async () => {
      const clubs = [{ id: 'club1' }, { id: 'club2' }];
      clubRepo.find!.mockResolvedValue(clubs);

      const result = await service.findAllClubs();

      expect(clubRepo.find).toHaveBeenCalledWith({
        relations: ['creator', 'members'],
      });
      expect(result).toEqual(clubs);
    });
  });

  describe('findOneThread', () => {
    it('returns thread with relatedBook relation', async () => {
      const thread = { id: 'thread1', relatedBook: { id: 1 } };
      threadRepo.findOne!.mockResolvedValue(thread);

      const result = await service.findOneThread('thread1');

      expect(threadRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'thread1' },
        relations: ['relatedBook'],
      });
      expect(result).toEqual(thread);
    });
  });

  describe('findThreadsByClub', () => {
    it('returns threads for a specific club', async () => {
      const threads = [{ id: 'thread1' }];
      threadRepo.find!.mockResolvedValue(threads);

      const result = await service.findThreadsByClub('club1');

      expect(threadRepo.find).toHaveBeenCalledWith({
        where: { club: { id: 'club1' } },
        relations: ['relatedBook'],
      });
      expect(result).toEqual(threads);
    });
  });
});
