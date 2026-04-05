import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { Activity } from './entities/activity.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Activity])],
  controllers: [UsersController, ActivitiesController],
  providers: [UsersService, ActivitiesService],
  exports: [UsersService, ActivitiesService],
})
export class UsersModule {}
