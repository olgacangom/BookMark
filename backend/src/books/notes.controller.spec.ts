import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { BooksService } from './books.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: { id: string };
}

describe('NotesController', () => {
  let controller: NotesController;
  let mockBooksService: jest.Mocked<BooksService>;

  const mockReq: RequestWithUser = { user: { id: 'user-1' } };

  beforeEach(async () => {
    jest.clearAllMocks();

    const serviceMock = {
      createNote: jest.fn(),
      findNotesByBook: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
    } as unknown as jest.Mocked<BooksService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: BooksService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    mockBooksService = module.get(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call booksService.createNote', async () => {
    await controller.create(1, 'contenido', mockReq);
    expect(mockBooksService.createNote).toHaveBeenCalledWith(
      1,
      'contenido',
      'user-1',
    );
  });

  it('findAllByBook should call booksService.findNotesByBook', async () => {
    await controller.findAllByBook(1, mockReq);
    expect(mockBooksService.findNotesByBook).toHaveBeenCalledWith(1, 'user-1');
  });

  it('update should call booksService.updateNote', async () => {
    await controller.update('n1', 'nuevo', mockReq);
    expect(mockBooksService.updateNote).toHaveBeenCalledWith(
      'n1',
      'nuevo',
      'user-1',
    );
  });

  it('remove should call booksService.deleteNote', async () => {
    await controller.remove('n1', mockReq);
    expect(mockBooksService.deleteNote).toHaveBeenCalledWith('n1', 'user-1');
  });
});
