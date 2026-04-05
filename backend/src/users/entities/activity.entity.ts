import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from '../../books/entities/book.entity';

export enum ActivityType {
  FOLLOW = 'FOLLOW',
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_FINISHED = 'BOOK_FINISHED',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @ManyToOne(() => User, { nullable: true })
  targetUser: User;

  @ManyToOne(() => Book, { nullable: true, onDelete: 'CASCADE' })
  targetBook: Book;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
