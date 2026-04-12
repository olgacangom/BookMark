import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateaway';
import { ChatService } from './chat.service';
import { Conversation } from './entitites/conversation.entity';
import { Message } from './entitites/message.entity';
import { Follow } from 'src/users/entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Follow])],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
