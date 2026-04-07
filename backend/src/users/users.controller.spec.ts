import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

interface GrowthData {
  month: string;
  count: number | string;
}

type MockType<T> = {
  [P in keyof T]?: jest.Mock<(...args: any[]) => any>;
};

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService: MockType<UsersService> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    searchUsers: jest.fn(),
    getPendingRequests: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    acceptFollowRequest: jest.fn(),
    declineFollowRequest: jest.fn(),
    findOneProfile: jest.fn(),
    getBooksGrowth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Rutas Estáticas y Perfil', () => {
    it('getRequests: should call getPendingRequests with user id', async () => {
      const mockReq = {
        user: { id: 'uuid-1', email: 'olga@test.com' },
      } as unknown as RequestWithUser;
      mockUsersService.getPendingRequests?.mockResolvedValue([]);
      const result = await controller.getRequests(mockReq);
      expect(result).toEqual([]);
      expect(mockUsersService.getPendingRequests).toHaveBeenCalledWith(
        'uuid-1',
      );
    });

    it('search: should call searchUsers with query string', async () => {
      const query = 'olga';
      mockUsersService.searchUsers?.mockResolvedValue([]);
      const result = await controller.search(query);
      expect(result).toEqual([]);
      expect(mockUsersService.searchUsers).toHaveBeenCalledWith(query);
    });

    it('updateProfile: should call service update with authenticated user id', async () => {
      const mockReq = {
        user: { id: 'uuid-auth', email: 'olga@test.com' },
      } as unknown as RequestWithUser;
      const dto: UpdateUserDto = { fullName: 'Nuevo Nombre' };
      mockUsersService.update?.mockResolvedValue({ id: 'uuid-auth', ...dto });
      const result = await controller.updateProfile(mockReq, dto);
      expect(result).toBeDefined();
      expect(mockUsersService.update).toHaveBeenCalledWith('uuid-auth', dto);
    });
  });

  describe('Rutas de Acción Social (Follow System)', () => {
    const mockReq = {
      user: { id: 'my-id', email: 'olga@test.com' },
    } as unknown as RequestWithUser;
    const targetId = 'target-id';

    it('follow: should call followUser', async () => {
      mockUsersService.followUser?.mockResolvedValue({ status: 'PENDING' });
      await controller.follow(mockReq, targetId);
      expect(mockUsersService.followUser).toHaveBeenCalledWith(
        'my-id',
        targetId,
      );
    });

    it('unfollow: should call unfollowUser', async () => {
      mockUsersService.unfollowUser?.mockResolvedValue({ message: 'OK' });
      await controller.unfollow(mockReq, targetId);
      expect(mockUsersService.unfollowUser).toHaveBeenCalledWith(
        'my-id',
        targetId,
      );
    });

    it('acceptRequest: should call acceptFollowRequest', async () => {
      const requestId = 'req-123';
      mockUsersService.acceptFollowRequest?.mockResolvedValue({
        status: 'ACCEPTED',
      });
      await controller.acceptRequest(requestId);
      expect(mockUsersService.acceptFollowRequest).toHaveBeenCalledWith(
        requestId,
      );
    });

    it('declineRequest: should call declineFollowRequest', async () => {
      const requestId = 'req-123';
      mockUsersService.declineFollowRequest?.mockResolvedValue({
        deleted: true,
      });
      await controller.declineRequest(requestId);
      expect(mockUsersService.declineFollowRequest).toHaveBeenCalledWith(
        requestId,
      );
    });
  });

  describe('Estadísticas y Analítica', () => {
    it('getGrowth: should call getBooksGrowth with user id from req', async () => {
      const mockReq = {
        user: { id: 'user-stats-1', email: 'stats@test.com' },
      } as unknown as RequestWithUser;

      const mockData: GrowthData[] = [{ month: '2026-04', count: 5 }];
      mockUsersService.getBooksGrowth?.mockResolvedValue(mockData);

      const result = await controller.getGrowth(mockReq);

      expect(result).toEqual(mockData);
      expect(mockUsersService.getBooksGrowth).toHaveBeenCalledWith(
        'user-stats-1',
      );
    });
  });

  describe('Rutas Dinámicas y CRUD', () => {
    it('getProfile: should call findOneProfile with requester id', async () => {
      const mockReq = {
        user: { id: 'my-id', email: 'olga@test.com' },
      } as unknown as RequestWithUser;
      const targetId = 'target-id';
      mockUsersService.findOneProfile?.mockResolvedValue({ id: targetId });
      await controller.getProfile(mockReq, targetId);
      expect(mockUsersService.findOneProfile).toHaveBeenCalledWith(
        targetId,
        'my-id',
      );
    });

    it('findAll: should return all users', async () => {
      mockUsersService.findAll?.mockResolvedValue([]);
      expect(await controller.findAll()).toEqual([]);
    });

    it('findOne: should return a user by id', async () => {
      mockUsersService.findOne?.mockResolvedValue({ id: '1' });
      expect(await controller.findOne('1')).toEqual({ id: '1' });
    });

    it('update: should call service update for a specific id', async () => {
      const dto: UpdateUserDto = { fullName: 'Test' };
      mockUsersService.update?.mockResolvedValue({ id: '1', ...dto });
      const result = await controller.update('1', dto);
      expect(result).toBeDefined();
      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
    });

    it('remove: should call service remove', async () => {
      mockUsersService.remove?.mockResolvedValue({ success: true });
      expect(await controller.remove('1')).toEqual({ success: true });
    });

    it('create: should call service create', async () => {
      const dto: CreateUserDto = {
        email: 'a@a.com',
        password: '123',
        fullName: 'A',
      };
      mockUsersService.create?.mockResolvedValue({ id: '1', ...dto });
      const result = await controller.create(dto);
      expect(result).toBeDefined();
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });
});
