import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('ChatController', () => {
  let controller: ChatController;

  const mockService = {
    listConversations: jest.fn(),
    getMessages: jest.fn(),
    getOrCreateConversation: jest.fn(),
    markAsRead: jest.fn(),
  } as any;

  const mockReq = { user: { id: 'user-1', email: 'a@b' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('getConversations should call service', () => {
    controller.getConversations(mockReq);
    expect(mockService.listConversations).toHaveBeenCalledWith('user-1');
  });

  it('getMessages should call service', () => {
    controller.getMessages('conv1', mockReq);
    expect(mockService.getMessages).toHaveBeenCalledWith('conv1', 'user-1');
  });

  it('startConversation should call service', () => {
    controller.startConversation(mockReq, 'target');
    expect(mockService.getOrCreateConversation).toHaveBeenCalledWith('user-1', 'target');
  });

  it('markAsRead should call service', async () => {
    mockService.markAsRead.mockResolvedValue({ success: true });
    const res = await controller.markAsRead('conv1', mockReq);
    expect(mockService.markAsRead).toHaveBeenCalledWith('conv1', 'user-1');
    expect(res).toEqual({ success: true });
  });
});
