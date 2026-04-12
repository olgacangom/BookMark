import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BookStatus } from '../enum/book-status.enum';
import { User } from '../../users/entities/user.entity';
import { Note } from './note.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.WANT_TO_READ,
  })
  status: BookStatus;

  @Column({ nullable: true })
  genre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  pageCount: number;

  @Column({ nullable: true })
  urlPortada: string;

  @Column({ type: 'int', default: 0, nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @Column({ default: 0 })
  currentPage: number;

  @ManyToOne(() => User, (user) => user.books)
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Note, (note) => note.book)
  notes: Note[];
}
