import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { Badge } from './badge.entity';

@Injectable()
export class GamificationListener {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  @OnEvent('book.finished')
  async handleBookFinished(payload: { userId: string; points: number }) {
    console.log(
      `🎯 Listener: Procesando libro terminado para el usuario ${payload.userId}`,
    );

    try {
      await this.usersService.addExperience(payload.userId, payload.points);
      await this.usersService.updateStreak(payload.userId);

      const user = await this.usersService.findOne(payload.userId);

      const finishedCount = user.stats?.totalBooksFinished || 0;
      console.log(
        `📊 Usuario ${user.fullName} lleva ${finishedCount} libros leídos y ${user.stats?.xp} XP`,
      );

      const allBadges = await this.badgeRepository.find();
      const userBadgeIds = user.badges?.map((b) => b.id) || [];

      for (const badge of allBadges) {
        const alreadyHasIt = userBadgeIds.includes(badge.id);

        if (!alreadyHasIt && badge.requirementType === 'BOOKS_READ') {
          if (finishedCount >= badge.requirementValue) {
            console.log(`🏅 ¡DESBLOQUEO! Asignando medalla: ${badge.name}`);
            await this.usersService.assignBadge(user.id, badge.id);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en GamificationListener:', error);
    }
  }
}
