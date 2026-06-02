import { Test, TestingModule } from '@nestjs/testing';
import { ClubsController } from './club.controller';
import { ClubsService } from './club.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: { id: string; email: string };
}

describe('ClubsController', () => {
  let controller: ClubsController;
  let mockService: jest.Mocked<ClubsService>;

  const mockReq: RequestWithUser = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const serviceMock = {
      createClub: jest.fn(),
      updateClub: jest.fn(),
      findAllClubs: jest.fn(),
      findOneClub: jest.fn(),
      deleteClub: jest.fn(),
      joinClub: jest.fn(),
      createThread: jest.fn(),
      findThreadsByClub: jest.fn(),
      findOneThread: jest.fn(),
      createPost: jest.fn(),
      getThreadContent: jest.fn(),
    } as unknown as jest.Mocked<ClubsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClubsController],
      providers: [{ provide: ClubsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ClubsController>(ClubsController);
    mockService = module.get(ClubsService);
  });

  it('createClub should delegate to service', async () => {
    const body = { name: 'Club', description: 'Desc' };
    await controller.createClub(mockReq, body);
    expect(mockService.createClub).toHaveBeenCalledWith('user-1', body);
  });

  it('updateClub should delegate to service', async () => {
    const body = { name: 'Club', description: 'Desc' };
    await controller.updateClub(mockReq, 'club1', body);
    expect(mockService.updateClub).toHaveBeenCalledWith(
      'user-1',
      'club1',
      body,
    );
  });

  it('getAllClubs should delegate to service', async () => {
    await controller.getAllClubs();
    expect(mockService.findAllClubs).toHaveBeenCalled();
  });

  it('getClub should delegate to service', async () => {
    await controller.getClub('club1');
    expect(mockService.findOneClub).toHaveBeenCalledWith('club1');
  });

  it('deleteClub should delegate to service', async () => {
    await controller.deleteClub(mockReq, 'club1');
    expect(mockService.deleteClub).toHaveBeenCalledWith('user-1', 'club1');
  });

  it('join should delegate to service', async () => {
    await controller.join(mockReq, 'club1');
    expect(mockService.joinClub).toHaveBeenCalledWith('user-1', 'club1');
  });

  it('createThread should delegate to service', async () => {
    const body = { title: 'Thread' };
    await controller.createThread('club1', body);
    expect(mockService.createThread).toHaveBeenCalledWith('club1', body);
  });

  it('getThreads should delegate to service', async () => {
    await controller.getThreads('club1');
    expect(mockService.findThreadsByClub).toHaveBeenCalledWith('club1');
  });

  it('getThread should delegate to service', async () => {
    await controller.getThread('thread1');
    expect(mockService.findOneThread).toHaveBeenCalledWith('thread1');
  });

  it('createPost should delegate to service', async () => {
    const body = { content: 'Hello', spoilerPage: 1 };
    await controller.createPost(mockReq, 'thread1', body);
    expect(mockService.createPost).toHaveBeenCalledWith(
      'user-1',
      'thread1',
      body,
    );
  });

  it('getPosts should delegate to service', async () => {
    await controller.getPosts('thread1');
    expect(mockService.getThreadContent).toHaveBeenCalledWith('thread1');
  });
});
