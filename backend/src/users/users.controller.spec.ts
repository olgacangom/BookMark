import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

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
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    jest.clearAllMocks();
  });

  it('should call getPendingRequests with user id', async () => {
    const req = { user: { id: 'abc' } } as any;

    await controller.getRequests(req);

    expect(service.getPendingRequests).toHaveBeenCalledWith('abc');
  });

  it('should search users', async () => {
    await controller.search('term');

    expect(service.searchUsers).toHaveBeenCalledWith('term');
  });

  it('should update profile', async () => {
    const req = { user: { id: 'abc' } } as any;
    const dto = { fullName: 'New Name' };

    await controller.updateProfile(req, dto as any);

    expect(service.update).toHaveBeenCalledWith('abc', dto);
  });

  it('should upload avatar and build URL correctly', async () => {
    const file = { filename: 'avatar.png' } as any;
    const req = { user: { id: 'user-1' } } as any;

    await controller.uploadAvatar(file, req);

    expect(service.updateAvatar).toHaveBeenCalledWith(
      'user-1',
      'http://localhost:3000/uploads/avatars/avatar.png',
    );
  });

  it('should delete avatar', async () => {
    const req = { user: { id: 'user-1' } } as any;

    await controller.deleteAvatar(req);

    expect(service.deleteAvatar).toHaveBeenCalledWith('user-1');
  });

  it('should deactivate account', async () => {
    const req = { user: { id: 'user-1' } } as any;

    await controller.deactivateMyAccount(req as any);

    expect(service.deactivateAccount).toHaveBeenCalledWith('user-1');
  });

  it('should follow and unfollow users', async () => {
    const req = { user: { id: 'user-1' } } as any;

    await controller.follow(req, 'target-1');
    await controller.unfollow(req, 'target-2');

    expect(service.followUser).toHaveBeenCalledWith('user-1', 'target-1');
    expect(service.unfollowUser).toHaveBeenCalledWith('user-1', 'target-2');
  });

  it('should accept and decline follow requests', async () => {
    await controller.acceptRequest('req-1');
    await controller.declineRequest('req-2');

    expect(service.acceptFollowRequest).toHaveBeenCalledWith('req-1');
    expect(service.declineFollowRequest).toHaveBeenCalledWith('req-2');
  });

  it('should get profile correctly', async () => {
    const req = { user: { id: 'me' } } as any;

    await controller.getProfile(req, 'target');

    expect(service.findOneProfile).toHaveBeenCalledWith('target', 'me');
  });

  it('should call CRUD methods', async () => {
    await controller.findAll();
    await controller.findOne('1');
    await controller.update('2', { bio: 'test' } as any);
    await controller.remove('3');
    await controller.create({ email: 'a@a.com', password: '123' } as any);

    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(service.update).toHaveBeenCalledWith('2', { bio: 'test' });
    expect(service.remove).toHaveBeenCalledWith('3');
    expect(service.create).toHaveBeenCalledWith({
      email: 'a@a.com',
      password: '123',
    });
  });

  it('should get growth stats', async () => {
    const req = { user: { id: 'user-1' } } as any;

    await controller.getGrowth(req);

    expect(service.getBooksGrowth).toHaveBeenCalledWith('user-1');
  });
});