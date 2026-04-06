import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { GoogleBooksService } from './google-books/google-books.service';
import { ActivitiesService } from 'src/users/activities.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BookStatus } from './enum/book-status.enum';
import { ActivityType } from 'src/users/entities/activity.entity';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

describe('BooksService', () => {
  let service: BooksService;
  let repo: MockType<Repository<Book>>;
  let googleService: MockType<GoogleBooksService>;
  let activitiesService: MockType<ActivitiesService>;
  let eventEmitter: MockType<EventEmitter2>;

  const mockUserId = 'user-123';

  const mockBook = {
    id: 1,
    title: 'Don Quijote',
    author: 'Cervantes',
    status: BookStatus.WANT_TO_READ,
    userId: mockUserId,
  } as Book;

  const mockRepoFactory = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: mockRepoFactory() },
        {
          provide: GoogleBooksService,
          useValue: { findByIsbn: jest.fn() },
        },
        {
          provide: ActivitiesService,
          useValue: { create: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repo = module.get(getRepositoryToken(Book));
    googleService = module.get(GoogleBooksService);
    activitiesService = module.get(ActivitiesService);
    eventEmitter = module.get(EventEmitter2);

    repo.create?.mockReturnValue(mockBook);
    repo.save?.mockImplementation((val) => Promise.resolve(val));
    repo.find?.mockResolvedValue([mockBook]);
    repo.findOne?.mockResolvedValue(mockBook);
    repo.remove?.mockResolvedValue({ deleted: true });

    googleService.findByIsbn?.mockResolvedValue({ title: 'Google Book' });
    activitiesService.create?.mockResolvedValue({});
  });

  describe('searchByIsbn', () => {
    it('debe llamar a googleBooksService.findByIsbn', async () => {
      const result = await service.searchByIsbn('12345');
      expect(googleService.findByIsbn).toHaveBeenCalledWith('12345');
      expect(result.title).toBe('Google Book');
    });
  });

  describe('create', () => {
    const createDto: CreateBookDto = {
      title: 'Nuevo Libro',
      author: 'Cervantes',
      genre: 'Novela',
      isbn: '123456789',
      status: BookStatus.READ,
      description: '',
      pageCount: 0,
      urlPortada: '',
    };

    it('debe crear un libro y registrar la actividad exitosamente', async () => {
      repo.create?.mockReturnValue({ ...mockBook, title: 'Nuevo Libro' });
      const result = await service.create(createDto, mockUserId);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(activitiesService.create).toHaveBeenCalledWith(
        mockUserId,
        ActivityType.BOOK_ADDED,
        mockBook.id.toString(),
      );
      expect(result.title).toBe('Nuevo Libro');
    });

    it('debe capturar errores en ActivitiesService (instanceof Error)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      activitiesService.create?.mockRejectedValue(new Error('Fallo'));

      await service.create(createDto, mockUserId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al registrar actividad:',
        'Fallo',
      );
      consoleSpy.mockRestore();
    });

    it('debe capturar errores en ActivitiesService (string)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      activitiesService.create?.mockRejectedValue('Error String');

      await service.create(createDto, mockUserId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al registrar actividad:',
        'Error String',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('debe devolver un array de libros del usuario', async () => {
      const result = await service.findAll(mockUserId);
      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual([mockBook]);
    });
  });

  describe('findOne', () => {
    it('debe devolver el libro si existe', async () => {
      const result = await service.findOne(1, mockUserId);
      expect(result).toEqual(mockBook);
    });

    it('debe lanzar NotFoundException si el libro no existe', async () => {
      repo.findOne?.mockResolvedValue(null);
      await expect(service.findOne(99, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar los campos y devolver el objeto actualizado', async () => {
      const updateDto: UpdateBookDto = { title: 'Nuevo Titulo' };
      repo.findOne?.mockResolvedValue({ ...mockBook });

      const result = await service.update(1, updateDto, mockUserId);

      expect(result.title).toBe('Nuevo Titulo');
      expect(repo.save).toHaveBeenCalled();
    });

    it('debe emitir evento si el estado cambia a READ', async () => {
      const updateDto: UpdateBookDto = { status: BookStatus.READ };
      repo.findOne?.mockResolvedValue({
        ...mockBook,
        status: BookStatus.WANT_TO_READ,
      });

      await service.update(1, updateDto, mockUserId);

      expect(eventEmitter.emit).toHaveBeenCalledWith('book.finished', {
        userId: mockUserId,
        points: 150,
      });
    });

    it('NO debe emitir evento si el libro ya estaba en estado READ', async () => {
      const updateDto: UpdateBookDto = { status: BookStatus.READ };
      repo.findOne?.mockResolvedValue({ ...mockBook, status: BookStatus.READ });

      await service.update(1, updateDto, mockUserId);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe buscar el libro y luego eliminarlo', async () => {
      repo.findOne?.mockResolvedValue(mockBook);
      const result = await service.remove(1, mockUserId);

      expect(repo.remove).toHaveBeenCalledWith(mockBook);
      expect(result).toEqual({ deleted: true });
    });
  });
});
