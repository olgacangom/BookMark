import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { BookListing } from './book-listing.entity';
import { User } from './user.entity';

@Entity('sustainability_requests')
export class SustainabilityRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BookListing, { onDelete: 'CASCADE' })
  listing: BookListing; // El libro anunciado

  @ManyToOne(() => User)
  requester: User; // El que lo quiere

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
