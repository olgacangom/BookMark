import { Module } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { BookstoreController } from './bookstore.controller';

@Module({
  controllers: [BookstoreController],
  providers: [BookstoreService],
})
export class BookstoreModule {}
