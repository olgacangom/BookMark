import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BookStatus } from '../enum/book-status.enum';
import { User } from '../../users/entities/user.entity';

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

  @Column() 
  genre: string;

  @ManyToOne(() => User, (user) => user.books)
  user: User;

  @Column()
  userId: string;
}
