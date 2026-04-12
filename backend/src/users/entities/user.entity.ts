import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Book } from '../../books/entities/book.entity';
import { Follow, FollowStatus } from './follow.entity';
import { UserStats } from './user-stats.entity';
import { Badge } from '../badge.entity';
import { Club } from 'src/club/entities/club.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true }) // Por defecto el perfil es público
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Book, (book) => book.user)
  books: Book[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Follow, (follow) => follow.following)
  followerRelations: Follow[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  followingRelations: Follow[];

  @OneToOne(() => UserStats, (stats) => stats.user, { cascade: true })
  stats!: UserStats;

  @ManyToMany(() => Badge, (badge) => badge.users)
  @JoinTable()
  badges: Badge[];

  @ManyToMany(() => Club, (club) => club.members)
  clubs: Club[];

  @Expose()
  get followers() {
    return (
      this.followerRelations
        ?.filter((f) => f.status === FollowStatus.ACCEPTED)
        .map((f) => f.follower) || []
    );
  }

  @Expose()
  get following() {
    return (
      this.followingRelations
        ?.filter((f) => f.status === FollowStatus.ACCEPTED)
        .map((f) => f.following) || []
    );
  }
}
