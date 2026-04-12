import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    // Añadido async
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(conversationId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      content: string;
    },
  ) {
    const savedMessage = await this.chatService.saveMessage(data);

    this.server.to(data.conversationId).emit('new_message', savedMessage);
  }
}
