import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, MoreThan, Repository } from 'typeorm';
import { StoreInventory } from '../entities/store-inventory.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../entities/user.entity';
import { LibraryEvent } from '../entities/library-event.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';

@Injectable()
export class LibrerosService {
  constructor(
    @InjectRepository(StoreInventory)
    private readonly inventoryRepository: Repository<StoreInventory>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LibraryEvent)
    private readonly eventRepository: Repository<LibraryEvent>,
    @InjectRepository(EventRegistration)
    private readonly registrationRepository: Repository<EventRegistration>,
  ) {}

  // Catálogo/Inventario
  async addToInventory(
    libreroId: string,
    bookId: string,
    data: { price: number; inStock: boolean },
  ): Promise<StoreInventory> {
    const numericBookId = Number(bookId);

    const bookToAdd = await this.bookRepository.findOne({
      where: { id: numericBookId },
    });
    if (!bookToAdd) throw new NotFoundException('El libro no existe');

    const duplicate = await this.inventoryRepository.findOne({
      where: [
        // Regla 1: Mismo ID de libro
        { librero: { id: libreroId }, book: { id: numericBookId } },
        // Regla 2: Mismo ISBN
        ...(bookToAdd.isbn
          ? [{ librero: { id: libreroId }, book: { isbn: bookToAdd.isbn } }]
          : []),
        // Regla 3: Mismo Título Y mismo Autor
        {
          librero: { id: libreroId },
          book: { title: bookToAdd.title, author: bookToAdd.author },
        },
      ],
      relations: ['book'],
    });

    if (duplicate) {
      throw new BadRequestException(
        `Ya tienes este libro en tu catálogo (registrado como: ${duplicate.book.title})`,
      );
    }

    const newItem = this.inventoryRepository.create({
      librero: { id: libreroId } as User,
      book: bookToAdd,
      price: data.price,
      inStock: data.inStock,
    });

    return this.inventoryRepository.save(newItem);
  }

  async updateInventoryItem(
    libreroId: string,
    inventoryId: string,
    data: { price: number; inStock: boolean },
  ) {
    const item = await this.inventoryRepository.findOne({
      where: { id: inventoryId, librero: { id: libreroId } },
    });
    if (!item) throw new NotFoundException('Producto no encontrado');

    item.price = data.price;
    item.inStock = data.inStock;
    return this.inventoryRepository.save(item);
  }

  async getMyInventory(libreroId: string): Promise<StoreInventory[]> {
    return this.inventoryRepository.find({
      where: { librero: { id: libreroId } },
      relations: ['book'],
      order: { createdAt: 'DESC' },
    });
  }

  async removeFromInventory(
    libreroId: string,
    inventoryId: string,
  ): Promise<void> {
    const item = await this.inventoryRepository.findOne({
      where: { id: inventoryId, librero: { id: libreroId } },
    });

    if (!item)
      throw new NotFoundException('Producto no encontrado en tu stock');

    await this.inventoryRepository.remove(item);
  }

  async getInventoryCount(libreroId: string): Promise<number> {
    return this.inventoryRepository.count({
      where: { librero: { id: libreroId } },
    });
  }

  async getStats(libreroId: string) {
    const totalBooks = await this.inventoryRepository.count({
      where: { librero: { id: libreroId } },
    });
    const activeEvents = await this.eventRepository.count({
      where: { organizer: { id: libreroId } },
    });

    return {
      totalBooks,
      activeEvents,
      recentViews: Math.floor(Math.random() * 100),
    };
  }

  async updateProfile(
    libreroId: string,
    updateData: { libraryPhone?: string; librarySchedule?: string },
  ) {
    await this.usersRepository.update(libreroId, updateData);
    return this.usersRepository.findOne({ where: { id: libreroId } });
  }

  // BUSCAR LIBRERÍAS QUE TIENEN UN LIBRO ESPECÍFICO
  async findStoresByBook(bookId: string) {
    const referenceBook = await this.bookRepository.findOne({
      where: { id: Number(bookId) },
    });
    if (!referenceBook) return [];

    const inventoryItems = await this.inventoryRepository.find({
      where: {
        book: {
          title: referenceBook.title,
          author: referenceBook.author,
        },
        inStock: true,
      },
      relations: ['librero', 'book'],
    });

    return inventoryItems.map((item) => ({
      inventoryId: item.id,
      price: item.price,
      store: item.librero,
    }));
  }

  // Eventos/Quedadas físicas
  async createEvent(
    libreroId: string,
    data: Partial<LibraryEvent>,
  ): Promise<LibraryEvent> {
    const eventData: DeepPartial<LibraryEvent> = {
      ...data,
      organizer: { id: libreroId } as User,
    };

    const newEvent = this.eventRepository.create(eventData);

    return this.eventRepository.save(newEvent);
  }

  async getMyEvents(libreroId: string): Promise<any[]> {
    const events = await this.eventRepository.find({
      where: { organizer: { id: libreroId } },
      // Se cargan las inscripciones para poder contarlas
      relations: ['registrations'],
      order: { eventDate: 'ASC' },
    });

    return events.map((event) => ({
      ...event,
      attendeesCount: event.registrations?.length || 0,
    }));
  }

  async updateEvent(
    libreroId: string,
    eventId: string,
    data: Partial<LibraryEvent>,
  ): Promise<LibraryEvent> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizer: { id: libreroId } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    Object.assign(event, data);
    return this.eventRepository.save(event);
  }

  async deleteEvent(libreroId: string, eventId: string): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizer: { id: libreroId } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    await this.eventRepository.remove(event);
  }

  async getAllFutureEvents(): Promise<any[]> {
    const events = await this.eventRepository.find({
      where: { eventDate: MoreThan(new Date()) },
      relations: ['organizer', 'registrations', 'registrations.user'], // Cargamos las inscripciones
      order: { eventDate: 'ASC' },
    });

    return events.map((event) => ({
      ...event,
      attendeesCount: event.registrations?.length || 0,
    }));
  }

  async joinEvent(userId: string, eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['registrations'],
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    // Validar si ya está apuntado
    const isAlreadyJoined = event.registrations.some(
      (reg) => reg.user?.id === userId,
    );
    if (isAlreadyJoined)
      throw new BadRequestException('Ya estás apuntado a este evento');

    // Validar aforo
    if (event.maxCapacity && event.registrations.length >= event.maxCapacity) {
      throw new BadRequestException('Evento lleno');
    }

    const registration = this.registrationRepository.create({
      user: { id: userId } as User,
      event: { id: eventId } as LibraryEvent,
    });

    return this.registrationRepository.save(registration);
  }

  async getEventAttendees(libreroId: string, eventId: string) {
    const event = await this.eventRepository.findOne({
      where: {
        id: eventId,
        organizer: { id: libreroId }, // El evento pertenece a este librero
      },
      relations: ['registrations', 'registrations.user'],
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado o no tienes permiso');
    }

    return event.registrations.map((reg) => reg.user);
  }
}
