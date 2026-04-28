import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('library_events')
export class LibraryEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  eventDate: Date;

  @Column({ nullable: true })
  maxCapacity: number;

  @ManyToOne(() => User, (user) => user.id)
  organizer: User;

  @CreateDateColumn()
  createdAt: Date;
}
