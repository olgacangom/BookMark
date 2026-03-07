import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { BookStatus } from './enum/book-status.enum';
import { NotFoundException } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { GoogleBooksService } from './google-books/google-books.service';

type MockRepository<T extends ObjectLiteral> = {
  [P in keyof Repository<T>]?: jest.Mock;
};

describe('BooksService', () => {
  let service: BooksService;
  let repository: MockRepository<Book>;
  let googleService: Partial<Record<keyof GoogleBooksService, jest.Mock>>;

  const mockBook = {
    id: 1,
    title: 'Test Book',
    author: 'Author',
    userId: 'user-1',
  };

  const mockBookRepository: MockRepository<Book> = {
    create: jest.fn().mockImplementation((dto: CreateBookDto) => dto),
    save: jest
      .fn()
      .mockImplementation((book: Book) => Promise.resolve({ ...book, id: 1 })),
    find: jest.fn().mockResolvedValue([{ id: 1, title: 'Test Book' }]),
    findOne: jest.fn(),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  const mockGoogleBookService = {
    findByIsbn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
        {
          provide: GoogleBooksService,
          useValue: mockGoogleBookService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<MockRepository<Book>>(getRepositoryToken(Book));
    googleService = module.get(GoogleBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new book', async () => {
    const dto: CreateBookDto = {
      title: 'Moby Dick',
      author: 'Herman Melville',
      status: BookStatus.WANT_TO_READ,
      genre: '',
      description: '',
      pageCount: 0,
      urlPortada: '',
    };
    const userId = 'user-uuid';
    const result = await service.create(dto, userId);

    expect(result).toHaveProperty('id');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should return all books for a user', async () => {
    const userId = 'user-uuid';
    const result = await service.findAll(userId);

    expect(result).toBeInstanceOf(Array);
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId },
      order: { title: 'ASC' },
    });
  });

  it('should find one book', async () => {
    mockBookRepository.findOne!.mockResolvedValue(mockBook);
    const result = await service.findOne(1, 'user-1');
    expect(result).toEqual(mockBook);
  });

  it('should search by ISBN using GoogleBooksService', async () => {
    const isbn = '9781234567890';
    const googleResult = { title: 'Google Book', authors: ['Author'] };
    googleService.findByIsbn!.mockResolvedValue(googleResult);

    const result = await service.searchByIsbn(isbn);

    expect(googleService.findByIsbn).toHaveBeenCalledWith(isbn);
    expect(result).toEqual(googleResult);
  });

  it('should throw NotFoundException if book not found', async () => {
    mockBookRepository.findOne!.mockResolvedValue(null);
    await expect(service.findOne(999, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a book', async () => {
    mockBookRepository.findOne!.mockResolvedValue({ ...mockBook });
    mockBookRepository.save!.mockResolvedValue({
      ...mockBook,
      title: 'Updated',
    });

    const result = await service.update(1, { title: 'Updated' }, 'user-1');
    expect(result.title).toBe('Updated');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should remove a book', async () => {
    mockBookRepository.findOne!.mockResolvedValue(mockBook);
    mockBookRepository.remove!.mockResolvedValue(mockBook);

    const result = await service.remove(1, 'user-1');
    expect(result).toEqual({ deleted: true });
    expect(repository.remove).toHaveBeenCalled();
  });
});
