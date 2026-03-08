import { Test, TestingModule } from '@nestjs/testing';
import { BooksController, RequestWithUser } from './books.controller';
import { BooksService } from './books.service';
import { BookStatus } from './enum/book-status.enum';
import { CreateBookDto } from './dto/create-book.dto';

describe('BooksController', () => {
  let controller: BooksController;

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    searchByIsbn: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq: RequestWithUser = {
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create service', async () => {
    const dto: CreateBookDto = {
      title: 'New Book',
      author: 'Author',
      status: BookStatus.READING,
      genre: 'Fantasía',
      description: '',
      pageCount: 0,
      urlPortada: '',
    };
    await controller.create(dto, mockReq);
    expect(mockBooksService.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should call findAll service', async () => {
    await controller.findAll(mockReq);
    expect(mockBooksService.findAll).toHaveBeenCalledWith('user-1');
  });

  it('should call search service', async () => {
    const isbn = '9788415594079';
    await controller.search(isbn);
    expect(mockBooksService.searchByIsbn).toHaveBeenCalledWith(isbn);
  });

  it('should call findOne service', async () => {
    await controller.findOne('1', mockReq);
    expect(mockBooksService.findOne).toHaveBeenCalledWith(1, 'user-1');
  });

  it('should call update service', async () => {
    const updateDto = { title: 'Updated Title' };
    await controller.update('1', updateDto, mockReq);
    expect(mockBooksService.update).toHaveBeenCalledWith(
      1,
      updateDto,
      'user-1',
    );
  });

  it('should call remove service', async () => {
    await controller.remove('1', mockReq);
    expect(mockBooksService.remove).toHaveBeenCalledWith(1, 'user-1');
  });
});
