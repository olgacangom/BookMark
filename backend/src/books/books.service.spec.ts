import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { BookStatus } from './enum/book-status.enum';
import { NotFoundException } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('BooksService', () => {
  let service: BooksService;
  let repository: MockRepository<Book>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<MockRepository<Book>>(getRepositoryToken(Book));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new book', async () => {
    const dto: CreateBookDto = {
      title: 'Moby Dick',
      author: 'Herman Melville',
      status: BookStatus.WANT_TO_READ,
    };
    const userId = 'user-uuid';
    const result = await service.create(dto, userId);

    expect(result).toHaveProperty('id');
    expect(result.userId).toBe(userId);
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
    (mockBookRepository.findOne as jest.Mock).mockResolvedValue(mockBook);
    const result = await service.findOne(1, 'user-1');
    expect(result).toEqual(mockBook);
  });

  it('should throw NotFoundException if book not found', async () => {
    (mockBookRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne(999, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a book', async () => {
    (mockBookRepository.findOne as jest.Mock).mockResolvedValue(mockBook);
    (mockBookRepository.save as jest.Mock).mockResolvedValue({
      ...mockBook,
      title: 'Updated',
    });

    const result = await service.update(1, { title: 'Updated' }, 'user-1');
    expect(result.title).toBe('Updated');
  });

  it('should remove a book', async () => {
    (mockBookRepository.findOne as jest.Mock).mockResolvedValue(mockBook);
    (mockBookRepository.remove as jest.Mock).mockResolvedValue(mockBook);

    const result = await service.remove(1, 'user-1');
    expect(result).toEqual({ deleted: true });
  });
});
