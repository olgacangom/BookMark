import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('activity_ignores')
@Unique(['user', 'activity'])
export class ActivityIgnore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  activity: Activity;

  @CreateDateColumn()
  createdAt: Date;
}
