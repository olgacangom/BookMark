import { Test, TestingModule } from '@nestjs/testing';
import { ClubsController } from './club.controller';
import { ClubsService } from './club.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('ClubsController', () => {
  let controller: ClubsController;
  const mockService = {
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
  };

  const mockReq = { user: { id: 'user-1', email: 'test@example.com' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClubsController],
      providers: [{ provide: ClubsService, useValue: mockService }],
    }).compile();

    controller = module.get<ClubsController>(ClubsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createClub should delegate to service', () => {
    const body = { name: 'Club', description: 'Desc' };
    controller.createClub(mockReq, body);
    expect(mockService.createClub).toHaveBeenCalledWith('user-1', body);
  });

  it('updateClub should delegate to service', () => {
    const body = { name: 'Club', description: 'Desc' };
    controller.updateClub(mockReq, 'club1', body);
    expect(mockService.updateClub).toHaveBeenCalledWith('user-1', 'club1', body);
  });

  it('getAllClubs should delegate to service', () => {
    controller.getAllClubs();
    expect(mockService.findAllClubs).toHaveBeenCalled();
  });

  it('getClub should delegate to service', () => {
    controller.getClub('club1');
    expect(mockService.findOneClub).toHaveBeenCalledWith('club1');
  });

  it('deleteClub should delegate to service', () => {
    controller.deleteClub(mockReq, 'club1');
    expect(mockService.deleteClub).toHaveBeenCalledWith('user-1', 'club1');
  });

  it('join should delegate to service', () => {
    controller.join(mockReq, 'club1');
    expect(mockService.joinClub).toHaveBeenCalledWith('user-1', 'club1');
  });

  it('createThread should delegate to service', () => {
    const body = { title: 'Thread' };
    controller.createThread('club1', body);
    expect(mockService.createThread).toHaveBeenCalledWith('club1', body);
  });

  it('getThreads should delegate to service', () => {
    controller.getThreads('club1');
    expect(mockService.findThreadsByClub).toHaveBeenCalledWith('club1');
  });

  it('getThread should delegate to service', () => {
    controller.getThread('thread1');
    expect(mockService.findOneThread).toHaveBeenCalledWith('thread1');
  });

  it('createPost should delegate to service', () => {
    const body = { content: 'Hello', spoilerPage: 1 };
    controller.createPost(mockReq, 'thread1', body);
    expect(mockService.createPost).toHaveBeenCalledWith('user-1', 'thread1', body);
  });

  it('getPosts should delegate to service', () => {
    controller.getPosts('thread1');
    expect(mockService.getThreadContent).toHaveBeenCalledWith('thread1');
  });
});
