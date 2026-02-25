import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // Seguridad: los UUID evitan que se adivine el número de usuarios
  id: string;

  @Column({ unique: true }) 
  email: string;

  @Column()
  @Exclude() // Seguridad: evita que el hash de la contraseña se filtre en las respuestas de la API
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}