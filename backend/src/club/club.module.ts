import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { Thread } from './entities/thread.entity';
import { ThreadPost } from './entities/thread-post.entity';
import { ClubsService } from './club.service';
import { ClubsController } from './club.controller';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { ClubsGateway } from './club.gateaway';

@Module({
  imports: [TypeOrmModule.forFeature([Club, Thread, ThreadPost, User, Book])],
  controllers: [ClubsController],
  providers: [ClubsService, ClubsGateway],
})
export class ClubsModule {}
