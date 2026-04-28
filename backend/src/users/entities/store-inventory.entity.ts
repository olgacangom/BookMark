import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from '../../books/entities/book.entity';

@Entity('store_inventory')
export class StoreInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  librero: User;

  @ManyToOne(() => Book, (book) => book.id, { onDelete: 'CASCADE' })
  book: Book;

  @Column({ default: true })
  inStock: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn()
  createdAt: Date;
}
