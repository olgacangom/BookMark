import { Test, TestingModule } from '@nestjs/testing';
import { LibrerosService } from './libreros.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  let inventoryRepo: any;
  let bookRepo: any;
  let userRepo: any;
  let eventRepo: any;
  let registrationRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibrerosService,
        {
          provide: getRepositoryToken(StoreInventory),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Book),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LibraryEvent),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventRegistration),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(LibrerosService);

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
    bookRepo.findOne.mockResolvedValue({
      id: 1,
      title: 'Book',
      author: 'A',
      isbn: '123',
    });

    inventoryRepo.findOne.mockResolvedValue({ book: { title: 'Book' } });

    await expect(
      service.addToInventory('l1', '1', { price: 10, inStock: true }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create inventory item', async () => {
    bookRepo.findOne.mockResolvedValue({
      id: 1,
      title: 'Book',
      author: 'A',
      isbn: null,
    });

    inventoryRepo.findOne.mockResolvedValue(null);
    inventoryRepo.create.mockReturnValue({ id: 'inv1' });
    inventoryRepo.save.mockResolvedValue({ id: 'inv1' });

    const res = await service.addToInventory('l1', '1', {
      price: 20,
      inStock: true,
    });

    expect(res).toEqual({ id: 'inv1' });
  });

  it('should update inventory item', async () => {
    inventoryRepo.findOne.mockResolvedValue({ id: 'i1' });
    inventoryRepo.save.mockResolvedValue({ id: 'i1', price: 99 });

    const res = await service.updateInventoryItem('l1', 'i1', {
      price: 99,
      inStock: false,
    });

    expect(res.price).toBe(99);
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
    inventoryRepo.findOne.mockResolvedValue({ id: 'i1' });
    inventoryRepo.remove.mockResolvedValue(undefined);

    await expect(service.removeFromInventory('l1', 'i1')).resolves.toBeUndefined();
  });

  it('should throw when removing missing item', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(
      service.removeFromInventory('l1', 'i1'),
    ).rejects.toThrow(NotFoundException);
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
    userRepo.update.mockResolvedValue(undefined);
    userRepo.findOne.mockResolvedValue({ id: 'l1' });

    const res = await service.updateProfile('l1', {
      libraryPhone: '123',
    });

    expect(res).toEqual({ id: 'l1' });
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
    eventRepo.create.mockReturnValue({ id: 'e1' });
    eventRepo.save.mockResolvedValue({ id: 'e1' });

    const res = await service.createEvent('l1', { title: 'event' });

    expect(res.id).toBe('e1');
  });

  it('should get my events with attendees count', async () => {
    eventRepo.find.mockResolvedValue([
      { registrations: [1, 2], eventDate: new Date() },
    ]);

    const res = await service.getMyEvents('l1');

    expect(res[0].attendeesCount).toBe(2);
  });

  it('should update event', async () => {
    eventRepo.findOne.mockResolvedValue({ id: 'e1' });
    eventRepo.save.mockResolvedValue({ id: 'e1', title: 'updated' });

    const res = await service.updateEvent('l1', 'e1', { title: 'updated' });

    expect(res.title).toBe('updated');
  });

  it('should delete event', async () => {
    eventRepo.findOne.mockResolvedValue({ id: 'e1' });
    eventRepo.remove.mockResolvedValue(undefined);

    await expect(
      service.deleteEvent('l1', 'e1'),
    ).resolves.toBeUndefined();
  });

  it('should throw when deleting missing event', async () => {
    eventRepo.findOne.mockResolvedValue(null);

    await expect(
      service.deleteEvent('l1', 'e1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should join event successfully', async () => {
    eventRepo.findOne.mockResolvedValue({
      id: 'e1',
      registrations: [],
      maxCapacity: 10,
    });

    registrationRepo.create.mockReturnValue({ id: 'r1' });
    registrationRepo.save.mockResolvedValue({ id: 'r1' });

    const res = await service.joinEvent('u1', 'e1');

    expect(res.id).toBe('r1');
  });

  it('should not allow duplicate join', async () => {
    eventRepo.findOne.mockResolvedValue({
      id: 'e1',
      registrations: [{ user: { id: 'u1' } }],
      maxCapacity: 10,
    });

    await expect(
      service.joinEvent('u1', 'e1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should not allow full event', async () => {
    eventRepo.findOne.mockResolvedValue({
      id: 'e1',
      registrations: [{}, {}],
      maxCapacity: 2,
    });

    await expect(
      service.joinEvent('u1', 'e1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return event attendees', async () => {
    eventRepo.findOne.mockResolvedValue({
      registrations: [{ user: { id: 'u1' } }],
    });

    const res = await service.getEventAttendees('l1', 'e1');

    expect(res).toEqual([{ id: 'u1' }]);
  });

  it('should throw when event not found for attendees', async () => {
    eventRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getEventAttendees('l1', 'e1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return my inventory list (covers find)', async () => {
    inventoryRepo.find.mockResolvedValue([
      { id: 'i1', book: { id: 1 } },
    ]);

    const res = await service.getMyInventory('l1');

    expect(inventoryRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { librero: { id: 'l1' } },
      }),
    );

    expect(res).toEqual([{ id: 'i1', book: { id: 1 } }]);
  });

  it('should return empty array when reference book does not exist', async () => {
    bookRepo.findOne.mockResolvedValue(null);

    const res = await service.findStoresByBook('1');

    expect(res).toEqual([]);
    expect(inventoryRepo.find).not.toHaveBeenCalled();
  });

  it('should return stores that have the book', async () => {
    bookRepo.findOne.mockResolvedValue({
      id: 1,
      title: 'Book A',
      author: 'Author A',
    });

    inventoryRepo.find.mockResolvedValue([
      {
        id: 'inv1',
        price: 10,
        librero: { id: 'l1', name: 'Store 1' },
      },
    ]);

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
        store: { id: 'l1', name: 'Store 1' },
      },
    ]);
  });

  it('should return future events with attendees count', async () => {
    const futureDate = new Date(Date.now() + 1000000);

    eventRepo.find.mockResolvedValue([
      {
        id: 'e1',
        eventDate: futureDate,
        registrations: [{ id: 1 }, { id: 2 }],
        organizer: { id: 'l1' },
      },
    ]);

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