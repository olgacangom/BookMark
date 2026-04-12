import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bookstores')
export class Bookstore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  webUrl: string;
}
