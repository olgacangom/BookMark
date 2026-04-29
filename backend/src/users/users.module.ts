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
import { Club } from 'src/club/entities/club.entity';
import { AdminController, LibreroController } from './roles/roles.controller';
import { AdminService } from './roles/admin.service';
import { Book } from 'src/books/entities/book.entity';
import { StoreInventory } from './entities/store-inventory.entity';
import { LibraryEvent } from './entities/library-event.entity';
import { LibrerosService } from './roles/libreros.service';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import { BookListing } from './entities/book-listing.entity';
import { DonationPoint } from './entities/donation-point.entity';
import { SustainabilityService } from './sustainability/sustainability.service';
import { SustainabilityController } from './sustainability/sustainability.controller';
import { SustainabilityRequest } from './entities/sustainability-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Follow,
      Activity,
      UserStats,
      StoreInventory,
      LibraryEvent,
      EventRegistration,
      Badge,
      ActivityLike,
      ActivityComment,
      ActivityIgnore,
      Club,
      Book,
      BookListing,
      DonationPoint,
      SustainabilityRequest,
    ]),
  ],
  controllers: [
    UsersController,
    ActivitiesController,
    AdminController,
    LibreroController,
    SustainabilityController,
  ],
  providers: [
    UsersService,
    ActivitiesService,
    GamificationListener,
    AdminService,
    LibrerosService,
    SustainabilityService,
  ],
  exports: [UsersService, ActivitiesService],
})
export class UsersModule {}
