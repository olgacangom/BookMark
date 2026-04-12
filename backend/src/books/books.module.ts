import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './entities/book.entity';
import { GoogleBooksService } from './google-books/google-books.service';
import { UsersModule } from 'src/users/users.module';
import { NotesController } from './notes.controller';
import { Note } from './entities/note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Note]), UsersModule],
  controllers: [BooksController, NotesController],
  providers: [BooksService, GoogleBooksService],
  exports: [BooksService],
})
export class BooksModule {}
