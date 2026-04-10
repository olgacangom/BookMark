import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './entities/user.entity';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  icon: string;

  @Column()
  requirementType: string;

  @Column()
  requirementValue: number;

  @ManyToMany(() => User, (user) => user.badges)
  users: User[];
}
