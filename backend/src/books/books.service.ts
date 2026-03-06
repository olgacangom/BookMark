import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto, userId: string) {
    const newBook = this.bookRepository.create({
      ...createBookDto,
      userId: userId,
    });
    return await this.bookRepository.save(newBook);
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
    Object.assign(book, updateBookDto);
    return await this.bookRepository.save(book);
  }

  async remove(id: number, userId: string) {
    const book = await this.findOne(id, userId);
    await this.bookRepository.remove(book);
    return { deleted: true };
  }
}
