import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_stats')
export class UserStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  xp: number = 0;

  @Column({ default: 1 })
  level: number = 1;

  @Column({ default: 0 })
  totalBooksFinished: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityDate: Date;

  @OneToOne(() => User, (user) => user.stats, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
