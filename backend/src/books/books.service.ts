import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GoogleBooksService } from './google-books/google-books.service';
import { ActivitiesService } from 'src/users/activities.service';
import { ActivityType } from 'src/users/entities/activity.entity';
import { BookStatus } from './enum/book-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BooksService {
  constructor(
    private eventEmitter: EventEmitter2,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly googleBooksService: GoogleBooksService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async searchByIsbn(isbn: string) {
    return this.googleBooksService.findByIsbn(isbn);
  }

  async create(createBookDto: CreateBookDto, userId: string) {
    const newBook = this.bookRepository.create({
      ...createBookDto,
      userId: userId,
    });

    const savedBook = await this.bookRepository.save(newBook);

    try {
      await this.activitiesService.create(
        userId,
        ActivityType.BOOK_ADDED,
        savedBook.id.toString(),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al registrar actividad:', message);
    }

    return savedBook;
  }

  async findAll(userId: string) {
    return await this.bookRepository.find({
      where: { userId },
      order: { title: 'ASC' },
    });
  }

  async findOne(id: number, userId: string) {
    const book = await this.bookRepository.findOne({
      where: { id, userId },
    });
    if (!book) throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto, userId: string) {
    const book = await this.findOne(id, userId);
    const oldStatus = book.status;

    const fields: (keyof UpdateBookDto)[] = [
      'title',
      'author',
      'status',
      'genre',
      'description',
      'pageCount',
      'urlPortada',
      'rating',
      'review',
    ];
    fields.forEach((field) => {
      const value = updateBookDto[field];
      if (value !== undefined) (book[field as keyof Book] as any) = value;
    });

    const updatedBook = await this.bookRepository.save(book);

    if (
      updateBookDto.status === BookStatus.READ &&
      oldStatus !== BookStatus.READ
    ) {
      console.log('📢 EMITIENDO EVENTO book.finished para el usuario:', userId);
      this.eventEmitter.emit('book.finished', { userId, points: 150 });
    }

    return updatedBook;
  }

  async remove(id: number, userId: string) {
    const book = await this.findOne(id, userId);
    await this.bookRepository.remove(book);
    return { deleted: true };
  }
}
