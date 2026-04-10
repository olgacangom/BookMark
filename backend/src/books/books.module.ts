import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './entities/book.entity';
import { GoogleBooksService } from './google-books/google-books.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), UsersModule],
  controllers: [BooksController],
  providers: [BooksService, GoogleBooksService],
  exports: [BooksService],
})
export class BooksModule {}
