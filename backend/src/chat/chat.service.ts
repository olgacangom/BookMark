import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Follow, FollowStatus } from '../users/entities/follow.entity';
import { Message } from './entitites/message.entity';
import { Conversation } from './entitites/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
  ) {}

  async areMutuallyFollowing(
    userAId: string,
    userBId: string,
  ): Promise<boolean> {
    const followAtoB = await this.followRepo.findOne({
      where: {
        follower: { id: userAId },
        following: { id: userBId },
        status: FollowStatus.ACCEPTED,
      },
    });
    const followBtoA = await this.followRepo.findOne({
      where: {
        follower: { id: userBId },
        following: { id: userAId },
        status: FollowStatus.ACCEPTED,
      },
    });

    return !!(followAtoB && followBtoA);
  }

  async getOrCreateConversation(userOneId: string, userTwoId: string) {
    const canChat = await this.areMutuallyFollowing(userOneId, userTwoId);
    if (!canChat) {
      throw new ForbiddenException(
        'Solo puedes enviar mensajes a usuarios con seguimiento mutuo.',
      );
    }

    let conversation = await this.conversationRepo.findOne({
      where: [
        { userOne: { id: userOneId }, userTwo: { id: userTwoId } },
        { userOne: { id: userTwoId }, userTwo: { id: userOneId } },
      ],
      relations: ['userOne', 'userTwo'],
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        userOne: { id: userOneId },
        userTwo: { id: userTwoId },
      });
      await this.conversationRepo.save(conversation);
    }

    return conversation;
  }

  async saveMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    const message = this.messageRepo.create({
      content: data.content,
      conversation: { id: data.conversationId },
      sender: { id: data.senderId },
    });

    const savedMessage = await this.messageRepo.save(message);

    await this.conversationRepo.update(data.conversationId, {
      lastActivity: new Date(),
    });

    return savedMessage;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: [
        { id: conversationId, userOne: { id: userId } },
        { id: conversationId, userTwo: { id: userId } },
      ],
    });

    if (!conversation)
      throw new ForbiddenException('No tienes acceso a este chat');

    return this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }

  async listConversations(userId: string) {
    const conversations = await this.conversationRepo.find({
      where: [{ userOne: { id: userId } }, { userTwo: { id: userId } }],
      relations: ['userOne', 'userTwo', 'messages', 'messages.sender'],
      order: { lastActivity: 'DESC' },
    });

    return conversations.map((conv) => {
      const unreadCount = conv.messages.filter(
        (msg) => !msg.isRead && msg.sender.id !== userId,
      ).length;

      return {
        id: conv.id,
        userOne: conv.userOne,
        userTwo: conv.userTwo,
        lastActivity: conv.lastActivity,
        unreadCount,
      };
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.messageRepo.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(userId) },
        isRead: false,
      },
      { isRead: true },
    );
    return { success: true };
  }
}
