import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Book } from 'src/books/entities/book.entity';
import { BookListing } from '../entities/book-listing.entity';
import { LibraryEvent } from '../entities/library-event.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import { SustainabilityRequest } from '../entities/sustainability-request.entity';
import { Club } from 'src/club/entities/club.entity';
import { AuthService } from 'src/auth/auth.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

type MockRepo = {
  findOne?: jest.Mock<any>;
  findOneBy?: jest.Mock<any>;
  find?: jest.Mock<any>;
  save?: jest.Mock<any>;
  remove?: jest.Mock<any>;
  count?: jest.Mock<any>;
  createQueryBuilder?: jest.Mock<any>;
};

const createMockQueryBuilder = () => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn<any>().mockResolvedValue([]),
    getRawOne: jest.fn<any>().mockResolvedValue(null),
    getCount: jest.fn<any>().mockResolvedValue(0),
    getMany: jest.fn<any>().mockResolvedValue([]),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
  };
  return qb;
};

const repoFactory = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn<any>().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockImplementation(createMockQueryBuilder),
});

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: MockRepo;
  let authService: AuthService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: repoFactory() },
        { provide: getRepositoryToken(Book), useValue: repoFactory() },
        { provide: getRepositoryToken(BookListing), useValue: repoFactory() },
        { provide: getRepositoryToken(LibraryEvent), useValue: repoFactory() },
        { provide: getRepositoryToken(EventRegistration), useValue: repoFactory() },
        { provide: getRepositoryToken(SustainabilityRequest), useValue: repoFactory() },
        { provide: getRepositoryToken(Club), useValue: repoFactory() },
        { provide: AuthService, useValue: { sendNotificationEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
    authService = module.get(AuthService);
  });

  it('toggleUserStatus activates suspended user and sends email', async () => {
    const user = { id: 'u1', email: 'a@b.com', isActive: false } as any;
    userRepo.findOne!.mockResolvedValue(user);
    userRepo.save!.mockResolvedValue({ ...user, isActive: true });

    const result = await service.toggleUserStatus('u1');

    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(userRepo.save).toHaveBeenCalledWith({ ...user, isActive: true });
    expect(authService['sendNotificationEmail']).toHaveBeenCalledWith(
      'a@b.com',
      'Actualización de tu cuenta en BookMark',
      expect.stringContaining('reactivada'),
    );
    expect(result.message).toContain('activado');
  });

  it('toggleUserStatus throws when user not found', async () => {
    userRepo.findOne!.mockResolvedValue(null);
    await expect(service.toggleUserStatus('u1')).rejects.toThrow(NotFoundException);
  });

  it('approveLibrero promotes user and sends email', async () => {
    const user = { id: 'u1', email: 'a@b.com', fullName: 'User', role: UserRole.USER, isActive: false } as any;
    userRepo.findOne!.mockResolvedValue(user);
    userRepo.save!.mockResolvedValue({ ...user, role: UserRole.LIBRERO, isActive: true });

    const result = await service.approveLibrero('u1');
    expect(userRepo.save).toHaveBeenCalled();
    expect(authService['sendNotificationEmail']).toHaveBeenCalledWith(
      'a@b.com',
      'Solicitud aceptada - BookMark',
      expect.any(String),
    );
    expect(result.message).toContain('Librero oficial');
  });

  it('rejectLibrero removes user and sends email', async () => {
    const user = { id: 'u1', email: 'a@b.com', fullName: 'User' } as any;
    userRepo.findOne!.mockResolvedValue(user);
    userRepo.remove!.mockResolvedValue(user);

    const result = await service.rejectLibrero('u1');
    expect(userRepo.remove).toHaveBeenCalledWith(user);
    expect(authService['sendNotificationEmail']).toHaveBeenCalledWith(
      'a@b.com',
      'Solicitud rechazada - BookMark',
      expect.any(String),
    );
    expect(result.message).toContain('rechazada');
  });

  describe('getGlobalStats and getMonthlyUserGrowth', () => {
    it('getGlobalStats should return aggregated data', async () => {
      userRepo.count!.mockResolvedValue(10);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),

        getRawMany: jest.fn() as jest.MockedFunction<() => Promise<any[]>>,
        getCount: jest.fn() as jest.MockedFunction<() => Promise<number>>,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const bookRepo = module.get(getRepositoryToken(Book));
      const listingRepo = module.get(getRepositoryToken(BookListing));
      const requestRepo = module.get(getRepositoryToken(SustainabilityRequest));
      const eventRepo = module.get(getRepositoryToken(LibraryEvent));

      bookRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      listingRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      requestRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      eventRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const stats = await service.getGlobalStats();
      expect(stats.totalUsers).toBe(10);
    });
  });

  it('getAllUsersWithBookCount should return users with book count', async () => {
    const mockQueryBuilder = {
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn<any>().mockResolvedValue([{ id: 'u1' }]),
    };
    userRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

    const result = await service.getAllUsersWithBookCount();
    expect(result).toHaveLength(1);
    expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalled();
  });

  it('getGlobalStats should cover formatWeeklyGrowth logic', async () => {
    const listingRepo = module.get(getRepositoryToken(BookListing));
    listingRepo.createQueryBuilder = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn<any>().mockResolvedValue([
        { createdAt: new Date().toISOString() }
      ]),
      getRawOne: jest.fn<any>().mockResolvedValue(null),
      getCount: jest.fn<any>().mockResolvedValue(0),
    });
    userRepo.count!.mockResolvedValue(0);
    const stats = await service.getGlobalStats();
    expect(stats.weeklyListingGrowth).toBeDefined();
  });

  it('getMainStats should return counts', async () => {
    userRepo.count!.mockResolvedValue(5);
    const stats = await service.getMainStats();
    expect(stats).toEqual({ totalUsers: 5, totalLibreros: 5, pendientes: 5 });
  });

  it('findAllLibreros should return users with specific roles', async () => {
    userRepo.find = jest.fn<any>().mockResolvedValue([{ id: 'u1', role: UserRole.LIBRERO }]);
    const result = await service.findAllLibreros();
    expect(result[0].role).toBe(UserRole.LIBRERO);
  });

  it('getMostRequestedBook should return a book result', async () => {
    const requestRepo = module.get(getRepositoryToken(SustainabilityRequest));
    requestRepo.createQueryBuilder = jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn<any>().mockResolvedValue({ title: 'Libro', author: 'Autor' } as any),
    });
    const result = await service.getMostRequestedBook();
    expect(result).toEqual({ title: 'Libro', author: 'Autor' });
  });

  it('getMonthlyUserGrowth should group data by month and role', async () => {
    const mockData = [
      { month: '2026-06', role: UserRole.USER, count: '1' },
      { month: '2026-06', role: UserRole.LIBRERO, count: '1' },
    ];

    const qb = createMockQueryBuilder();

    qb.getRawMany.mockResolvedValue(mockData);

    userRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

    const result = await service.getMonthlyUserGrowth();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          month: '2026-06',
          reader: 1,
          librero: 1,
        }),
      ]),
    );
  });

  it('getGlobalStats should log and rethrow errors', async () => {
    const error = new Error('Database error');

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => { });

    // Forzamos un fallo en una dependencia utilizada por getGlobalStats
    userRepo.count!.mockRejectedValue(error);

    await expect(service.getGlobalStats()).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error en getGlobalStats:',
      error,
    );

    consoleSpy.mockRestore();
  });

});
