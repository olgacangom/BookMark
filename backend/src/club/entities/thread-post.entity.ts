import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Thread } from './thread.entity';

@Entity('thread_posts')
export class ThreadPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  spoilerPage: number;

  @ManyToOne(() => User)
  author: User;

  @ManyToOne(() => Thread, (thread) => thread.posts)
  thread: Thread;

  @CreateDateColumn()
  createdAt: Date;
}
