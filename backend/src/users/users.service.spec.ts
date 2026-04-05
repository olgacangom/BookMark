import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto'; // Asegúrate de que esté importado

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'uuid-1',
    email: 'test@test.com',
    password: 'hashed_password',
    isPublic: true,
    bio: 'My bio',
    followerRelations: [],
  };

  const mockFollow = {
    id: 'follow-uuid',
    follower: { id: 'follower-id' },
    following: { id: 'uuid-1' },
    status: FollowStatus.PENDING,
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
    preload: jest.fn(),
    remove: jest.fn().mockResolvedValue(mockUser),
  };

  const mockFollowRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockReturnValue(mockFollow),
    save: jest.fn().mockResolvedValue(mockFollow),
    find: jest.fn().mockResolvedValue([mockFollow]),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: UsersService, useClass: UsersService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Follow), useValue: mockFollowRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('CRUD & Basic Operations', () => {
    it('create: should throw BadRequestException if email exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      // CORRECCIÓN: Usar casting a CreateUserDto en lugar de any
      const dto = {
        email: 'test@test.com',
        password: '123',
        fullName: 'Test',
      } as CreateUserDto;

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('create: should create user and return it', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const savedUserFromDb = {
        id: 'uuid-new',
        email: 'new@test.com',
        password: 'hashed_password',
        fullName: 'New User',
      };

      mockUserRepository.save.mockResolvedValue(savedUserFromDb);

      // CORRECCIÓN: Definir el DTO con el tipo correcto
      const dto: CreateUserDto = {
        email: 'new@test.com',
        password: '123',
        fullName: 'New User',
      };

      const result = await service.create(dto);

      expect(result.email).toBe('new@test.com');
      expect(result.id).toBe('uuid-new');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('findOne: should throw NotFoundException if user missing', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('any-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('update: should throw NotFoundException if preload fails', async () => {
      mockUserRepository.preload.mockResolvedValue(null);
      await expect(service.update('id', {})).rejects.toThrow(NotFoundException);
    });

    it('remove: should find and remove user', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(mockUser);

      const result = await service.remove('uuid-1');

      expect(result).toBeDefined();
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        id: 'uuid-1',
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('Follow System Logic', () => {
    it('followUser: should throw error if following self', async () => {
      await expect(service.followUser('uuid', 'uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('followUser: should throw error if target user not found', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);
      await expect(service.followUser('id1', 'id2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('followUser: should return existing follow if already exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockFollowRepository.findOne.mockResolvedValue(mockFollow);
      const result = await service.followUser('follower', 'target');
      expect(result).toEqual(mockFollow);
      expect(mockFollowRepository.save).not.toHaveBeenCalled();
    });

    it('followUser: should create ACCEPTED follow if target is public', async () => {
      mockUserRepository.findOneBy.mockResolvedValue({
        ...mockUser,
        isPublic: true,
      });
      mockFollowRepository.findOne.mockResolvedValue(null);

      await service.followUser('follower', 'target');

      expect(mockFollowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FollowStatus.ACCEPTED,
        }),
      );
    });

    it('followUser: should create PENDING follow if target is private', async () => {
      mockUserRepository.findOneBy.mockResolvedValue({
        ...mockUser,
        isPublic: false,
      });
      mockFollowRepository.findOne.mockResolvedValue(null);
      await service.followUser('follower', 'target');
      expect(mockFollowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FollowStatus.PENDING,
        }),
      );
    });

    it('findOneByEmail: should return user when found by email', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
    });

    it('findAll: should return all users with relations and selected fields', async () => {
      const mockUsersList = [mockUser];
      mockUserRepository.find.mockResolvedValue(mockUsersList);

      const result = await service.findAll();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        relations: ['followerRelations', 'followerRelations.follower'],
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          isPublic: true,
        },
      });

      expect(result).toEqual(mockUsersList);
    });

    it('update: should call findOne after saving to return relations', async () => {
      mockUserRepository.preload.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.update('uuid-1', { fullName: 'Updated' });

      expect(result).toBeDefined();
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });

    it('unfollowUser: should remove follow if exists', async () => {
      mockFollowRepository.findOne.mockResolvedValue(mockFollow);
      await service.unfollowUser('f', 't');
      expect(mockFollowRepository.remove).toHaveBeenCalled();
    });

    it('unfollowUser: should return message if no relationship', async () => {
      mockFollowRepository.findOne.mockResolvedValue(null);
      const result = await service.unfollowUser('f', 't');
      expect(result.message).toBeDefined();
    });
  });

  describe('Follow Requests Management', () => {
    it('getPendingRequests: should return list of pending follows', async () => {
      const result = await service.getPendingRequests('id');
      expect(result).toEqual([mockFollow]);
    });

    it('acceptFollowRequest: should change status to ACCEPTED', async () => {
      mockFollowRepository.findOneBy.mockResolvedValue(mockFollow);
      await service.acceptFollowRequest('req-id');
      expect(mockFollowRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FollowStatus.ACCEPTED,
        }),
      );
    });

    it('declineFollowRequest: should remove the request', async () => {
      mockFollowRepository.findOneBy.mockResolvedValue(mockFollow);
      await service.declineFollowRequest('req-id');
      expect(mockFollowRepository.remove).toHaveBeenCalled();
    });

    it('request actions: should throw NotFound if request missing', async () => {
      mockFollowRepository.findOneBy.mockResolvedValue(null);
      await expect(service.acceptFollowRequest('id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.declineFollowRequest('id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Profile & Privacy Logic', () => {
    it('findOneProfile: should throw Forbidden if private and not owner', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        isPublic: false,
      });
      await expect(
        service.findOneProfile('uuid-1', 'other-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('findOneProfile: should allow if private but is following (accepted)', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        isPublic: false,
        followerRelations: [
          { follower: { id: 'my-id' }, status: FollowStatus.ACCEPTED },
        ],
      });
      const result = await service.findOneProfile('uuid-1', 'my-id');
      expect(result).toBeDefined();
    });

    it('searchUsers: should call find with ILike', async () => {
      await service.searchUsers('query');
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });
});
