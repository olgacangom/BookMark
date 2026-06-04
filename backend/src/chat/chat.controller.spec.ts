import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: { id: string; email: string };
}

describe('ChatController', () => {
  let controller: ChatController;
  let mockService: jest.Mocked<ChatService>;

  const mockReq: RequestWithUser = {
    user: { id: 'user-1', email: 'test@example.com' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const serviceMock = {
      listConversations: jest.fn(),
      getMessages: jest.fn(),
      getOrCreateConversation: jest.fn(),
      markAsRead: jest.fn(),
    } as unknown as jest.Mocked<ChatService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    mockService = module.get(ChatService);
  });

  it('getConversations should call service', async () => {
    await controller.getConversations(mockReq);
    expect(mockService.listConversations).toHaveBeenCalledWith('user-1');
  });

  it('getMessages should call service', async () => {
    await controller.getMessages('conv1', mockReq);
    expect(mockService.getMessages).toHaveBeenCalledWith('conv1', 'user-1');
  });

  it('startConversation should call service', async () => {
    await controller.startConversation(mockReq, 'target');
    expect(mockService.getOrCreateConversation).toHaveBeenCalledWith(
      'user-1',
      'target',
    );
  });

  it('markAsRead should call service', async () => {
    mockService.markAsRead.mockResolvedValue({ success: true });

    const res = await controller.markAsRead('conv1', mockReq);

    expect(mockService.markAsRead).toHaveBeenCalledWith('conv1', 'user-1');
    expect(res).toEqual({ success: true });
  });
});
