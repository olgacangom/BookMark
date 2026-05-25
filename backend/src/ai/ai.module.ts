import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { Book } from '../books/entities/book.entity';
import { BookListing } from 'src/users/entities/book-listing.entity';
import { LibraryEvent } from 'src/users/entities/library-event.entity';
import { Club } from 'src/club/entities/club.entity';
import { User } from 'src/users/entities/user.entity';
import { Activity } from 'src/users/entities/activity.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import { AdminService } from 'src/users/roles/admin.service';
import { SustainabilityRequest } from 'src/users/entities/sustainability-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Book,
      Activity,
      BookListing,
      LibraryEvent,
      EventRegistration,
      Club,
      SustainabilityRequest,
    ]),
  ],
  controllers: [AIController],
  providers: [AIService, AdminService],
  exports: [AdminService],
})
export class AIModule {}
