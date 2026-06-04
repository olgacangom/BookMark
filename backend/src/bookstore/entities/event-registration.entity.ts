import { LibraryEvent } from 'src/users/entities/library-event.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('event_registrations')
@Unique(['user', 'event']) // Evita que alguien se apunte dos veces al mismo
export class EventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => LibraryEvent, (event) => event.registrations, {
    onDelete: 'CASCADE',
  })
  event: LibraryEvent;

  @CreateDateColumn()
  createdAt: Date;
}
