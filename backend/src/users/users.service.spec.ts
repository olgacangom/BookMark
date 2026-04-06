import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import { UserStats } from './entities/user-stats.entity';
import { Badge } from './badge.entity';
import { ActivitiesService } from './activities.service';
import { Repository, ObjectLiteral } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
/* IMPORTAMOS LOS DTOS REALES */
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Tipado para mocks que evita el error 'never' y 'any'
type MockRepository<T extends ObjectLiteral = object> = {
  [P in keyof Repository<T>]?: jest.Mock<any>;
};

type MockService<T = object> = {
  [P in keyof T]?: jest.Mock<any>;
};

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: MockRepository<User>;
  let followRepo: MockRepository<Follow>;
  let statsRepo: MockRepository<UserStats>;
  let badgeRepo: MockRepository<Badge>;
  let activitiesService: MockService<ActivitiesService>;

  const mockUserId = 'user-1';
  const mockTargetId = 'user-2';

  const mockUser = {
    id: mockUserId,
    email: 'test@test.com',
    fullName: 'Olguí',
    isPublic: true,
    followerRelations: [],
    followingRelations: [],
    badges: [],
    password: 'hashed_password',
  } as unknown as User;

  // DTOs base para evitar 'any' en los tests
  const validCreateDto: CreateUserDto = {
    email: 'test@test.com',
    password: '123',
    fullName: 'Olguí',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserStats),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            count: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get(getRepositoryToken(User));
    followRepo = module.get(getRepositoryToken(Follow));
    statsRepo = module.get(getRepositoryToken(UserStats));
    badgeRepo = module.get(getRepositoryToken(Badge));
    activitiesService = module.get(ActivitiesService);

    jest.clearAllMocks();
    /* CORRECCIÓN 107: Eliminado 'as any' del retorno de bcrypt */
    mockedBcrypt.hash.mockImplementation(() =>
      Promise.resolve('hashed_password'),
    );
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('create', () => {
    it('debe lanzar BadRequestException si el email ya existe', async () => {
      usersRepo.findOneBy?.mockResolvedValue(mockUser);
      /* CORRECCIÓN 116: Eliminado 'as any' usando DTO real */
      await expect(service.create(validCreateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe crear el usuario y sus stats iniciales', async () => {
      usersRepo.findOneBy?.mockResolvedValue(null);
      usersRepo.create?.mockReturnValue(mockUser);
      usersRepo.save?.mockResolvedValue(mockUser);
      statsRepo.create?.mockReturnValue({});

      /* CORRECCIÓN 130: Eliminado 'as any' usando DTO real */
      const result = await service.create({
        ...validCreateDto,
        email: 'new@a.com',
      });
      expect(usersRepo.save).toHaveBeenCalled();
      expect(statsRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('find methods', () => {
    it('findOneByEmail: debe llamar a findOneBy', async () => {
      await service.findOneByEmail('test@test.com');
      expect(usersRepo.findOneBy).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
    });

    it('findAll: debe devolver todos los usuarios con sus relaciones', async () => {
      usersRepo.find?.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });

    it('findOne: debe lanzar NotFoundException si no existe', async () => {
      usersRepo.findOne?.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('findOne: debe retornar el usuario', async () => {
      usersRepo.findOne?.mockResolvedValue(mockUser);
      expect(await service.findOne('1')).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('debe lanzar NotFoundException si preload falla', async () => {
      usersRepo.preload?.mockResolvedValue(null);
      await expect(service.update('99', {})).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar y retornar el usuario findOne', async () => {
      usersRepo.preload?.mockResolvedValue(mockUser);
      usersRepo.findOne?.mockResolvedValue(mockUser);
      const updateDto: UpdateUserDto = { fullName: 'Editado' };
      const result = await service.update('1', updateDto);
      expect(usersRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('Social Logic (Follow/Unfollow)', () => {
    it('followUser: no debe permitir seguirse a sí mismo', async () => {
      await expect(service.followUser(mockUserId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('followUser: debe lanzar NotFound si el objetivo no existe', async () => {
      usersRepo.findOneBy?.mockResolvedValue(null);
      await expect(
        service.followUser(mockUserId, mockTargetId),
      ).rejects.toThrow(NotFoundException);
    });

    it('followUser: debe retornar el follow si ya existe', async () => {
      usersRepo.findOneBy?.mockResolvedValue({ id: mockTargetId });
      followRepo.findOne?.mockResolvedValue({ id: 'f1' });
      const result = await service.followUser(mockUserId, mockTargetId);
      expect(result).toEqual({ id: 'f1' });
    });

    it('followUser: debe crear ACCEPTED si el objetivo es público', async () => {
      usersRepo.findOneBy?.mockResolvedValue({
        id: mockTargetId,
        isPublic: true,
      });
      followRepo.findOne?.mockResolvedValue(null);
      followRepo.create?.mockReturnValue({ status: FollowStatus.ACCEPTED });
      await service.followUser(mockUserId, mockTargetId);
      expect(followRepo.save).toHaveBeenCalled();
    });

    it('followUser: debe crear PENDING si el objetivo es privado', async () => {
      usersRepo.findOneBy?.mockResolvedValue({
        id: mockTargetId,
        isPublic: false,
      });
      followRepo.findOne?.mockResolvedValue(null);
      followRepo.create?.mockReturnValue({ status: FollowStatus.PENDING });
      await service.followUser(mockUserId, mockTargetId);
      expect(followRepo.save).toHaveBeenCalled();
    });

    it('unfollowUser: manejar cuando no hay relación', async () => {
      followRepo.findOne?.mockResolvedValue(null);
      const result = await service.unfollowUser(mockUserId, mockTargetId);
      expect(result.message).toBe('No había relación previa');
    });

    it('unfollowUser: eliminar relación existente', async () => {
      const follow = { id: 'f1' };
      followRepo.findOne?.mockResolvedValue(follow);
      const result = await service.unfollowUser(mockUserId, mockTargetId);
      expect(followRepo.remove).toHaveBeenCalled();
      expect(result.message).toBe('Relación eliminada');
    });

    it('getPendingRequests: debe buscar por PENDING', async () => {
      await service.getPendingRequests(mockUserId);
      expect(followRepo.find).toHaveBeenCalled();
    });
  });

  describe('Follow Requests', () => {
    it('acceptFollowRequest: lanzar NotFound si no existe', async () => {
      followRepo.findOne?.mockResolvedValue(null);
      await expect(service.acceptFollowRequest('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('acceptFollowRequest: aceptar y crear actividad', async () => {
      const mockReq = {
        id: 'r1',
        follower: { id: 'f1' },
        following: { id: 'u1' },
        status: '',
      };
      followRepo.findOne?.mockResolvedValue(mockReq);
      await service.acceptFollowRequest('r1');
      expect(mockReq.status).toBe(FollowStatus.ACCEPTED);
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('declineFollowRequest: lanzar NotFound si no existe', async () => {
      followRepo.findOneBy?.mockResolvedValue(null);
      await expect(service.declineFollowRequest('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('declineFollowRequest: eliminar solicitud', async () => {
      const mockReq = { id: 'r1' };
      followRepo.findOneBy?.mockResolvedValue(mockReq);
      await service.declineFollowRequest('r1');
      expect(followRepo.remove).toHaveBeenCalled();
    });
  });

  describe('Gamification', () => {
    it('addExperience: nivel 4 con 900 XP', async () => {
      const stats = { xp: 800, level: 1 };
      statsRepo.findOne?.mockResolvedValue(stats);
      await service.addExperience(mockUserId, 100);
      expect(stats.level).toBe(4);
    });

    it('updateStreak: retornar si no hay stats', async () => {
      statsRepo.findOne?.mockResolvedValue(null);
      expect(await service.updateStreak(mockUserId)).toBeUndefined();
    });

    it('updateStreak: inicializar si no hay lastActivityDate', async () => {
      const stats = {
        currentStreak: 0,
        lastActivityDate: null,
        totalBooksFinished: 0,
      };
      statsRepo.findOne?.mockResolvedValue(stats);
      await service.updateStreak(mockUserId);
      expect(stats.currentStreak).toBe(1);
    });

    it('updateStreak: aumentar racha tras 30h', async () => {
      const h30 = new Date();
      h30.setHours(h30.getHours() - 30);
      const stats = {
        currentStreak: 1,
        lastActivityDate: h30,
        totalBooksFinished: 0,
      };
      statsRepo.findOne?.mockResolvedValue(stats);
      await service.updateStreak(mockUserId);
      expect(stats.currentStreak).toBe(2);
    });

    it('updateStreak: resetear racha tras 60h', async () => {
      const h60 = new Date();
      h60.setHours(h60.getHours() - 60);
      const stats = {
        currentStreak: 5,
        lastActivityDate: h60,
        totalBooksFinished: 0,
      };
      statsRepo.findOne?.mockResolvedValue(stats);
      await service.updateStreak(mockUserId);
      expect(stats.currentStreak).toBe(1);
    });

    it('updateStreak: no tocar racha tras 2h', async () => {
      const h2 = new Date();
      h2.setHours(h2.getHours() - 2);
      const stats = {
        currentStreak: 5,
        lastActivityDate: h2,
        totalBooksFinished: 0,
      };
      statsRepo.findOne?.mockResolvedValue(stats);
      await service.updateStreak(mockUserId);
      expect(stats.currentStreak).toBe(5);
    });

    it('assignBadge: no duplicar medallas', async () => {
      const badge = { id: 'b1' };
      const user = { id: '1', badges: [badge] };
      usersRepo.findOne?.mockResolvedValue(user);
      badgeRepo.findOneBy?.mockResolvedValue(badge);
      await service.assignBadge('1', 'b1');
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('Privacy', () => {
    it('findOneProfile: lanzar Forbidden si es privado y no hay relación', async () => {
      const userPrivado = { id: '2', isPublic: false, followerRelations: [] };
      usersRepo.findOne?.mockResolvedValue(userPrivado);
      await expect(service.findOneProfile('2', '3')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Infrastructure', () => {
    it('onModuleInit: sembrar datos si count es 0', async () => {
      badgeRepo.count?.mockResolvedValue(0);
      await service.onModuleInit();
      expect(badgeRepo.save).toHaveBeenCalled();
    });

    it('remove: éxito', async () => {
      usersRepo.findOneBy?.mockResolvedValue(mockUser);
      await service.remove(mockUserId);
      expect(usersRepo.remove).toHaveBeenCalled();
    });
  });

  it('searchUsers: debe ejecutar la búsqueda con ILike (Línea 180)', async () => {
    usersRepo.find?.mockResolvedValue([mockUser]);
    const result = await service.searchUsers('test');
    expect(result).toEqual([mockUser]);
    expect(usersRepo.find).toHaveBeenCalled();
  });

  describe('findOneProfile - Lógica interna', () => {
    it('debe detectar correctamente isFollowing y hasPendingRequest y eliminar password (Líneas 204, 208, 216-217)', async () => {
      /* CORRECCIÓN 369: Eliminado 'as any' usando casteo unknown -> User */
      const userWithRelations = {
        ...mockUser,
        followerRelations: [
          { follower: { id: 'follower-1' }, status: FollowStatus.ACCEPTED },
          { follower: { id: 'follower-2' }, status: FollowStatus.PENDING },
        ],
      } as unknown as User;

      usersRepo.findOne?.mockResolvedValue(userWithRelations);

      const res1 = await service.findOneProfile(mockUserId, 'follower-1');
      expect(res1.isFollowing).toBe(true);
      expect(res1.hasPendingRequest).toBe(false);
      expect(res1).not.toHaveProperty('password');

      const res2 = await service.findOneProfile(mockUserId, 'follower-2');
      /* CORRECCIÓN 233: Usada la variable 'res2' para evitar error de unused */
      expect(res2.isFollowing).toBe(false);
      expect(res2.hasPendingRequest).toBe(true);
    });
  });

  it('addExperience: debe crear nuevas stats si el usuario no tiene (Línea 237)', async () => {
    statsRepo.findOne?.mockResolvedValue(null);
    statsRepo.create?.mockReturnValue({ xp: 0, level: 1 });
    statsRepo.save?.mockResolvedValue({ xp: 10, level: 1 });

    await service.addExperience(mockUserId, 10);

    expect(statsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: mockUserId },
        xp: 0,
      }),
    );
  });

  it('updateStreak: debe inicializar racha si lastActivityDate es null (Líneas 268-269)', async () => {
    const stats = {
      currentStreak: 0,
      lastActivityDate: null,
      totalBooksFinished: 0,
    };
    statsRepo.findOne?.mockResolvedValue(stats);

    await service.updateStreak(mockUserId);

    expect(stats.currentStreak).toBe(1);
    expect(stats.lastActivityDate).toBeInstanceOf(Date);
  });

  it('assignBadge: debe añadir la medalla al array y guardar (Líneas 299-301)', async () => {
    const user = { ...mockUser, badges: [] } as unknown as User;
    const badge = { id: 'badge-1', name: 'Lector Pro' };

    usersRepo.findOne?.mockResolvedValue(user);
    badgeRepo.findOneBy?.mockResolvedValue(badge);

    await service.assignBadge(mockUserId, 'badge-1');

    expect(user.badges).toContain(badge);
    expect(usersRepo.save).toHaveBeenCalledWith(user);
  });
});
