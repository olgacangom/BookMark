/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import { ActivitiesService } from './activities.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let followRepo: jest.Mocked<Repository<Follow>>;
  let actService: jest.Mocked<ActivitiesService>;

  const mockUser = {
    id: 'u1',
    email: 'a@a.com',
    fullName: 'Test User',
    password: 'password123',
    isPublic: true,
    followerRelations: [],
  } as unknown as User;

  const mockFollow = {
    id: 'f1',
    follower: { id: 'u1' },
    following: { id: 'u2' },
    status: FollowStatus.PENDING,
  } as unknown as Follow;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: ActivitiesService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    followRepo = module.get(getRepositoryToken(Follow));
    actService = module.get(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe lanzar BadRequest si el email ya existe', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      await expect(
        service.create({ email: 'a@a.com' } as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear un usuario y hashear la contraseña', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const res = await service.create({
        email: 'new@a.com',
        password: '123',
      } as CreateUserDto);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(res).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('debe lanzar NotFound si preload falla', async () => {
      userRepo.preload.mockResolvedValue(undefined);
      await expect(service.update('1', {} as UpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe actualizar correctamente', async () => {
      userRepo.preload.mockResolvedValue(mockUser);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      await service.update('u1', { fullName: 'Nuevo' } as UpdateUserDto);
      expect(userRepo.save).toHaveBeenCalled();
    });
  });

  describe('followUser', () => {
    it('debe lanzar BadRequest si el followerId es igual al targetUserId', async () => {
      await expect(service.followUser('u1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFound si el usuario objetivo no existe', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.followUser('u1', 'u2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar la relación si ya existía', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'u2' } as User);
      followRepo.findOne.mockResolvedValue(mockFollow);
      const res = await service.followUser('u1', 'u2');
      expect(res).toEqual(mockFollow);
    });

    it('debe crear con estado ACCEPTED si el target es público', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: 'u2',
        isPublic: true,
      } as User);
      followRepo.findOne.mockResolvedValue(null);
      followRepo.create.mockReturnValue({ status: '' } as unknown as Follow);
      await service.followUser('u1', 'u2');
      expect(followRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: FollowStatus.ACCEPTED }),
      );
    });

    it('debe crear con estado PENDING si el target es privado', async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: 'u2',
        isPublic: false,
      } as User);
      followRepo.findOne.mockResolvedValue(null);
      followRepo.create.mockReturnValue({ status: '' } as unknown as Follow);
      await service.followUser('u1', 'u2');
      expect(followRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: FollowStatus.PENDING }),
      );
    });
  });

  describe('unfollowUser', () => {
    it('debe informar si no había relación previa', async () => {
      followRepo.findOne.mockResolvedValue(null);
      const res = await service.unfollowUser('u1', 'u2');
      expect(res.message).toBe('No había relación previa');
    });

    it('debe eliminar la relación existente', async () => {
      followRepo.findOne.mockResolvedValue(mockFollow);
      const res = await service.unfollowUser('u1', 'u2');
      expect(followRepo.remove).toHaveBeenCalled();
      expect(res.message).toBe('Relación eliminada');
    });
  });

  describe('accept/decline requests', () => {
    it('acceptFollowRequest: éxito y crea actividad', async () => {
      const f = {
        id: 'r1',
        follower: { id: 'u1' },
        following: { id: 'u2' },
        status: '',
      };
      followRepo.findOne.mockResolvedValue(f as any);
      await service.acceptFollowRequest('r1');
      expect(f.status).toBe(FollowStatus.ACCEPTED);
      expect(actService.create).toHaveBeenCalled();
    });

    it('acceptFollowRequest: lanza NotFound si no existe', async () => {
      followRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptFollowRequest('r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('declineFollowRequest: elimina solicitud', async () => {
      followRepo.findOneBy.mockResolvedValue(mockFollow);
      await service.declineFollowRequest('r1');
      expect(followRepo.remove).toHaveBeenCalled();
    });

    it('declineFollowRequest: lanza NotFound', async () => {
      followRepo.findOneBy.mockResolvedValue(null);
      await expect(service.declineFollowRequest('r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneProfile (Privacidad y Flags)', () => {
    it('debe permitir ver perfil si es público', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u2',
        isPublic: true,
        followerRelations: [],
      } as any);
      const res = await service.findOneProfile('u2', 'u1');
      expect(res.id).toBe('u2');
    });

    it('debe permitir ver perfil privado si eres el dueño', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        isPublic: false,
        followerRelations: [],
      } as any);
      const res = await service.findOneProfile('u1', 'u1');
      expect(res.id).toBe('u1');
    });

    it('debe permitir ver perfil privado si ya le sigues (ACCEPTED)', async () => {
      const target = {
        id: 'u2',
        isPublic: false,
        followerRelations: [
          { follower: { id: 'u1' }, status: FollowStatus.ACCEPTED },
        ],
      };
      userRepo.findOne.mockResolvedValue(target as any);
      const res = await service.findOneProfile('u2', 'u1');
      expect(res.isFollowing).toBe(true);
    });

    it('debe lanzar Forbidden si es privado y no le sigues', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u2',
        isPublic: false,
        followerRelations: [],
      } as any);
      await expect(service.findOneProfile('u2', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe identificar correctamente una solicitud PENDING', async () => {
      const target = {
        id: 'u2',
        isPublic: false,
        followerRelations: [
          { follower: { id: 'u1' }, status: FollowStatus.PENDING },
        ],
      };
      userRepo.findOne.mockResolvedValue(target as any);
      await expect(service.findOneProfile('u2', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar NotFound si el perfil no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneProfile('u2', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Otros métodos', () => {
    it('findAll: llama a find con relaciones', async () => {
      await service.findAll();
      expect(userRepo.find).toHaveBeenCalled();
    });

    it('getPendingRequests: llama a find con filtro PENDING', async () => {
      await service.getPendingRequests('u1');
      expect(followRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { following: { id: 'u1' }, status: FollowStatus.PENDING },
        }),
      );
    });

    it('searchUsers: llama a find con ILike', async () => {
      await service.searchUsers('olga');
      expect(userRepo.find).toHaveBeenCalled();
    });

    it('remove: borra usuario si existe', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser);
      await service.remove('u1');
      expect(userRepo.remove).toHaveBeenCalled();
    });

    it('remove: lanza NotFound si no existe', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('u1')).rejects.toThrow(NotFoundException);
    });

    it('findOneByEmail: busca correctamente', async () => {
      await service.findOneByEmail('test@test.com');
      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar el usuario si existe con todas sus relaciones', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as unknown as User);

      const result = await service.findOne('u1');

      const findOneSpy = userRepo.findOne;
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 'u1' },
        relations: [
          'followerRelations',
          'followerRelations.follower',
          'followingRelations',
          'followingRelations.following',
        ],
      });

      expect(result).toEqual(mockUser);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Usuario no encontrado'),
      );
    });
  });
});
