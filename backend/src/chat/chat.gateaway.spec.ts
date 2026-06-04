import { ChatGateway } from './chat.gateaway';
import { ChatService } from './chat.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Socket, Server } from 'socket.io';
import { Message } from './entitites/message.entity';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockChatService: jest.Mocked<ChatService>;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Server;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChatService = {
      saveMessage: jest.fn(),
      areMutuallyFollowing: jest.fn(),
      getOrCreateConversation: jest.fn(),
      getMessages: jest.fn(),
      listConversations: jest.fn(),
      markAsRead: jest.fn(),
    } as unknown as jest.Mocked<ChatService>;

    gateway = new ChatGateway(mockChatService);
    gateway.server = mockServer;
  });

  it('handleJoinChat should make client join', async () => {
    const mockClient = { join: jest.fn() } as unknown as Socket;

    await gateway.handleJoinChat('conv1', mockClient);

    expect(mockClient.join).toHaveBeenCalledWith('conv1');
  });

  it('handleMessage should save and emit new_message', async () => {
    const msg: Message = {
      id: 'm1',
      content: 'hi',
      sender: { id: 'u1' },
      conversation: { id: 'c1' },
      isRead: false,
      createdAt: new Date(),
    } as unknown as Message;

    mockChatService.saveMessage.mockResolvedValue(msg);
    const data = { conversationId: 'c1', senderId: 'u1', content: 'hi' };
    await gateway.handleMessage(data);

    expect(mockChatService.saveMessage).toHaveBeenCalledWith(data);
    expect(mockServer.to).toHaveBeenCalledWith('c1');
    expect(mockServer.emit).toHaveBeenCalledWith('new_message', msg);
  });
});
