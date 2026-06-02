import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { User, UserRole } from './entities/user.entity';

interface MockRequest {
  user: {
    id: string;
    email: string;
  };
}

const USER_ID = 'abc';
const TARGET_ID = 'target-1';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const usersServiceMock = {
    getPendingRequests: jest.fn(),
    searchUsers: jest.fn(),
    update: jest.fn(),
    updateAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    deactivateAccount: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    acceptFollowRequest: jest.fn(),
    declineFollowRequest: jest.fn(),
    findOneProfile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    getBooksGrowth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('should call getPendingRequests with user id', async () => {
    const req: MockRequest = {
      user: {
        id: 'abc',
        email: 'test@test.com',
      },
    };
    await controller.getRequests(req);
    expect(service.getPendingRequests).toHaveBeenCalledWith('abc');
  });

  it('should search users', async () => {
    await controller.search('term');

    expect(service.searchUsers).toHaveBeenCalledWith('term');
  });

  it('should update profile', async () => {
    const req: MockRequest = {
      user: {
        id: 'abc',
        email: 'test@test.com',
      },
    };
    const dto = { fullName: 'New Name' };

    await controller.updateProfile(req, dto);
    expect(service.update).toHaveBeenCalledWith('abc', dto);
  });

  it('should upload avatar', async () => {
    const file: Partial<Express.Multer.File> = {
      filename: 'avatar.png',
    };
    const req: MockRequest = {
      user: {
        id: USER_ID,
        email: 'test@test.com',
      },
    };
    await controller.uploadAvatar(file as Express.Multer.File, req);
    expect(service.updateAvatar).toHaveBeenCalledWith(
      USER_ID,
      expect.stringContaining('avatar.png'),
    );
  });

  it('should delete avatar', async () => {
    const req = {
      user: {
        id: USER_ID,
      } as User,
    };
    await controller.deleteAvatar(req);
    expect(service.deleteAvatar).toHaveBeenCalledWith(USER_ID);
  });

  it('should deactivate account', async () => {
    const req = {
      user: {
        id: USER_ID,
      } as User,
    };
    await controller.deactivateMyAccount(req);
    expect(service.deactivateAccount).toHaveBeenCalledWith(USER_ID);
  });

  it('should follow and unfollow users', async () => {
    const req: MockRequest = {
      user: {
        id: USER_ID,
        email: 'test@test.com',
      },
    };
    await controller.follow(req, TARGET_ID);
    await controller.unfollow(req, TARGET_ID);

    expect(service.followUser).toHaveBeenCalledWith(USER_ID, TARGET_ID);
    expect(service.unfollowUser).toHaveBeenCalledWith(USER_ID, TARGET_ID);
  });

  it('should accept and decline follow requests', async () => {
    await controller.acceptRequest('req-1');
    await controller.declineRequest('req-2');

    expect(service.acceptFollowRequest).toHaveBeenCalledWith('req-1');
    expect(service.declineFollowRequest).toHaveBeenCalledWith('req-2');
  });

  it('should get profile correctly', async () => {
    const req: MockRequest = {
      user: {
        id: USER_ID,
        email: 'test@test.com',
      },
    };
    await controller.getProfile(req, 'target');
    expect(service.findOneProfile).toHaveBeenCalledWith('target', USER_ID);
  });

  it('should call CRUD methods', async () => {
    await controller.findAll();
    await controller.findOne('1');

    const updateDto: UpdateUserDto = { bio: 'test' };
    await controller.update('2', updateDto);
    await controller.remove('3');

    const registerDto: RegisterDto = {
      email: 'a@a.com',
      password: '123',
      fullName: 'Test',
      province: 'Sevilla',
      role: UserRole.USER,
    };
    await controller.create(registerDto);

    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(service.update).toHaveBeenCalledWith('2', updateDto);
    expect(service.remove).toHaveBeenCalledWith('3');

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@a.com',
        password: '123',
      }),
    );
  });

  it('should get growth stats', async () => {
    const req: MockRequest = {
      user: {
        id: USER_ID,
        email: 'test@test.com',
      },
    };
    await controller.getGrowth(req);
    expect(service.getBooksGrowth).toHaveBeenCalledWith(USER_ID);
  });
});
