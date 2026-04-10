import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { Activity } from './entities/activity.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { UserStats } from './entities/user-stats.entity';
import { GamificationListener } from './gamification.listener';
import { Badge } from './badge.entity';
import { ActivityLike } from './entities/activity-like.entity';
import { ActivityComment } from './entities/activity-comment';
import { ActivityIgnore } from './entities/activity-ignore.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Follow,
      Activity,
      UserStats,
      Badge,
      ActivityLike,
      ActivityComment,
      ActivityIgnore,
    ]),
  ],
  controllers: [UsersController, ActivitiesController],
  providers: [UsersService, ActivitiesService, GamificationListener],
  exports: [UsersService, ActivitiesService],
})
export class UsersModule {}
