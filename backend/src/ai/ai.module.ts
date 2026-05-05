import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { Book } from '../books/entities/book.entity';
import { BookListing } from 'src/users/entities/book-listing.entity';
import { LibraryEvent } from 'src/users/entities/library-event.entity';
import { Club } from 'src/club/entities/club.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookListing, LibraryEvent, Club])],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
