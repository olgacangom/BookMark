import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Thread } from './thread.entity';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @ManyToOne(() => User)
  creator: User;

  @ManyToMany(() => User, (user) => user.clubs)
  @JoinTable()
  members: User[];

  @OneToMany(() => Thread, (thread) => thread.club)
  threads: Thread[];

  @CreateDateColumn()
  createdAt: Date;
}
