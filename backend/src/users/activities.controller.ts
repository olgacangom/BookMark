import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
   * Obtiene el feed de actividad para el usuario autenticado.
   * Incluye actividades de los usuarios seguidos y las propias.
   */

  @Get('feed')
  async getFeed(@Request() req: RequestWithUser) {
    return this.activitiesService.getFeed(req.user.id);
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
