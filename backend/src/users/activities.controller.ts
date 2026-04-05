import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
}
