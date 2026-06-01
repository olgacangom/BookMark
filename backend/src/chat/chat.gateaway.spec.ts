import { ChatGateway } from './chat.gateaway';
import { ChatService } from './chat.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  const mockChatService = { saveMessage: jest.fn() } as any;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new ChatGateway(mockChatService as ChatService);
    gateway.server = mockServer;
  });

  it('handleJoinChat should make client join', async () => {
    const mockClient = { join: jest.fn() } as any;
    await gateway.handleJoinChat('conv1', mockClient);
    expect(mockClient.join).toHaveBeenCalledWith('conv1');
  });

  it('handleMessage should save and emit new_message', async () => {
    const msg = { id: 'm1', content: 'hi' };
    mockChatService.saveMessage.mockResolvedValue(msg);

    const data = { conversationId: 'c1', senderId: 'u1', content: 'hi' };

    await gateway.handleMessage(data);

    expect(mockChatService.saveMessage).toHaveBeenCalledWith(data);
    expect(mockServer.to).toHaveBeenCalledWith('c1');
    expect(mockServer.emit).toHaveBeenCalledWith('new_message', msg);
  });
});
