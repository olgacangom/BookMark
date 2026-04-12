import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request as NestRequest,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClubsService } from './club.service';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

interface CreateClubDto {
  name: string;
  description: string;
  coverUrl?: string;
}

interface CreateThreadDto {
  title: string;
  relatedBookId?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  createClub(@NestRequest() req: RequestWithUser, @Body() body: CreateClubDto) {
    return this.clubsService.createClub(req.user.id, body);
  }

  @Get()
  getAllClubs() {
    return this.clubsService.findAllClubs();
  }

  @Get(':id')
  getClub(@Param('id') id: string) {
    return this.clubsService.findOneClub(id);
  }

  @Delete(':id')
  deleteClub(@NestRequest() req: RequestWithUser, @Param('id') id: string) {
    return this.clubsService.deleteClub(req.user.id, id);
  }

  @Post(':id/join')
  join(@NestRequest() req: RequestWithUser, @Param('id') id: string) {
    return this.clubsService.joinClub(req.user.id, id);
  }

  @Post(':id/threads')
  createThread(@Param('id') id: string, @Body() body: CreateThreadDto) {
    return this.clubsService.createThread(id, body);
  }

  @Get(':id/threads')
  getThreads(@Param('id') id: string) {
    return this.clubsService.findThreadsByClub(id);
  }

  @Get('threads/:threadId')
  getThread(@Param('threadId') threadId: string) {
    return this.clubsService.findOneThread(threadId);
  }

  @Post('threads/:threadId/posts')
  createPost(
    @NestRequest() req: RequestWithUser,
    @Param('threadId') threadId: string,
    @Body() body: { content: string; spoilerPage: number },
  ) {
    return this.clubsService.createPost(req.user.id, threadId, body);
  }

  @Get('threads/:threadId/posts')
  getPosts(@Param('threadId') threadId: string) {
    return this.clubsService.getThreadContent(threadId);
  }
}
