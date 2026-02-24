import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users') // Esto le dice a Supabase que cree una tabla llamada 'users'
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  username: string;
}