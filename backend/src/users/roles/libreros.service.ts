import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreInventory } from '../entities/store-inventory.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class LibrerosService {
  constructor(
    @InjectRepository(StoreInventory)
    private readonly inventoryRepository: Repository<StoreInventory>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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

    return {
      totalBooks,
      activeEvents: 0,
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
}
