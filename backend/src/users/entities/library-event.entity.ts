import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
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

  @OneToMany(() => EventRegistration, (reg) => reg.event)
  registrations: EventRegistration[];

  @Column({ type: 'int', default: 0 })
  @CreateDateColumn()
  createdAt: Date;
}
