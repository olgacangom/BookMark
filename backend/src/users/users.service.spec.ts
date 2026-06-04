import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { ActivitiesService } from './activities.service';
import { User } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import { UserStats } from './entities/user-stats.entity';
import { Badge } from './badge.entity';
import { LibraryEvent } from './entities/library-event.entity';
import { Book } from 'src/books/entities/book.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RegisterDto } from 'src/auth/dto/register.dto';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: any;
  let followRepository: any;
  let userStatsRepository: any;
  let badgeRepository: any;
  let activitiesService: any;
  let eventRepository: any;
  let bookRepository: any;
  let registrationRepository: any;
  let configService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            preload: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: {
            createQueryBuilder: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserStats),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            findOneBy: jest.fn(),
            count: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: { create: jest.fn() },
        },
        {
          provide: getRepositoryToken(LibraryEvent),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Book),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(EventRegistration),
          useValue: { find: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);

    usersRepository = module.get(getRepositoryToken(User));
    followRepository = module.get(getRepositoryToken(Follow));
    userStatsRepository = module.get(getRepositoryToken(UserStats));
    badgeRepository = module.get(getRepositoryToken(Badge));
    activitiesService = module.get(ActivitiesService);
    eventRepository = module.get(getRepositoryToken(LibraryEvent));
    bookRepository = module.get(getRepositoryToken(Book));
    registrationRepository = module.get(getRepositoryToken(EventRegistration));
    configService = module.get(ConfigService);
  });

  /* ---------------- CREATE ---------------- */

  it('should throw when email already exists', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: '1' });

    await expect(
      service.create({ email: 'a', password: 'b' } as RegisterDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create user and stats', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.create.mockReturnValue({ email: 'a' });
    usersRepository.save.mockResolvedValue({ id: '1', email: 'a' });

    userStatsRepository.create.mockReturnValue({});
    userStatsRepository.save.mockResolvedValue({});

    const res = await service.create({
      email: 'a',
      password: 'b',
    } as RegisterDto);

    expect(usersRepository.save).toHaveBeenCalled();
    expect(userStatsRepository.save).toHaveBeenCalled();
    expect(res).toEqual({ id: '1', email: 'a' });
  });

  /* ---------------- FIND ---------------- */

  it('findOne throws if not found', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('findOneProfile throws Forbidden when private', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'u2',
      isPublic: false,
      followerRelations: [],
    });

    await expect(service.findOneProfile('u2', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('findOneProfile returns data', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'u1',
      isPublic: true,
      followerRelations: [],
      password: 'x',
    });

    eventRepository.find.mockResolvedValue([]);
    bookRepository.find.mockResolvedValue([]);
    registrationRepository.find.mockResolvedValue([]);

    usersRepository.findOne.mockResolvedValueOnce({
      id: 'u1',
      isPublic: true,
      followerRelations: [],
      password: 'x',
    });

    usersRepository.findOne.mockResolvedValueOnce({ clubs: [] });

    const res = await service.findOneProfile('u1', 'u1');

    expect(res).toHaveProperty('books');
  });

  /* ---------------- UPDATE ---------------- */

  it('update throws if preload null', async () => {
    usersRepository.preload.mockResolvedValue(null);

    await expect(service.update('x', {} as RegisterDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update success', async () => {
    usersRepository.preload.mockResolvedValue({ id: '1' });
    usersRepository.save.mockResolvedValue({});
    usersRepository.findOne.mockResolvedValue({ id: '1' });

    await service.update('1', {} as RegisterDto);
    expect(usersRepository.save).toHaveBeenCalled();
  });

  /* ---------------- DELETE ---------------- */

  it('remove throws if not found', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(service.remove('x')).rejects.toThrow(NotFoundException);
  });

  /* ---------------- FOLLOW ---------------- */

  it('cannot follow self', async () => {
    await expect(service.followUser('u1', 'u1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('follow target not found', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(service.followUser('u1', 't')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('follow returns existing follow', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 't', isPublic: true });

    followRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn<any>().mockResolvedValue({ id: 'f1' }),
    });

    const res = await service.followUser('u1', 't');
    expect(res).toEqual({ id: 'f1' });
  });

  it('create follow accepted', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 't', isPublic: true });

    followRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn<any>().mockResolvedValue(null),
    });

    followRepository.create.mockReturnValue({});
    followRepository.save.mockResolvedValue({ status: 'ACCEPTED' });

    const res = await service.followUser('u1', 't');
    expect(res.status).toBe('ACCEPTED');
  });

  /* ---------------- UNFOLLOW ---------------- */

  it('unfollow no relation', async () => {
    followRepository.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn<any>().mockResolvedValue(null),
    });

    const res = await service.unfollowUser('u1', 'u2');
    expect(res.message).toContain('No había');
  });

  it('unfollow success', async () => {
    followRepository.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn<any>().mockResolvedValue({ id: 'f1' }),
    });

    followRepository.remove.mockResolvedValue({});

    const res = await service.unfollowUser('u1', 'u2');
    expect(res.message).toContain('Relación eliminada');
  });

  /* ---------------- FOLLOW REQUESTS ---------------- */

  it('pending requests', async () => {
    followRepository.find.mockResolvedValue([]);
    const res = await service.getPendingRequests('u1');
    expect(res).toEqual([]);
  });

  it('accept follow', async () => {
    followRepository.findOne.mockResolvedValue({
      id: '1',
      follower: { id: 'a' },
      following: { id: 'b' },
    });

    followRepository.save.mockResolvedValue({});
    activitiesService.create.mockResolvedValue({});

    await service.acceptFollowRequest('1');
    expect(activitiesService.create).toHaveBeenCalled();
  });

  it('decline missing', async () => {
    followRepository.findOneBy.mockResolvedValue(null);

    await expect(service.declineFollowRequest('x')).rejects.toThrow(
      NotFoundException,
    );
  });

  /* ---------------- FOLLOW IDS ---------------- */

  it('getFollowingIds', async () => {
    followRepository.find.mockResolvedValue([
      { following: { id: 'a' } },
      { following: { id: 'b' } },
    ]);

    const res = await service.getFollowingIds('u1');
    expect(res).toEqual(['a', 'b']);
  });

  /* ---------------- STATS ---------------- */

  it('addExperience new stats', async () => {
    userStatsRepository.findOne.mockResolvedValue(null);
    userStatsRepository.create.mockReturnValue({});
    userStatsRepository.save.mockResolvedValue({ xp: 10, level: 1 });

    const res = await service.addExperience('u1', 10);
    expect(res.level).toBeDefined();
  });

  it('updateStreak missing stats', async () => {
    userStatsRepository.findOne.mockResolvedValue(null);

    const res = await service.updateStreak('u1');
    expect(res).toBeUndefined();
  });

  it('updateStreak reset branch', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000 * 50);

    userStatsRepository.findOne.mockResolvedValue({
      currentStreak: 5,
      totalBooksFinished: 1,
      lastActivityDate: past,
    });

    userStatsRepository.save.mockResolvedValue({});

    await service.updateStreak('u1');
    expect(userStatsRepository.save).toHaveBeenCalled();
  });

  /* ---------------- BADGES ---------------- */

  it('assignBadge duplicate skip', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'u1',
      badges: [{ id: 'b1' }],
    });

    badgeRepository.findOneBy.mockResolvedValue({ id: 'b1' });

    await service.assignBadge('u1', 'b1');

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('assignBadge success', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'u1', badges: [] });
    badgeRepository.findOneBy.mockResolvedValue({ id: 'b1' });

    usersRepository.save.mockResolvedValue({});

    await service.assignBadge('u1', 'b1');
    expect(usersRepository.save).toHaveBeenCalled();
  });

  /* ---------------- AVATAR ---------------- */

  it('delete avatar not found', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteAvatar('x')).rejects.toThrow(NotFoundException);
  });

  it('update avatar', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'u1' });
    usersRepository.save.mockResolvedValue({});

    await service.updateAvatar('u1', 'url');

    expect(usersRepository.save).toHaveBeenCalled();
  });

  /* ---------------- ADMIN + BOOT ---------------- */

  it('setupAdmin skip + create', async () => {
    configService.get
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);

    await (service as any).setupAdmin();

    configService.get
      .mockReturnValueOnce('a@a.com')
      .mockReturnValueOnce('pass');

    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.create.mockReturnValue({});
    usersRepository.save.mockResolvedValue({});

    await (service as any).setupAdmin();
  });

  it('setup badges', async () => {
    badgeRepository.count.mockResolvedValue(0);
    badgeRepository.save.mockResolvedValue([]);

    await (service as any).setupInitialBadges();
  });

  /* ---------------- GROWTH ---------------- */

  it('books growth', async () => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn<any>()
        .mockResolvedValue([{ month: '2026-01', count: 1 }]),
    };

    usersRepository.createQueryBuilder.mockReturnValue(qb);

    const res = await service.getBooksGrowth('u1');

    expect(res.length).toBe(1);
  });

  it('should run onModuleInit and call setupAdmin + setupInitialBadges', async () => {
    const setupAdminSpy = jest
      .spyOn(service as any, 'setupAdmin')
      .mockResolvedValue(undefined);

    const setupBadgesSpy = jest
      .spyOn(service as any, 'setupInitialBadges')
      .mockResolvedValue(undefined);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await service.onModuleInit();

    expect(logSpy).toHaveBeenCalledWith(
      '📦 Inicializando sistema de usuarios...',
    );

    expect(setupAdminSpy).toHaveBeenCalled();
    expect(setupBadgesSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('should return all users (findAll)', async () => {
    const mockUsers = [
      { id: '1', email: 'a@test.com' },
      { id: '2', email: 'b@test.com' },
    ];

    usersRepository.find.mockResolvedValue(mockUsers);

    const result = await service.findAll();

    expect(usersRepository.find).toHaveBeenCalledWith({
      relations: ['followerRelations', 'followerRelations.follower'],
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        role: true,
        province: true,
      },
    });

    expect(result).toEqual(mockUsers);
  });

  it('should compute isFollowing and hasPendingRequest from followerRelations', async () => {
    const requesterId = 'user-2';

    const userMock = {
      id: 'user-1',
      isPublic: true,
      followerRelations: [
        {
          follower: { id: requesterId },
          status: FollowStatus.ACCEPTED,
        },
        {
          follower: { id: requesterId },
          status: FollowStatus.PENDING,
        },
      ],
      followingRelations: [],
    };

    usersRepository.findOne.mockResolvedValueOnce(userMock);

    usersRepository.findOne.mockResolvedValueOnce({
      clubs: [],
    });

    eventRepository.find.mockResolvedValue([]);
    bookRepository.find.mockResolvedValue([]);
    registrationRepository.find.mockResolvedValue([]);

    const result = await service.findOneProfile('user-1', requesterId);

    expect(result.isFollowing).toBe(true);
    expect(result.hasPendingRequest).toBe(true);
  });

  it('should filter and map attendedEvents correctly', async () => {
    const requesterId = 'u2';

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // +1 día
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // -1 día

    const userMock = {
      id: 'u1',
      isPublic: true,
      followerRelations: [],
      followingRelations: [],
    };

    const registrationsMock = [
      {
        id: 'r1',
        event: {
          id: 'e1',
          eventDate: futureDate,
        },
      },
      {
        id: 'r2',
        event: {
          id: 'e2',
          eventDate: pastDate,
        },
      },
    ];

    usersRepository.findOne.mockResolvedValueOnce(userMock);
    usersRepository.findOne.mockResolvedValueOnce({ clubs: [] });

    eventRepository.find.mockResolvedValue([]);
    bookRepository.find.mockResolvedValue([]);
    registrationRepository.find.mockResolvedValue(registrationsMock);

    const result = await service.findOneProfile('u1', requesterId);

    expect(result.attendedEvents).toHaveLength(1);
    expect(result.attendedEvents[0]).toMatchObject({
      id: 'e1',
      registrationId: 'r1',
    });
  });

  it('should throw NotFoundException when user does not exist (deactivateAccount)', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.deactivateAccount('u1')).rejects.toThrow(
      NotFoundException,
    );

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('should deactivate user account successfully', async () => {
    const userMock = {
      id: 'u1',
      isActive: true,
    };

    usersRepository.findOne.mockResolvedValue(userMock);
    usersRepository.save.mockResolvedValue({
      ...userMock,
      isActive: false,
    });

    const result = await service.deactivateAccount('u1');

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'u1' },
    });

    expect(usersRepository.save).toHaveBeenCalledWith({
      id: 'u1',
      isActive: false,
    });

    expect(result.isActive).toBe(false);
  });

  it('should filter attendedEvents by future date and map registrationId', async () => {
    const requesterId = 'user-1';

    const futureDate = new Date(Date.now() + 1000 * 60 * 60);
    const pastDate = new Date(Date.now() - 1000 * 60 * 60);

    const userMock = {
      id: 'user-1',
      isPublic: true,
      followerRelations: [], // 👈 NECESARIO
    };

    usersRepository.findOne
      .mockResolvedValueOnce(userMock) // 👈 1ª llamada (user principal)
      .mockResolvedValueOnce({ clubs: [] }); // 👈 2ª llamada (clubs)

    eventRepository.find.mockResolvedValue([]); // events
    bookRepository.find.mockResolvedValue([]); // books

    registrationRepository.find.mockResolvedValue([
      {
        id: 'reg-1',
        event: { eventDate: futureDate },
      },
      {
        id: 'reg-2',
        event: { eventDate: pastDate },
      },
    ]);

    const result = await service.findOneProfile('user-1', requesterId);

    expect(result.attendedEvents).toHaveLength(1);
    expect(result.attendedEvents[0]).toMatchObject({
      registrationId: 'reg-1',
    });
  });

  it('should throw NotFoundException when deactivating non-existing user', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.deactivateAccount('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should deactivate user account', async () => {
    const user = { id: 'user-1', isActive: true };

    usersRepository.findOne.mockResolvedValue(user);
    usersRepository.save.mockResolvedValue({
      ...user,
      isActive: false,
    });

    const result = await service.deactivateAccount('user-1');

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );

    expect(result.isActive).toBe(false);
  });

  it('should remove follow request', async () => {
    const request = { id: 'req-1' };

    followRepository.findOneBy.mockResolvedValue(request);
    followRepository.remove.mockResolvedValue(request);

    const result = await service.declineFollowRequest('req-1');

    expect(followRepository.remove).toHaveBeenCalledWith(request);
    expect(result).toEqual(request);
  });

  it('should search users by query', async () => {
    const users = [{ id: 'u1' }, { id: 'u2' }];

    usersRepository.find.mockResolvedValue(users);

    const result = await service.searchUsers('john');

    expect(usersRepository.find).toHaveBeenCalledWith({
      where: [{ fullName: expect.anything() }, { email: expect.anything() }],
      select: ['id', 'fullName', 'avatarUrl', 'bio', 'isPublic'],
    });

    expect(result).toEqual(users);
  });

  it('should remove user when exists', async () => {
    const user = { id: 'user-1' };

    usersRepository.findOneBy.mockResolvedValue(user);
    usersRepository.remove.mockResolvedValue(user);

    const result = await service.remove('user-1');

    expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
    expect(usersRepository.remove).toHaveBeenCalledWith(user);
    expect(result).toEqual(user);
  });

  it('should initialize streak when lastActivityDate is null', async () => {
    const userId = 'user-1';

    const stats = {
      totalBooksFinished: 0,
      currentStreak: 0,
      lastActivityDate: null,
    };

    userStatsRepository.findOne.mockResolvedValue(stats);
    userStatsRepository.save.mockResolvedValue({
      ...stats,
      currentStreak: 1,
      lastActivityDate: expect.any(Date),
    });

    await service.updateStreak(userId);

    expect(userStatsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 1,
        lastActivityDate: expect.any(Date),
      }),
    );
  });

  it('should delete user avatar and set avatarUrl to null', async () => {
    const user = {
      id: 'user-1',
      avatarUrl: 'https://image.com/avatar.png',
    };

    usersRepository.findOne.mockResolvedValue(user);
    usersRepository.save.mockResolvedValue({
      ...user,
      avatarUrl: null,
    });

    const result = await service.deleteAvatar('user-1');

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: null }),
    );

    expect(result.avatarUrl).toBeNull();
  });

  it('should increment streak when last activity is between 24 and 48 hours', async () => {
    const userId = 'user-1';

    const pastDate = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30h ago

    const stats = {
      totalBooksFinished: 1,
      currentStreak: 2,
      lastActivityDate: pastDate,
    };

    userStatsRepository.findOne.mockResolvedValue(stats);
    userStatsRepository.save.mockResolvedValue({
      ...stats,
      currentStreak: 3,
    });

    await service.updateStreak(userId);

    expect(userStatsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 3,
      }),
    );
  });
});
