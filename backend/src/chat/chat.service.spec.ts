import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from './entitites/conversation.entity';
import { Message } from './entitites/message.entity';
import { Follow } from '../users/entities/follow.entity';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

type MockRepo = {
  findOne?: jest.Mock<any>;
  create?: jest.Mock<any>;
  save?: jest.Mock<any>;
  find?: jest.Mock<any>;
  update?: jest.Mock<any>;
};

const repoFactory = (): MockRepo => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

describe('ChatService', () => {
  let service: ChatService;
  let convRepo: MockRepo;
  let msgRepo: MockRepo;
  let followRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Conversation), useValue: repoFactory() },
        { provide: getRepositoryToken(Message), useValue: repoFactory() },
        { provide: getRepositoryToken(Follow), useValue: repoFactory() },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    convRepo = module.get(getRepositoryToken(Conversation));
    msgRepo = module.get(getRepositoryToken(Message));
    followRepo = module.get(getRepositoryToken(Follow));
  });

  describe('areMutuallyFollowing', () => {
    it('returns true when both follows exist', async () => {
      followRepo.findOne!.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      const res = await service.areMutuallyFollowing('a', 'b');
      expect(res).toBe(true);
    });

    it('returns false when one follow missing', async () => {
      followRepo.findOne!.mockResolvedValueOnce(null).mockResolvedValueOnce({});
      const res = await service.areMutuallyFollowing('a', 'b');
      expect(res).toBe(false);
    });
  });

  describe('getOrCreateConversation', () => {
    it('throws if not mutually following', async () => {
      jest.spyOn(service, 'areMutuallyFollowing').mockResolvedValue(false);
      await expect(service.getOrCreateConversation('a', 'b')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns existing conversation if found', async () => {
      jest.spyOn(service, 'areMutuallyFollowing').mockResolvedValue(true);
      convRepo.findOne!.mockResolvedValue({ id: 'c1' });
      const res = await service.getOrCreateConversation('a', 'b');
      expect(convRepo.findOne).toHaveBeenCalled();
      expect(res).toEqual({ id: 'c1' });
    });

    it('creates new conversation if missing', async () => {
      jest.spyOn(service, 'areMutuallyFollowing').mockResolvedValue(true);
      convRepo.findOne!.mockResolvedValue(null);
      convRepo.create!.mockReturnValue({
        userOne: { id: 'a' },
        userTwo: { id: 'b' },
      });
      convRepo.save!.mockResolvedValue({ id: 'new' });

      const res = await service.getOrCreateConversation('a', 'b');
      expect(convRepo.create).toHaveBeenCalled();
      expect(convRepo.save).toHaveBeenCalled();
      expect(res).toEqual({ id: 'new' });
    });
  });

  describe('saveMessage', () => {
    it('saves message and updates conversation', async () => {
      msgRepo.create!.mockReturnValue({});
      msgRepo.save!.mockResolvedValue({ id: 'm1' });
      convRepo.update!.mockResolvedValue({});

      const res = await service.saveMessage({
        conversationId: 'c1',
        senderId: 'u1',
        content: 'hi',
      });
      expect(msgRepo.create).toHaveBeenCalled();
      expect(msgRepo.save).toHaveBeenCalled();
      expect(convRepo.update).toHaveBeenCalledWith('c1', expect.any(Object));
      expect(res).toEqual({ id: 'm1' });
    });
  });

  describe('getMessages', () => {
    it('throws if conversation missing', async () => {
      convRepo.findOne!.mockResolvedValue(null);
      await expect(service.getMessages('c1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns messages when conversation exists', async () => {
      convRepo.findOne!.mockResolvedValue({ id: 'c1' });
      msgRepo.find!.mockResolvedValue([{ id: 'm1' }]);
      const res = await service.getMessages('c1', 'u1');
      expect(msgRepo.find).toHaveBeenCalled();
      expect(res).toEqual([{ id: 'm1' }]);
    });
  });

  describe('listConversations', () => {
    it('maps conversations and unreadCount', async () => {
      convRepo.find!.mockResolvedValue([
        {
          id: 'c1',
          userOne: { id: 'a' },
          userTwo: { id: 'b' },
          lastActivity: new Date(),
          messages: [
            { isRead: false, sender: { id: 'b' } },
            { isRead: true, sender: { id: 'b' } },
          ],
        },
      ]);

      const res = await service.listConversations('a');
      expect(res[0].unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('updates messages and returns success', async () => {
      msgRepo.update!.mockResolvedValue({});
      const res = await service.markAsRead('c1', 'u1');
      expect(msgRepo.update).toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });
  });
});
