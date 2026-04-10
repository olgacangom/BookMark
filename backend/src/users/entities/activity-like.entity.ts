import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('activity_likes')
@Unique(['user', 'activity'])
export class ActivityLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Activity, (activity) => activity.likes, {
    onDelete: 'CASCADE',
  })
  activity: Activity;

  @CreateDateColumn()
  createdAt: Date;
}
