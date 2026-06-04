import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('poll_votes')
export class PollVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  activity: Activity;

  @Column()
  optionIndex: number;
}
