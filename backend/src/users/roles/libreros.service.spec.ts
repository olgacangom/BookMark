import { Test, TestingModule } from '@nestjs/testing';
import { LibrerosService } from './libreros.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral, UpdateResult } from 'typeorm';
import { StoreInventory } from '../entities/store-inventory.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../entities/user.entity';
import { LibraryEvent } from '../entities/library-event.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('LibrerosService', () => {
  let service: LibrerosService;

  let inventoryRepo: jest.Mocked<Repository<StoreInventory>>;
  let bookRepo: jest.Mocked<Repository<Book>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let eventRepo: jest.Mocked<Repository<LibraryEvent>>;
  let registrationRepo: jest.Mocked<Repository<EventRegistration>>;

  const createMockRepository = <T extends ObjectLiteral>(): jest.Mocked<
    Repository<T>
  > =>
    ({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    }) as unknown as jest.Mocked<Repository<T>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibrerosService,
        {
          provide: getRepositoryToken(StoreInventory),
          useValue: createMockRepository<StoreInventory>(),
        },
        {
          provide: getRepositoryToken(Book),
          useValue: createMockRepository<Book>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: getRepositoryToken(LibraryEvent),
          useValue: createMockRepository<LibraryEvent>(),
        },
        {
          provide: getRepositoryToken(EventRegistration),
          useValue: createMockRepository<EventRegistration>(),
        },
      ],
    }).compile();

    service = module.get<LibrerosService>(LibrerosService);
    inventoryRepo = module.get(getRepositoryToken(StoreInventory));
    bookRepo = module.get(getRepositoryToken(Book));
    userRepo = module.get(getRepositoryToken(User));
    eventRepo = module.get(getRepositoryToken(LibraryEvent));
    registrationRepo = module.get(getRepositoryToken(EventRegistration));
  });

  /* =========================================================
   * INVENTARIO
   * ========================================================= */

  it('should throw if book does not exist', async () => {
    bookRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addToInventory('l1', '1', { price: 10, inStock: true }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw conflict if duplicate by id', async () => {
    bookRepo.findOne.mockResolvedValue({ id: 1 } as Book);

    inventoryRepo.findOne.mockResolvedValue({
      id: 'existing-inv',
      book: { title: 'Libro Duplicado' },
    } as StoreInventory);

    await expect(
      service.addToInventory('l1', '1', { price: 10, inStock: true }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create inventory item', async () => {
    bookRepo.findOne.mockResolvedValue({
      id: 1,
      title: 'Book',
      author: 'A',
    } as Partial<Book> as Book);

    inventoryRepo.findOne.mockResolvedValue(null);
    const mockInventoryItem = {
      id: 'inv1',
      price: 20,
      inStock: true,
      librero: { id: 'l1' },
      book: { id: 1 },
    } as StoreInventory;
    inventoryRepo.create.mockReturnValue(mockInventoryItem);
    inventoryRepo.save.mockResolvedValue(mockInventoryItem);

    const res = await service.addToInventory('l1', '1', {
      price: 20,
      inStock: true,
    });

    expect(res).toEqual(
      expect.objectContaining({
        id: 'inv1',
        price: 20,
        inStock: true,
      }),
    );
  });

  it('should update inventory item', async () => {
    const mockItem = {
      id: 'i1',
      price: 50,
      inStock: true,
    } as StoreInventory;

    inventoryRepo.findOne.mockResolvedValue(mockItem);
    inventoryRepo.save.mockResolvedValue({
      ...mockItem,
      price: 99,
      inStock: false,
    } as StoreInventory);

    const res = await service.updateInventoryItem('l1', 'i1', {
      price: 99,
      inStock: false,
    });

    expect(res.price).toBe(99);
    expect(res.inStock).toBe(false);
  });

  it('should throw when updating missing item', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateInventoryItem('l1', 'i1', {
        price: 1,
        inStock: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should remove inventory item', async () => {
    const mockItem = {
      id: 'i1',
      librero: { id: 'l1' },
    } as StoreInventory;
    inventoryRepo.findOne.mockResolvedValue(mockItem);
    inventoryRepo.remove.mockResolvedValue(mockItem);

    await expect(
      service.removeFromInventory('l1', 'i1'),
    ).resolves.toBeUndefined();
    expect(inventoryRepo.remove).toHaveBeenCalledWith(mockItem);
  });

  it('should throw when removing missing item', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(service.removeFromInventory('l1', 'i1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return inventory count', async () => {
    inventoryRepo.count.mockResolvedValue(5);

    const res = await service.getInventoryCount('l1');

    expect(res).toBe(5);
  });

  it('should return stats with random views', async () => {
    inventoryRepo.count.mockResolvedValue(2);
    eventRepo.count.mockResolvedValue(3);

    const res = await service.getStats('l1');

    expect(res.totalBooks).toBe(2);
    expect(res.activeEvents).toBe(3);
    expect(typeof res.recentViews).toBe('number');
  });

  it('should update profile and return user', async () => {
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    userRepo.update.mockResolvedValue(updateResult);

    const mockUser = {
      id: 'l1',
      email: 'test@libreria.com',
      fullName: 'Librero Test',
    } as User;

    userRepo.findOne.mockResolvedValue(mockUser);

    const res = await service.updateProfile('l1', {
      libraryPhone: '123',
    });

    expect(res).toEqual(mockUser);
  });

  /* =========================================================
   * EVENTOS
   * ========================================================= */

  it('should throw validation errors on createEvent', async () => {
    await expect(
      service.createEvent('l1', { title: 'x'.repeat(60) }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createEvent('l1', { description: 'x'.repeat(200) }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createEvent('l1', { maxCapacity: -1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create event successfully', async () => {
    const mockEvent: LibraryEvent = {
      id: 'e1',
      title: 'event',
      description: 'description',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.create.mockReturnValue(mockEvent);
    eventRepo.save.mockResolvedValue(mockEvent);

    const res = await service.createEvent('l1', { title: 'event' });

    expect(res.id).toBe('e1');
  });

  it('should get my events with attendees count', async () => {
    const mockEvents: Partial<LibraryEvent>[] = [
      {
        registrations: [
          { id: 'reg1' } as EventRegistration,
          { id: 'reg2' } as EventRegistration,
        ],
        eventDate: new Date(),
      },
    ];

    eventRepo.find.mockResolvedValue(mockEvents as LibraryEvent[]);

    const res = await service.getMyEvents('l1');

    expect(res[0].attendeesCount).toBe(2);
  });

  it('should update event', async () => {
    const mockEvent: LibraryEvent = {
      id: 'e1',
      title: 'original',
      description: 'desc',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(mockEvent);

    eventRepo.save.mockResolvedValue({
      ...mockEvent,
      title: 'updated',
    });

    const res = await service.updateEvent('l1', 'e1', { title: 'updated' });

    expect(res.title).toBe('updated');
  });

  it('should delete event', async () => {
    const mockEvent: LibraryEvent = {
      id: 'e1',
      title: 'Event to delete',
      description: 'Description',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(mockEvent);
    eventRepo.remove.mockResolvedValue(mockEvent);

    await expect(service.deleteEvent('l1', 'e1')).resolves.toBeUndefined();
    expect(eventRepo.remove).toHaveBeenCalledWith(mockEvent);
  });

  it('should throw when deleting missing event', async () => {
    eventRepo.findOne.mockResolvedValue(null);

    await expect(service.deleteEvent('l1', 'e1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should join event successfully', async () => {
    const mockEvent: LibraryEvent = {
      id: 'e1',
      title: 'Evento de prueba',
      description: 'Descripción',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(mockEvent);

    const mockRegistration: EventRegistration = {
      id: 'r1',
      user: { id: 'u1' } as User,
      event: mockEvent,
      createdAt: new Date(),
    } as EventRegistration;

    registrationRepo.create.mockReturnValue(mockRegistration);
    registrationRepo.save.mockResolvedValue(mockRegistration);

    const res = await service.joinEvent('u1', 'e1');

    expect(res.id).toBe('r1');
  });

  it('should not allow duplicate join', async () => {
    const mockUser: User = {
      id: 'u1',
      email: 'user@test.com',
      fullName: 'Test User',
    } as User;

    const mockEvent: LibraryEvent = {
      id: 'e1',
      title: 'Evento',
      description: 'Desc',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [{ user: mockUser } as EventRegistration],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(mockEvent);

    await expect(service.joinEvent('u1', 'e1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should not allow full event', async () => {
    const registrationMock = {
      id: 'reg1',
      user: { id: 'u0' } as User,
      event: { id: 'e1' } as LibraryEvent,
      createdAt: new Date(),
    } as EventRegistration;

    const fullEvent: LibraryEvent = {
      id: 'e1',
      title: 'Evento Lleno',
      description: '...',
      eventDate: new Date(),
      maxCapacity: 2,
      organizer: { id: 'l1' } as User,
      registrations: [registrationMock, registrationMock],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(fullEvent);

    await expect(service.joinEvent('u1', 'e1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should return event attendees', async () => {
    const mockUser: User = {
      id: 'u1',
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'password123',
      province: 'Sevilla',
    } as User;

    const mockEvent = {
      id: 'e1',
      title: 'Evento',
      description: '...',
      eventDate: new Date(),
      maxCapacity: 10,
      organizer: { id: 'l1' } as User,
      registrations: [
        {
          id: 'reg1',
          user: mockUser,
          event: {} as LibraryEvent,
          createdAt: new Date(),
        } as EventRegistration,
      ],
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.findOne.mockResolvedValue(mockEvent);
    const res = await service.getEventAttendees('l1', 'e1');
    expect(res).toEqual([mockUser]);
  });

  it('should throw when event not found for attendees', async () => {
    eventRepo.findOne.mockResolvedValue(null);

    await expect(service.getEventAttendees('l1', 'e1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return my inventory list (covers find)', async () => {
    const mockBook: Book = {
      id: 1,
      title: 'Cien años de soledad',
      author: 'Gabriel García Márquez',
      isbn: '978-0307474728',
      status: 'available',
      genre: 'Realismo mágico',
      description: '...',
      pageCount: 400,
    } as unknown as Book;

    const mockInventory: StoreInventory = {
      id: 'i1',
      book: mockBook,
      librero: { id: 'l1' } as User,
      price: 15.0,
      inStock: true,
      createdAt: new Date(),
    } as StoreInventory;

    inventoryRepo.find.mockResolvedValue([mockInventory]);

    const res = await service.getMyInventory('l1');

    expect(inventoryRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { librero: { id: 'l1' } },
      }),
    );

    expect(res).toEqual([mockInventory]);
  });

  it('should return empty array when reference book does not exist', async () => {
    bookRepo.findOne.mockResolvedValue(null);

    const res = await service.findStoresByBook('1');

    expect(res).toEqual([]);
    expect(inventoryRepo.find).not.toHaveBeenCalled();
  });

  it('should return stores that have the book', async () => {
    const mockBook = {
      id: 1,
      title: 'Book A',
      author: 'Author A',
    } as unknown as Book;

    bookRepo.findOne.mockResolvedValue(mockBook);

    const mockInventory = {
      id: 'inv1',
      price: 10,
      librero: { id: 'l1' } as User,
      book: mockBook,
      inStock: true,
    } as unknown as StoreInventory;

    inventoryRepo.find.mockResolvedValue([mockInventory]);

    const res = await service.findStoresByBook('1');

    expect(inventoryRepo.find).toHaveBeenCalledWith({
      where: {
        book: {
          title: 'Book A',
          author: 'Author A',
        },
        inStock: true,
      },
      relations: ['librero', 'book'],
    });

    expect(res).toEqual([
      {
        inventoryId: 'inv1',
        price: 10,
        store: { id: 'l1' },
      },
    ]);
  });

  it('should return future events with attendees count', async () => {
    const futureDate = new Date(Date.now() + 1000000);

    const mockRegistrations: EventRegistration[] = [
      {
        id: '1',
        user: {} as User,
        event: {} as LibraryEvent,
        createdAt: new Date(),
      },
      {
        id: '2',
        user: {} as User,
        event: {} as LibraryEvent,
        createdAt: new Date(),
      },
    ];

    const mockEvent = {
      id: 'e1',
      title: 'Evento Futuro',
      description: '...',
      eventDate: futureDate,
      maxCapacity: 10,
      organizer: { id: 'l1', fullName: 'Librero' } as unknown as User,
      registrations: mockRegistrations,
      imageUrl: '',
      createdAt: new Date(),
    } as LibraryEvent;

    eventRepo.find.mockResolvedValue([mockEvent]);

    const res = await service.getAllFutureEvents();

    expect(eventRepo.find).toHaveBeenCalledWith({
      where: { eventDate: expect.anything() },
      relations: ['organizer', 'registrations', 'registrations.user'],
      order: { eventDate: 'ASC' },
    });

    expect(res).toEqual([
      expect.objectContaining({
        id: 'e1',
        attendeesCount: 2,
      }),
    ]);
  });
});
