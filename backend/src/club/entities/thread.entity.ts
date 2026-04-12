import { Book } from 'src/books/entities/book.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Club } from './club.entity';
import { ThreadPost } from './thread-post.entity';

@Entity('threads')
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => Club, (club) => club.threads)
  club: Club;

  @ManyToOne(() => Book, { nullable: true })
  relatedBook: Book | null;

  @OneToMany(() => ThreadPost, (post) => post.thread)
  posts: ThreadPost[];
}
