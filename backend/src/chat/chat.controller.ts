import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/users/roles/roles.decorator';
import { RolesGuard } from 'src/users/roles/roles.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Request() req: RequestWithUser) {
    return this.chatService.listConversations(req.user.id);
  }

  @Get('messages/:conversationId')
  getMessages(
    @Param('conversationId') convId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.getMessages(convId, req.user.id);
  }

  @Post('conversation/:targetUserId')
  startConversation(
    @Request() req: RequestWithUser,
    @Param('targetUserId') targetId: string,
  ) {
    return this.chatService.getOrCreateConversation(req.user.id, targetId);
  }

  @Patch('read/:conversationId')
  async markAsRead(
    @Param('conversationId') convId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.markAsRead(convId, req.user.id);
  }
}
