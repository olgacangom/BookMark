import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  userOne: User;

  @ManyToOne(() => User)
  userTwo: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @UpdateDateColumn()
  lastActivity: Date;
}
