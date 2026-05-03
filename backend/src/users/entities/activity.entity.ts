import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from '../../books/entities/book.entity';
import { ActivityLike } from './activity-like.entity';
import { ActivityComment } from './activity-comment';

export enum ActivityType {
  FOLLOW = 'FOLLOW',
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_FINISHED = 'BOOK_FINISHED',
  POST = 'POST',
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
  targetUser: User | null;

  @ManyToOne(() => Book, { nullable: true, onDelete: 'CASCADE' })
  targetBook: Book | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ default: 0 })
  likesCount: number;

  @OneToMany(() => ActivityLike, (like) => like.activity)
  likes: ActivityLike[];

  @Column({ default: 0 })
  commentsCount: number;

  @OneToMany(() => ActivityComment, (comment) => comment.activity)
  comments: ActivityComment[];

  @Column({ type: 'text', nullable: true })
  content: string | null; // texto del post

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'json', nullable: true })
  pollOptions: string[] | null; // opciones encuesta post
}
