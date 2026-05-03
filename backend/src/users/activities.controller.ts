import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Post,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Crea una publicación manual del usuario (POST)
   */
  @Post()
  async create(
    @Body() createDto: CreateActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.createPost(req.user.id, createDto);
  }

  @Get('feed')
  async getFeed(@Request() req: RequestWithUser) {
    return this.activitiesService.getFeed(req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.activitiesService.remove(req.user.id, id);
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.activitiesService.toggleLike(req.user.id, id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.addComment(req.user.id, id, text);
  }

  @Post(':id/ignore')
  async ignoreActivity(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.ignoreActivity(req.user.id, id);
  }
}
