/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { GoogleBooksService } from './google-books/google-books.service';
import { ActivitiesService } from '../users/activities.service';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BookStatus } from './enum/book-status.enum';
import { ActivityType } from '../users/entities/activity.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<Repository<Book>>;
  let googleService: jest.Mocked<GoogleBooksService>;
  let activitiesService: jest.Mocked<ActivitiesService>;

  const mockUserId = 'user-123';
  const mockBook = {
    id: 1,
    title: 'Test',
    author: 'A',
    status: BookStatus.WANT_TO_READ,
    userId: mockUserId,
  } as Book;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: GoogleBooksService, useValue: { findByIsbn: jest.fn() } },
        { provide: ActivitiesService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get(BooksService);
    repository = module.get(getRepositoryToken(Book));
    googleService = module.get(GoogleBooksService);
    activitiesService = module.get(ActivitiesService);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    const dto = {
      title: 'New',
      author: 'A',
      isbn: '123',
    } as unknown as CreateBookDto;

    it('debe crear y registrar actividad', async () => {
      repository.create.mockReturnValue(mockBook);
      repository.save.mockResolvedValue(mockBook);
      await service.create(dto, mockUserId);
      expect(activitiesService.create).toHaveBeenCalledWith(
        mockUserId,
        ActivityType.BOOK_ADDED,
        '1',
      );
    });

    it('debe capturar error (instancia de Error) si falla actividad al crear', async () => {
      repository.save.mockResolvedValue(mockBook);
      activitiesService.create.mockRejectedValue(new Error('Error de Objeto'));

      await service.create(dto, mockUserId);

      expect(console.error).toHaveBeenCalledWith(
        'Error al registrar actividad:',
        'Error de Objeto',
      );
    });

    it('debe capturar error (string/desconocido) si falla actividad al crear', async () => {
      repository.save.mockResolvedValue(mockBook);
      activitiesService.create.mockRejectedValue('Error de String');

      await service.create(dto, mockUserId);

      expect(console.error).toHaveBeenCalledWith(
        'Error al registrar actividad:',
        'Error de String',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar campos dinámicamente y disparar actividad', async () => {
      repository.findOne.mockResolvedValue({ ...mockBook });
      repository.save.mockImplementation((b) =>
        Promise.resolve({ ...b, id: 1 } as Book),
      );

      const res = await service.update(
        1,
        { status: BookStatus.READ } as UpdateBookDto,
        mockUserId,
      );

      expect(res.status).toBe(BookStatus.READ);
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('debe capturar error si falla actividad al actualizar', async () => {
      repository.findOne.mockResolvedValue({
        ...mockBook,
        status: BookStatus.WANT_TO_READ,
      });
      repository.save.mockResolvedValue({
        ...mockBook,
        id: 1,
        status: BookStatus.READ,
      });
      activitiesService.create.mockRejectedValue(new Error('Update Fail'));

      await service.update(
        1,
        { status: BookStatus.READ } as UpdateBookDto,
        mockUserId,
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error al registrar actividad:',
        'Update Fail',
      );
    });

    it('no debe disparar actividad si ya era READ', async () => {
      repository.findOne.mockResolvedValue({
        ...mockBook,
        status: BookStatus.READ,
      });
      await service.update(
        1,
        { status: BookStatus.READ } as UpdateBookDto,
        mockUserId,
      );
      expect(activitiesService.create).not.toHaveBeenCalled();
    });
  });

  it('findAll: debe retornar libros', async () => {
    repository.find.mockResolvedValue([mockBook]);
    const res = await service.findAll(mockUserId);
    expect(res).toHaveLength(1);
  });

  it('findOne: debe lanzar 404', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(1, '1')).rejects.toThrow(NotFoundException);
  });

  it('remove: debe eliminar libro', async () => {
    repository.findOne.mockResolvedValue(mockBook);
    const res = await service.remove(1, '1');
    expect(res).toEqual({ deleted: true });
    expect(repository.remove).toHaveBeenCalled();
  });

  it('searchByIsbn: debe usar googleService', async () => {
    googleService.findByIsbn.mockResolvedValue({
      title: 'G',
    } as unknown as any);
    await service.searchByIsbn('123');
    expect(googleService.findByIsbn).toHaveBeenCalled();
  });
});
