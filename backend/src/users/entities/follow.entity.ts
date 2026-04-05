import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FollowStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('user_follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.followingRelations)
  follower: User;

  @ManyToOne(() => User, (user) => user.followerRelations)
  following: User;

  @Column({
    type: 'enum',
    enum: FollowStatus,
    default: FollowStatus.ACCEPTED,
  })
  status: FollowStatus;

  @CreateDateColumn()
  createdAt: Date;
}
