import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from '../../books/entities/book.entity';

export enum ListingType {
  SALE = 'sale',
  LOAN = 'loan',
}

export enum BookCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  WORN = 'worn',
}

@Entity('book_listings')
export class BookListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User; // Quién lo vende/cambia

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  book: Book;

  @Column({
    type: 'enum',
    enum: ListingType,
    default: ListingType.SALE,
  })
  type: ListingType;

  @Column({ type: 'int', nullable: true })
  maxLoanDays: number;

  @Column({
    type: 'enum',
    enum: BookCondition,
    default: BookCondition.GOOD,
  })
  condition: BookCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number; // 0 si es intercambio

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
